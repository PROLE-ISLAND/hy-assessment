#!/usr/bin/env python3
"""
Quality Gate Hook - PR作成時の自動品質検証
DoD v2.0 + AIミス防止チェックを統合実行

Exit codes: 0 = 許可, 2 = 拒否（ブロック）

Usage:
  PreToolUse hook for: Bash(gh pr create:*)
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# DoD Level判定
DOD_LEVELS = ["Bronze", "Silver", "Gold"]

# ブランチ名からDoDレベルを判定
DOD_BRANCH_PATTERNS = {
    "Gold": [r"-gold$", r"release/"],
    "Silver": [r"feature/", r"requirements/"],
    "Bronze": [r"bugfix/", r"hotfix/", r"fix/"],
}

# チェック定義
BRONZE_CHECKS = [
    ("compile", "tsc --noEmit", True),
    ("lint", "npm run lint", True),
    ("test-unit", "npm run test:unit -- --coverage", True),
]

SILVER_CHECKS = [
    ("import-check", "verify_imports", True),
    ("error-handling", "check_error_paths", True),
    ("variant-check", "check_variants", True),  # UI変更時のみ
    ("test-integration", "npm run test:integration", True),
]

GOLD_CHECKS = [
    ("test-e2e", "npm run test:e2e", True),
    ("performance", "npx lighthouse-ci", False),  # Warning only
    ("security", "npm audit --audit-level=high", True),
]


def get_current_branch() -> str:
    """現在のブランチ名を取得"""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=5
        )
        return result.stdout.strip() if result.returncode == 0 else ""
    except Exception:
        return ""


def get_pr_labels(pr_number: str) -> List[str]:
    """PRのラベルを取得"""
    try:
        result = subprocess.run(
            ["gh", "pr", "view", pr_number, "--json", "labels", "-q", ".labels[].name"],
            capture_output=True, text=True, timeout=10
        )
        return result.stdout.strip().split("\n") if result.returncode == 0 else []
    except Exception:
        return []


def determine_dod_level(branch: str, labels: List[str] = None) -> str:
    """DoD Levelを判定（ラベル > ブランチ名 > デフォルト）"""
    # ラベルから判定
    if labels:
        for label in labels:
            if "gold" in label.lower():
                return "Gold"
            if "silver" in label.lower():
                return "Silver"
            if "bronze" in label.lower():
                return "Bronze"

    # ブランチ名から判定
    for level, patterns in DOD_BRANCH_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, branch):
                return level

    # デフォルト: Silver
    return "Silver"


def get_changed_files() -> List[str]:
    """変更されたファイル一覧を取得"""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "origin/main...HEAD"],
            capture_output=True, text=True, timeout=10
        )
        return result.stdout.strip().split("\n") if result.returncode == 0 else []
    except Exception:
        return []


def has_ui_changes(files: List[str]) -> bool:
    """UI変更があるかどうか"""
    ui_patterns = [
        r"^src/components/",
        r"^src/app/.*page\.tsx$",
        r"\.tsx$",
    ]
    for f in files:
        for pattern in ui_patterns:
            if re.search(pattern, f):
                return True
    return False


def verify_imports(files: List[str]) -> Tuple[bool, List[str]]:
    """Import解決検証"""
    errors = []
    ts_files = [f for f in files if f.endswith(('.ts', '.tsx'))]

    for file_path in ts_files:
        if not Path(file_path).exists():
            continue

        try:
            content = Path(file_path).read_text()
            # 相対インポートの解決確認
            imports = re.findall(r"from\s+['\"](\.[^'\"]+)['\"]", content)
            for imp in imports:
                # 簡易チェック: インポートパスが解決可能か
                base_dir = Path(file_path).parent
                possible_paths = [
                    base_dir / f"{imp}.ts",
                    base_dir / f"{imp}.tsx",
                    base_dir / f"{imp}/index.ts",
                    base_dir / f"{imp}/index.tsx",
                ]
                if not any(p.exists() for p in possible_paths):
                    errors.append(f"{file_path}: Cannot resolve '{imp}'")
        except Exception as e:
            pass  # ファイル読み込みエラーはスキップ

    return len(errors) == 0, errors


def check_error_paths(files: List[str]) -> Tuple[bool, List[str]]:
    """エラー処理検証"""
    issues = []
    ts_files = [f for f in files if f.endswith(('.ts', '.tsx'))]

    for file_path in ts_files:
        if not Path(file_path).exists():
            continue

        try:
            content = Path(file_path).read_text()

            # fetch without error handling
            if re.search(r"await\s+fetch\([^)]+\)(?!\.catch)", content):
                if ".catch" not in content and "try" not in content:
                    issues.append(f"{file_path}: fetch() without error handling")

            # axios without error handling
            if re.search(r"await\s+axios\.", content):
                if ".catch" not in content and "try" not in content:
                    issues.append(f"{file_path}: axios without error handling")

        except Exception:
            pass

    return len(issues) == 0, issues


def check_variants(files: List[str]) -> Tuple[bool, List[str]]:
    """UIバリアント検証"""
    missing = []
    required_variants = ["Loading", "Empty", "Error"]

    component_files = [f for f in files if f.endswith('.tsx') and 'components' in f]

    for file_path in component_files:
        if not Path(file_path).exists():
            continue

        try:
            content = Path(file_path).read_text()

            # データ取得コンポーネントかどうか
            if not any(kw in content for kw in ["useQuery", "useSWR", "fetch", "axios", "useState"]):
                continue  # データ取得しないコンポーネントはスキップ

            missing_variants = []

            # Loading check
            if not any(kw in content for kw in ["isLoading", "loading", "Skeleton", "Spinner"]):
                missing_variants.append("Loading")

            # Empty check
            if not any(kw in content for kw in ["isEmpty", "length === 0", "!data", "?.length"]):
                missing_variants.append("Empty")

            # Error check
            if not any(kw in content for kw in ["isError", "error", "Error", "catch"]):
                missing_variants.append("Error")

            if missing_variants:
                missing.append(f"{file_path}: Missing variants: {', '.join(missing_variants)}")

        except Exception:
            pass

    return len(missing) == 0, missing


def run_command(cmd: str) -> Tuple[bool, str]:
    """コマンド実行"""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=300
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)


def run_quality_gate(dod_level: str, files: List[str], ui_changes: bool) -> Dict:
    """品質ゲート実行"""
    results = {
        "level": dod_level,
        "passed": True,
        "checks": {},
        "blocking_issues": [],
        "warnings": [],
    }

    # Bronze checks
    for name, cmd, blocking in BRONZE_CHECKS:
        if cmd.startswith("npm") or cmd.startswith("npx") or cmd.startswith("tsc"):
            passed, output = run_command(cmd)
        else:
            passed, output = True, "Skipped"

        results["checks"][name] = {"passed": passed, "output": output[:500]}
        if not passed and blocking:
            results["passed"] = False
            results["blocking_issues"].append(f"[Bronze] {name}: Failed")

    # Silver checks (if level >= Silver)
    if dod_level in ["Silver", "Gold"]:
        # Import check
        passed, errors = verify_imports(files)
        results["checks"]["import-check"] = {"passed": passed, "errors": errors}
        if not passed:
            results["passed"] = False
            results["blocking_issues"].extend([f"[Silver] import-check: {e}" for e in errors[:3]])

        # Error handling check
        passed, issues = check_error_paths(files)
        results["checks"]["error-handling"] = {"passed": passed, "issues": issues}
        if not passed:
            results["passed"] = False
            results["blocking_issues"].extend([f"[Silver] error-handling: {i}" for i in issues[:3]])

        # Variant check (UI changes only)
        if ui_changes:
            passed, missing = check_variants(files)
            results["checks"]["variant-check"] = {"passed": passed, "missing": missing}
            if not passed:
                results["passed"] = False
                results["blocking_issues"].extend([f"[Silver] variant-check: {m}" for m in missing[:3]])

    # Gold checks (if level == Gold)
    if dod_level == "Gold":
        for name, cmd, blocking in GOLD_CHECKS:
            if cmd.startswith("npm") or cmd.startswith("npx"):
                passed, output = run_command(cmd)
            else:
                passed, output = True, "Skipped"

            results["checks"][name] = {"passed": passed, "output": output[:500]}
            if not passed:
                if blocking:
                    results["passed"] = False
                    results["blocking_issues"].append(f"[Gold] {name}: Failed")
                else:
                    results["warnings"].append(f"[Gold] {name}: Warning")

    return results


def format_report(results: Dict) -> str:
    """レポート生成"""
    lines = [
        "=" * 60,
        f"🚦 Quality Gate Report - DoD Level: {results['level']}",
        "=" * 60,
        "",
    ]

    if results["passed"]:
        lines.append("✅ PASSED - All checks passed")
    else:
        lines.append("❌ BLOCKED - Some checks failed")

    lines.append("")
    lines.append("Checks:")
    for name, data in results["checks"].items():
        status = "✅" if data.get("passed", True) else "❌"
        lines.append(f"  {status} {name}")

    if results["blocking_issues"]:
        lines.append("")
        lines.append("Blocking Issues:")
        for issue in results["blocking_issues"]:
            lines.append(f"  - {issue}")

    if results["warnings"]:
        lines.append("")
        lines.append("Warnings:")
        for warning in results["warnings"]:
            lines.append(f"  - {warning}")

    lines.append("")
    lines.append("=" * 60)

    return "\n".join(lines)


def main():
    """メイン処理"""
    # 環境変数からツール入力を取得
    tool_input = os.environ.get("CLAUDE_TOOL_INPUT", "{}")

    try:
        input_data = json.loads(tool_input)
    except json.JSONDecodeError:
        input_data = {}

    # PR作成コマンドかどうか確認
    command = input_data.get("command", "")
    if "gh pr create" not in command:
        # PR作成以外はスキップ
        sys.exit(0)

    print("🔍 Running Quality Gate checks...", file=sys.stderr)

    # 情報収集
    branch = get_current_branch()
    files = get_changed_files()
    ui_changes = has_ui_changes(files)
    dod_level = determine_dod_level(branch)

    print(f"  Branch: {branch}", file=sys.stderr)
    print(f"  DoD Level: {dod_level}", file=sys.stderr)
    print(f"  Changed files: {len(files)}", file=sys.stderr)
    print(f"  UI changes: {ui_changes}", file=sys.stderr)

    # 品質ゲート実行
    results = run_quality_gate(dod_level, files, ui_changes)

    # レポート出力
    report = format_report(results)
    print(report, file=sys.stderr)

    # 結果に応じて終了
    if results["passed"]:
        sys.exit(0)  # 許可
    else:
        # ブロック（詳細をstdoutに出力）
        print(json.dumps({
            "blocked": True,
            "reason": "Quality Gate failed",
            "details": results["blocking_issues"],
        }))
        sys.exit(2)  # 拒否


if __name__ == "__main__":
    main()
