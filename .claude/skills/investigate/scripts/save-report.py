#!/usr/bin/env python3
"""
investigate → issue 連携スクリプト

Usage:
  # 調査結果を保存（/investigate終了時に自動呼び出し）
  python3 save-report.py --save --title "認証機能追加" --summary "..." --report-path "..."

  # 調査結果を読み込み（/issue開始時に呼び出し）
  python3 save-report.py --load

  # 最新の調査結果をIssue用フォーマットで出力
  python3 save-report.py --format-issue
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# 定数
CACHE_DIR = Path.home() / ".claude" / "cache" / "investigations"
LATEST_LINK = CACHE_DIR / "latest.json"


def ensure_cache_dir():
    """キャッシュディレクトリを作成"""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def save_investigation(data: dict) -> Path:
    """調査結果を保存し、latest.json シンボリックリンクを更新"""
    ensure_cache_dir()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"investigation_{timestamp}.json"
    filepath = CACHE_DIR / filename

    # メタデータ追加
    data["timestamp"] = timestamp
    data["cwd"] = os.getcwd()

    # ファイル保存
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # latest.json シンボリックリンク更新
    if LATEST_LINK.is_symlink():
        LATEST_LINK.unlink()
    elif LATEST_LINK.exists():
        LATEST_LINK.unlink()
    LATEST_LINK.symlink_to(filepath)

    print(f"[investigate-hook] 調査結果を保存: {filepath}")
    print(f"[investigate-hook] latest.json を更新")

    return filepath


def load_latest() -> dict | None:
    """最新の調査結果を読み込み"""
    if not LATEST_LINK.exists():
        return None

    try:
        with open(LATEST_LINK, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return None


def format_for_issue(data: dict) -> str:
    """調査結果をIssue用フォーマットで出力"""
    if not data:
        return "調査データなし。/investigate を先に実行してください。"

    affected = data.get("affected_areas", [])
    affected_str = ", ".join(affected) if affected else "未特定"

    risks = data.get("risks", [])
    risks_str = "\n".join(f"- {r}" for r in risks) if risks else "- 特になし"

    approaches = data.get("approaches", [])
    approaches_str = ""
    for i, approach in enumerate(approaches):
        label = chr(ord('A') + i)  # A, B, C...
        approaches_str += f"""
### 案{label}: {approach.get('name', '未定義')}
- **概要**: {approach.get('summary', '')}
- **メリット**: {approach.get('pros', '')}
- **デメリット**: {approach.get('cons', '')}
- **想定工数**: {approach.get('effort', '中')}
"""

    recommended = data.get("recommended_approach", "案A")
    recommended_reason = data.get("recommended_reason", "調査結果に基づく")

    output = f"""## 📋 事前調査（自動挿入）

- **調査レポートリンク**: [{data.get('title', '調査')}]({data.get('report_path', '#')})
- **調査日時**: {data.get('timestamp', '不明')}
- **既存システム名**: {data.get('existing_system', '未指定')}

## 影響範囲（調査結果）
{affected_str}

## リスク（調査結果）
{risks_str}

## 🎯 ゴール候補（調査結果から自動生成）
{approaches_str if approaches_str else "（/investigate で案を定義してください）"}

### 暫定推奨
{recommended} - 理由: {recommended_reason}

### 成功指標（仮）
- [ ] {data.get('success_metric_1', '調査で特定した課題が解決される')}
- [ ] {data.get('success_metric_2', '影響範囲のテストがパスする')}

---
*この内容は /investigate から自動連携されました*
"""
    return output


def list_investigations(limit: int = 5) -> list[dict]:
    """過去の調査結果一覧を取得"""
    if not CACHE_DIR.exists():
        return []

    files = sorted(CACHE_DIR.glob("investigation_*.json"), reverse=True)
    result = []

    for f in files[:limit]:
        try:
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                data["filepath"] = str(f)
                result.append(data)
        except (json.JSONDecodeError, FileNotFoundError):
            continue

    return result


def main():
    parser = argparse.ArgumentParser(description="investigate → issue 連携スクリプト")
    parser.add_argument("--save", action="store_true", help="調査結果を保存")
    parser.add_argument("--load", action="store_true", help="最新の調査結果を読み込み")
    parser.add_argument("--format-issue", action="store_true", help="Issue用フォーマットで出力")
    parser.add_argument("--list", action="store_true", help="過去の調査一覧")

    # 保存用オプション
    parser.add_argument("--title", type=str, help="調査タイトル")
    parser.add_argument("--summary", type=str, help="調査サマリー")
    parser.add_argument("--report-path", type=str, help="レポートファイルパス")
    parser.add_argument("--recommended", type=str, help="推奨アプローチ")
    parser.add_argument("--recommended-reason", type=str, help="推奨理由")
    parser.add_argument("--affected", type=str, help="影響範囲（カンマ区切り）")
    parser.add_argument("--risks", type=str, help="リスク（カンマ区切り）")
    parser.add_argument("--existing-system", type=str, help="既存システム名")
    parser.add_argument("--approaches-json", type=str, help="アプローチ候補（JSON形式）")
    parser.add_argument("--branch", type=str, help="ブランチ名")

    args = parser.parse_args()

    if args.save:
        data = {
            "title": args.title or "無題の調査",
            "summary": args.summary or "",
            "report_path": args.report_path or "",
            "recommended_approach": args.recommended or "",
            "recommended_reason": args.recommended_reason or "",
            "affected_areas": args.affected.split(",") if args.affected else [],
            "risks": args.risks.split(",") if args.risks else [],
            "existing_system": args.existing_system or "",
            "next_action": "/issue",
            "branch": args.branch or ""
        }

        # アプローチ候補（JSON形式）
        if args.approaches_json:
            try:
                data["approaches"] = json.loads(args.approaches_json)
            except json.JSONDecodeError:
                data["approaches"] = []

        save_investigation(data)

    elif args.load:
        data = load_latest()
        if data:
            print(json.dumps(data, ensure_ascii=False, indent=2))
        else:
            print("調査データなし")
            sys.exit(1)

    elif args.format_issue:
        data = load_latest()
        print(format_for_issue(data))

    elif args.list:
        investigations = list_investigations()
        if not investigations:
            print("過去の調査なし")
        else:
            for inv in investigations:
                print(f"- [{inv.get('timestamp')}] {inv.get('title')} - {inv.get('report_path', 'N/A')}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
