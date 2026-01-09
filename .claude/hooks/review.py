#!/usr/bin/env python3
"""
PostToolUse Review Hook v1.0
gh pr create / gh issue create の結果をレビューし、品質問題があれば修正指示を出す

Exit codes:
- 0 = OK（または対象外）
- 非ゼロは使用しない（PostToolUseでブロックしない設計）
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# lib ディレクトリをパスに追加
sys.path.insert(0, str(Path(__file__).parent))
from lib.guardrails_loader import load_guardrails, get


def run(cmd: List[str], timeout: int = 10) -> Tuple[int, str]:
    """コマンド実行"""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        out = (r.stdout or r.stderr or "").strip()
        return r.returncode, out
    except Exception as e:
        return 1, str(e)


def extract_pr_url(output: str) -> Optional[str]:
    """gh pr create の出力からPR URLを抽出"""
    # https://github.com/owner/repo/pull/123
    match = re.search(r"https://github\.com/[^/]+/[^/]+/pull/\d+", output)
    return match.group(0) if match else None


def extract_repo_from_url(url: str) -> Optional[str]:
    """PR URLからowner/repo形式のリポジトリ名を抽出"""
    # https://github.com/owner/repo/pull/123 -> owner/repo
    match = re.search(r"github\.com/([^/]+/[^/]+)/pull", url)
    return match.group(1) if match else None


def extract_pr_number(url: str) -> Optional[int]:
    """PR URLからPR番号を抽出"""
    match = re.search(r"/pull/(\d+)", url)
    return int(match.group(1)) if match else None


def get_pr_body(pr_number: int, repo: Optional[str] = None) -> Optional[str]:
    """PRの本文を取得"""
    cmd = ["gh", "pr", "view", str(pr_number), "--json", "body", "-q", ".body"]
    if repo:
        cmd.extend(["--repo", repo])
    code, output = run(cmd, timeout=15)
    return output if code == 0 else None


def get_pr_labels(pr_number: int, repo: Optional[str] = None) -> List[str]:
    """PRのラベルを取得"""
    cmd = ["gh", "pr", "view", str(pr_number), "--json", "labels", "-q", ".labels[].name"]
    if repo:
        cmd.extend(["--repo", repo])
    code, output = run(cmd, timeout=15)
    return output.split("\n") if code == 0 and output else []


def validate_requirements_pr(body: str) -> Tuple[List[str], List[str]]:
    """要件PRの品質チェック"""
    errors: List[str] = []
    suggestions: List[str] = []

    # Phase 1-5 セクションチェック（複数形式に対応）
    required_phases = [
        (r"(##\s*1\.|Phase\s*1|調査レポート)", "Phase 1: 調査レポート"),
        (r"(##\s*2\.|Phase\s*2|ユースケース)", "Phase 2: 要件定義・ユースケース"),
        (r"(##\s*3\.|Phase\s*3|品質基準)", "Phase 3: 品質基準"),
        (r"(##\s*4\.|Phase\s*4|技術設計)", "Phase 4: 技術設計"),
        (r"(##\s*5\.|Phase\s*5|テスト設計)", "Phase 5: テスト設計"),
    ]

    for pattern, name in required_phases:
        if not re.search(pattern, body, re.IGNORECASE):
            errors.append(f"❌ {name} セクションが不足")

    # DoD Level チェック
    if not re.search(r"\[x\]\s*(Bronze|Silver|Gold)", body, re.IGNORECASE):
        suggestions.append("💡 DoD Level を選択してください（[x] Silver など）")

    # Pre-mortem チェック
    if "Pre-mortem" not in body and "失敗シナリオ" not in body:
        suggestions.append("💡 Pre-mortem（失敗シナリオ）セクションを追加してください")

    # Issue リンクチェック
    if not re.search(r"#\d+", body):
        errors.append("❌ Issue への参照がありません（#番号）")

    return errors, suggestions


def validate_implementation_pr(body: str, labels: List[str]) -> Tuple[List[str], List[str]]:
    """実装PRの品質チェック"""
    errors: List[str] = []
    suggestions: List[str] = []

    # 要件PR参照チェック
    if not re.search(r"要件.*#\d+|Requirements.*#\d+", body, re.IGNORECASE):
        errors.append("❌ 要件PRへの参照がありません")

    # テストファイル言及チェック
    if not re.search(r"\.test\.|\.spec\.|__tests__|テスト", body):
        suggestions.append("💡 テストファイルへの言及がありません")

    # DoD Level 対応チェック
    dod_level = None
    for label in labels:
        if "gold" in label.lower():
            dod_level = "gold"
        elif "silver" in label.lower():
            dod_level = "silver"
        elif "bronze" in label.lower():
            dod_level = "bronze"

    if dod_level == "gold" and "e2e" not in body.lower():
        errors.append("❌ Gold Level: E2Eテストへの言及が必要です")

    return errors, suggestions


def get_pr_type(labels: List[str]) -> Optional[str]:
    """PRタイプを判定"""
    for label in labels:
        if "requirements" in label.lower():
            return "requirements"
        if "implementation" in label.lower():
            return "implementation"
    return None


def main() -> None:
    # デバッグログ
    import datetime
    with open("/tmp/review_hook_debug.log", "a") as f:
        f.write(f"\n=== {datetime.datetime.now()} ===\n")

    try:
        payload = json.load(sys.stdin)
        # ペイロードをログに記録
        with open("/tmp/review_hook_debug.log", "a") as f:
            f.write(f"Payload: {json.dumps(payload)[:500]}\n")
    except json.JSONDecodeError as e:
        with open("/tmp/review_hook_debug.log", "a") as f:
            f.write(f"JSON decode error: {e}\n")
        sys.exit(0)

    # Bash ツールの結果のみ対象
    if payload.get("tool_name") != "Bash":
        sys.exit(0)

    tool_input = payload.get("tool_input", {})
    command = tool_input.get("command", "") or ""

    # gh pr create の結果のみ対象
    if "gh" not in command or "pr" not in command or "create" not in command:
        sys.exit(0)

    tool_result = payload.get("tool_result", {})
    stdout = tool_result.get("stdout", "") or ""
    stderr = tool_result.get("stderr", "") or ""
    output = stdout + stderr

    # PR URL 抽出
    pr_url = extract_pr_url(output)
    if not pr_url:
        # PR作成失敗の場合は何もしない
        sys.exit(0)

    pr_number = extract_pr_number(pr_url)
    if not pr_number:
        sys.exit(0)

    # リポジトリ名抽出
    repo = extract_repo_from_url(pr_url)

    # PR情報取得（リポジトリを指定）
    body = get_pr_body(pr_number, repo)
    labels = get_pr_labels(pr_number, repo)

    if not body:
        # 取得失敗時はスキップ
        sys.exit(0)

    # PRタイプ判定
    pr_type = get_pr_type(labels)

    errors: List[str] = []
    suggestions: List[str] = []

    if pr_type == "requirements":
        errors, suggestions = validate_requirements_pr(body)
    elif pr_type == "implementation":
        errors, suggestions = validate_implementation_pr(body, labels)
    else:
        suggestions.append("type:requirements または type:implementation ラベルを追加してください")

    # === JSON 形式で出力（Claude に見える） ===
    result: Dict[str, Any] = {}

    if errors:
        # 品質エラーがある場合、Claude に通知
        result["decision"] = "block"
        result["reason"] = f"PR #{pr_number} に品質エラーがあります。修正してください。"
        result["additionalContext"] = {
            "pr_url": pr_url,
            "pr_number": pr_number,
            "pr_type": pr_type,
            "errors": errors,
            "suggestions": suggestions,
            "fix_command": f"gh pr edit {pr_number} --body-file /tmp/fixed-pr-body.md",
            "instruction": "上記エラーを修正した本文を /tmp/fixed-pr-body.md に書き出し、gh pr edit で更新してください。"
        }
    elif suggestions:
        # 改善提案のみの場合、情報として通知（ブロックしない）
        result["additionalContext"] = {
            "pr_url": pr_url,
            "pr_number": pr_number,
            "pr_type": pr_type,
            "status": "ok_with_suggestions",
            "suggestions": suggestions
        }
    else:
        # 問題なし
        result["additionalContext"] = {
            "pr_url": pr_url,
            "pr_number": pr_number,
            "pr_type": pr_type,
            "status": "ok",
            "message": "品質チェック OK"
        }

    # stdout（JSON形式でadditionalContext）とstderr（人間可読）の両方に出力
    output_json = json.dumps(result)
    print(output_json)  # stdout - Claude Code が additionalContext として認識

    # stderrにも出力（デバッグ・可視性確保）
    if result.get("decision") == "block" or result.get("additionalContext", {}).get("suggestions"):
        print(f"\n📋 PR Review Result: {output_json[:200]}...", file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
