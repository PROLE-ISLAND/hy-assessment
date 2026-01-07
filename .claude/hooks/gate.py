#!/usr/bin/env python3
"""
PreToolUse Gate: 統合品質ゲート v2.0 - SSOT版
Exit codes: 0 = 許可, 2 = 拒否（ブロック）

設定: ~/.claude/cache/claude-guardrails.yaml
"""
from __future__ import annotations

import json
import re
import shlex
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# lib ディレクトリをパスに追加
sys.path.insert(0, str(Path(__file__).parent))
from lib.guardrails_loader import load_guardrails, get

STDIN_BODY_FILE_VALUES_DEFAULT = {"-", "/dev/stdin", "/dev/fd/0"}

# コマンド経由マーカー（/issue, /req, /dev が使用するファイルパスプレフィックス）
COMMAND_MARKER_PREFIX = "/tmp/claude-cmd-"

# コマンド → ファイル名マッピング
COMMAND_FILE_MARKERS = {
    "issue": "/tmp/claude-cmd-issue",
    "req": "/tmp/claude-cmd-req",
    "dev": "/tmp/claude-cmd-dev",
}


# マーカーファイルの有効期間（秒）- 5分以内に作成されたファイルのみ有効
MARKER_FILE_MAX_AGE_SECONDS = 300

# Worktree 必須対象ブランチプレフィックス
WORKTREE_REQUIRED_PREFIXES = ("feature/", "requirements/", "bugfix/", "hotfix/")


def is_in_worktree() -> bool:
    """現在のディレクトリがworktreeかどうかを判定"""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--git-dir"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode != 0:
            return False
        git_dir = result.stdout.strip()
        # worktreeの場合: git-dir が絶対パスで worktrees を含む
        return "worktrees" in git_dir
    except Exception:
        return False


def is_worktree_required_branch(branch: str) -> bool:
    """worktree必須のブランチかどうかを判定"""
    return any(branch.startswith(prefix) for prefix in WORKTREE_REQUIRED_PREFIXES)


def is_command_routed(body_file: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    コマンド経由（/issue, /req, /dev）で実行されているかチェック

    Returns:
        (is_routed, detected_command)
        - is_routed: コマンド経由かどうか
        - detected_command: 検出されたコマンド名（"issue", "req", "dev"）
    """
    if not body_file:
        return False, None

    # /tmp/claude-cmd-* パスかチェック
    if not body_file.startswith(COMMAND_MARKER_PREFIX):
        return False, None

    # ファイル存在・タイムスタンプ検証（偽マーカー対策）
    marker_path = Path(body_file)
    if marker_path.exists():
        try:
            file_mtime = marker_path.stat().st_mtime
            current_time = time.time()
            age_seconds = current_time - file_mtime

            # 古すぎるファイルは偽マーカーの可能性
            if age_seconds > MARKER_FILE_MAX_AGE_SECONDS:
                return False, None
        except Exception:
            pass  # stat失敗時はパス名チェックのみ

    # どのコマンドかを特定
    for cmd_name, marker in COMMAND_FILE_MARKERS.items():
        if body_file.startswith(marker):
            return True, cmd_name

    return True, "unknown"


def get_recommended_command(args: List[str]) -> str:
    """
    コマンドの種類に応じて推奨コマンドを返す
    """
    # Issue作成
    if "issue" in args and "create" in args:
        return "/issue"

    # PR作成
    if "pr" in args and "create" in args:
        # ラベルからタイプを判定
        labels: List[str] = []
        for i, arg in enumerate(args):
            if arg == "--label" and i + 1 < len(args):
                labels.append(args[i + 1])
            elif arg.startswith("--label="):
                labels.append(arg[len("--label="):])

        if any("requirements" in l for l in labels):
            return "/req"
        return "/dev"

    return "/issue or /req or /dev"


def parse_command(command: str) -> List[str]:
    try:
        return shlex.split(command)
    except Exception:
        return command.split()


def has_flag(args: List[str], flag: str) -> bool:
    return flag in args or any(a.startswith(f"{flag}=") for a in args)


def get_arg_value(args: List[str], flag: str) -> Optional[str]:
    for i, arg in enumerate(args):
        if arg == flag and i + 1 < len(args):
            return args[i + 1]
        if arg.startswith(f"{flag}="):
            return arg[len(flag) + 1:]
    return None


def run(cmd: List[str], timeout: int = 10) -> Tuple[int, str]:
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    out = (r.stdout or r.stderr or "").strip()
    return r.returncode, out


def is_push_to_protected(args: List[str], protected: List[str]) -> bool:
    """
    git push コマンドが保護ブランチへのプッシュかどうかを判定
    引数ベースで判定（--force の位置に依存しない）
    """
    if "git" not in args or "push" not in args:
        return False

    # git push より後の引数を取得
    try:
        push_idx = args.index("push")
        push_args = args[push_idx + 1:]
    except (ValueError, IndexError):
        return False

    # フラグを除外してブランチ名を探す
    non_flag_args = [a for a in push_args if not a.startswith("-")]

    for arg in non_flag_args:
        # remote:branch 形式
        if ":" in arg:
            _, branch = arg.rsplit(":", 1)
            if branch in protected:
                return True
        # 単純なブランチ名
        elif arg in protected:
            return True

    return False


def validate_issue_body(body_path: Path, required_sections: List[Dict[str, Any]]) -> List[str]:
    errors: List[str] = []
    if not body_path.exists():
        return [f"File not found: {body_path}"]

    content = body_path.read_text(encoding="utf-8", errors="ignore")

    for sec in required_sections:
        if not sec.get("required", False):
            continue
        name = str(sec.get("name", "")).strip()
        desc = str(sec.get("description", "")).strip()
        if not name:
            continue
        if name not in content:
            errors.append(f"Missing required section: {name}")
            if desc:
                errors.append(f"  -> {desc}")
    return errors


def check_complexity_split(body_path: Path, complexity_config: Dict[str, Any]) -> Tuple[bool, List[str], str]:
    """
    Issue本文の複雑度をチェックし、分割が必要かを判定

    Returns:
        (should_act, found_markers, action)
        - should_act: 閾値を超えたか
        - found_markers: 検出されたマーカー一覧
        - action: "warn" or "block"
    """
    if not complexity_config:
        return False, [], "warn"

    markers = complexity_config.get("markers", []) or []
    threshold = complexity_config.get("split_threshold", 3)
    action = complexity_config.get("action", "warn")

    if not markers or not body_path.exists():
        return False, [], action

    content = body_path.read_text(encoding="utf-8", errors="ignore").lower()

    found: List[str] = []
    for marker in markers:
        if marker.lower() in content:
            found.append(marker)

    should_act = len(found) >= threshold
    return should_act, found, action


def secret_patterns(guardrails: Dict[str, Any]) -> List[Tuple[str, str, str]]:
    out: List[Tuple[str, str, str]] = []
    pats = get(guardrails, "commit", "secret_patterns", default=[]) or []
    for p in pats:
        if not isinstance(p, dict):
            continue
        pattern = p.get("pattern")
        name = p.get("name", "Secret")
        action = p.get("action", "block")
        if pattern:
            out.append((str(pattern), str(name), str(action)))
    return out


def handle_issue_create(command: str, args: List[str], guardrails: Dict[str, Any]) -> None:
    errors: List[str] = []
    warnings: List[str] = []

    issue = get(guardrails, "issue", default={}) or {}
    body_method = issue.get("body_method", "body-file")

    if body_method != "body-file":
        errors.append(f"Unsupported issue.body_method: {body_method} (expected body-file)")

    # --body 完全禁止（併用も不可）
    if has_flag(args, "--body"):
        errors.append("--body is prohibited (Hook cannot validate). Use --body-file <path> only.")

    # --body-file 必須
    body_file = get_arg_value(args, "--body-file")
    body_path: Optional[Path] = None

    # === コマンド経由チェック（完全ブロック） ===
    is_routed, detected_cmd = is_command_routed(body_file)
    if not is_routed:
        recommended = get_recommended_command(args)
        errors.append(f"❌ Issue作成は /issue コマンド経由が必須です")
        errors.append(f"   └─ 推奨コマンド: {recommended}")
        errors.append(f"   └─ 直接 gh issue create は禁止されています")

    if not body_file:
        errors.append("--body-file is required for issue creation.")
        errors.append("💡 推奨: /issue コマンドを使用してください")
        errors.append("Example: gh issue create --body-file /tmp/claude-cmd-issue.md")
    else:
        prohibited_vals = set(issue.get("prohibited_body_file_values", []) or [])
        if not prohibited_vals:
            prohibited_vals = STDIN_BODY_FILE_VALUES_DEFAULT

        if body_file in prohibited_vals:
            errors.append(f"--body-file {body_file} is prohibited (stdin-based). Use a real file path.")
        else:
            body_path = Path(body_file).expanduser()
            if not body_path.is_absolute():
                body_path = (Path.cwd() / body_path).resolve()

            required_sections = issue.get("required_sections", []) or []
            errors.extend(validate_issue_body(body_path, required_sections))

    if errors:
        print("🚫 ISSUE VALIDATION FAILED")
        print("=" * 60)
        for e in errors:
            print(f"  {e}")
        print("")
        print("💡 推奨ワークフロー:")
        print("   1. /investigate → 調査レポート作成")
        print("   2. /issue → Issue作成（テンプレート準拠）")
        print(f"Ref : {get(guardrails, '_path', default='(guardrails path unknown)')}")
        sys.exit(2)

    # コマンド経由でない場合の警告出力
    if warnings:
        print("⚠️ ISSUE ROUTING WARNING")
        print("=" * 60)
        for w in warnings:
            print(f"  {w}")
        print("")

    # Complexity check for sub-issue splitting
    if body_path and body_path.exists():
        complexity_config = issue.get("complexity", {}) or {}
        should_act, found_markers, action = check_complexity_split(body_path, complexity_config)

        if should_act:
            threshold = complexity_config.get("split_threshold", 3)
            message = complexity_config.get("message", "Consider splitting into sub-issues for better tracking")

            print("COMPLEXITY WARNING")
            print("=" * 60)
            print(f"  {len(found_markers)} domain markers detected (threshold: {threshold})")
            print(f"  Found: {', '.join(found_markers)}")
            print(f"  -> {message}")
            print("")
            print("Hint: Use sub-issues for each domain (DB, API, UI, etc.)")
            print("  gh issue create --title 'feat(db): ...' --body-file /tmp/sub-issue-1.md")

            if action == "block":
                print("")
                print("BLOCKED: Split required before creating this issue.")
                sys.exit(2)

    sys.exit(0)


def get_pr_type_label(labels: List[str]) -> Optional[str]:
    """
    PRラベルから type: プレフィックスの値を抽出
    例: ["type:requirements", "ci:skip"] -> "requirements"
    """
    for label in labels:
        if label.startswith("type:"):
            return label[5:]  # "type:" の後ろを取得
    return None


def get_type_specific_sections(pr_config: Dict[str, Any], pr_type: str) -> List[Dict[str, Any]]:
    """
    PR種別に応じた必須セクションを取得
    """
    type_specific = pr_config.get("type_specific", {}) or {}
    type_config = type_specific.get(pr_type, {}) or {}
    return type_config.get("required_sections", []) or []


def get_type_default_ci(pr_config: Dict[str, Any], pr_type: str) -> str:
    """
    PR種別に応じたデフォルトCIラベルを取得
    """
    type_specific = pr_config.get("type_specific", {}) or {}
    type_config = type_specific.get(pr_type, {}) or {}
    return type_config.get("default_ci", "ci:full")


def detect_scope(body: str) -> Dict[str, bool]:
    """
    本文からスコープ（DB/API/UI変更の有無）を検出

    Returns:
        {"db": bool, "api": bool, "ui": bool}
    """
    scope = {"db": False, "api": False, "ui": False}

    # DB変更の検出
    db_patterns = [
        r"データベース設計",
        r"DB変更",
        r"新規テーブル",
        r"テーブル.*CREATE",
        r"CRUD操作",
        r"RLS",
        r"マイグレーション",
    ]
    for pat in db_patterns:
        if re.search(pat, body, re.IGNORECASE):
            scope["db"] = True
            break

    # API変更の検出
    api_patterns = [
        r"API設計",
        r"API変更",
        r"エンドポイント",
        r"/api/",
        r"POST|GET|PUT|PATCH|DELETE\s+/",
        r"エラーハンドリング設計",
        r"非機能要件.*API",
    ]
    for pat in api_patterns:
        if re.search(pat, body, re.IGNORECASE):
            scope["api"] = True
            break

    # UI変更の検出
    ui_patterns = [
        r"UI設計",
        r"UI変更",
        r"画面一覧",
        r"画面遷移",
        r"コンポーネント",
        r"バリアント",
        r"data-testid",
        r"v0 Link",
        r"フロントエンド",
    ]
    for pat in ui_patterns:
        if re.search(pat, body, re.IGNORECASE):
            scope["ui"] = True
            break

    return scope


def validate_scope_sections(
    body: str,
    scope: Dict[str, bool],
    required_sections: List[Dict[str, Any]]
) -> Tuple[List[str], List[str]]:
    """
    スコープに応じた必須セクションを検証

    Returns:
        (errors, warnings)
    """
    errors: List[str] = []
    warnings: List[str] = []

    # スコープIDとapplies_toのマッピング
    scope_mapping = {
        "db": ["phase4_db"],
        "api": ["phase4_api"],
        "ui": ["phase4_ui"],
    }

    for scope_key, is_active in scope.items():
        if not is_active:
            continue

        section_ids = scope_mapping.get(scope_key, [])
        for sec in required_sections:
            sec_id = sec.get("id", "")
            if sec_id not in section_ids:
                continue

            name = str(sec.get("name", "")).strip()
            aliases = sec.get("aliases", []) or []
            desc = str(sec.get("description", "")).strip()

            # セクション存在チェック
            found = False
            search_terms = [name] + aliases

            for term in search_terms:
                if term.lower() in body.lower():
                    found = True
                    break

            if not found:
                errors.append(f"❌ {scope_key.upper()}変更あり: {name} が必要")
                if desc:
                    errors.append(f"   └─ {desc}")

    return errors, warnings


def validate_pr_body_for_type(
    body: str,
    required_sections: List[Dict[str, Any]],
    pr_type: str
) -> Tuple[List[str], List[str]]:
    """
    PR本文をtype別必須セクションでバリデーション

    Returns:
        (errors, warnings)
    """
    errors: List[str] = []
    warnings: List[str] = []

    # Phase別にグループ化
    phase_groups: Dict[str, List[Dict[str, Any]]] = {}
    for sec in required_sections:
        sec_id = sec.get("id", "")
        if sec_id.startswith("phase"):
            phase = sec_id.split("_")[0]  # phase1, phase2, etc.
        else:
            phase = "common"
        if phase not in phase_groups:
            phase_groups[phase] = []
        phase_groups[phase].append(sec)

    # スコープ検出（requirements PRのみ）
    scope = detect_scope(body) if pr_type == "requirements" else {}

    # Phase順に処理
    phase_order = ["phase1", "phase2", "phase3", "phase4", "phase5", "common"]

    for phase in phase_order:
        sections = phase_groups.get(phase, [])
        phase_errors: List[str] = []
        phase_warnings: List[str] = []

        for sec in sections:
            if not sec.get("required", False):
                continue

            # applies_to チェック（スコープ依存セクション）
            applies_to = sec.get("applies_to", "")
            sec_id = sec.get("id", "")

            # スコープ依存セクションの判定
            if applies_to:
                # DB/API/UI変更がある場合のみ必須
                if "DB変更" in applies_to and not scope.get("db"):
                    continue
                if "API変更" in applies_to and not scope.get("api"):
                    continue
                if "UI変更" in applies_to and not scope.get("ui"):
                    continue

            name = str(sec.get("name", "")).strip()
            aliases = sec.get("aliases", []) or []
            desc = str(sec.get("description", "")).strip()
            pattern = sec.get("pattern")
            minimum_count = sec.get("minimum_count")

            if not name:
                continue

            # セクション名またはエイリアスで検索
            found = False
            search_terms = [name] + aliases

            for term in search_terms:
                if term.lower() in body.lower():
                    found = True
                    break

            # パターンマッチがあればそれも確認
            if pattern and not found:
                if re.search(pattern, body, re.IGNORECASE):
                    found = True

            if not found:
                phase_errors.append(f"❌ 必須セクション不足: {name}")
                if desc:
                    phase_errors.append(f"   └─ {desc}")

            # minimum_count チェック（例: Pre-mortem は3つ以上）
            if found and minimum_count:
                # 簡易チェック: テーブル行数をカウント
                # | # | リスク | のような行を数える
                risk_pattern = r"\|\s*\d+\s*\|"
                matches = re.findall(risk_pattern, body)
                if len(matches) < minimum_count:
                    phase_warnings.append(f"⚠️ {name}: {minimum_count}つ以上の記載を推奨（現在: {len(matches)}件）")

        # Phase別エラー出力
        if phase_errors:
            phase_label = {
                "phase1": "Phase 1: 調査レポート",
                "phase2": "Phase 2: 要件定義・ユースケース",
                "phase3": "Phase 3: 品質基準",
                "phase4": "Phase 4: 技術設計",
                "phase5": "Phase 5: テスト設計",
                "common": "共通",
            }.get(phase, phase)
            errors.append(f"")
            errors.append(f"【{phase_label}】")
            errors.extend(phase_errors)

        warnings.extend(phase_warnings)

    # スコープ依存セクションの追加チェック
    if pr_type == "requirements" and scope:
        scope_errors, scope_warnings = validate_scope_sections(body, scope, required_sections)
        if scope_errors:
            errors.append("")
            errors.append("【スコープ別要件】")
            errors.extend(scope_errors)
        warnings.extend(scope_warnings)

    return errors, warnings


# =============================================================================
# Issue→Req→Dev 連鎖強制
# =============================================================================

def extract_issue_numbers(body: str) -> List[int]:
    """
    本文からIssue番号を抽出
    closes #123, fixes #456, resolves #789 などのパターン
    """
    patterns = [
        r"closes?\s+#(\d+)",
        r"fixes?\s+#(\d+)",
        r"resolves?\s+#(\d+)",
        r"#(\d+)",  # フォールバック
    ]
    numbers = set()
    for pat in patterns:
        for match in re.finditer(pat, body, re.IGNORECASE):
            numbers.add(int(match.group(1)))
    return sorted(numbers)


def extract_pr_numbers(body: str) -> List[int]:
    """
    本文から要件定義PR番号を抽出
    要件定義PR: #45 のようなパターン
    """
    patterns = [
        r"要件定義PR[:\s]*#(\d+)",
        r"requirements?\s*PR[:\s]*#(\d+)",
        r"req\s*PR[:\s]*#(\d+)",
    ]
    numbers = set()
    for pat in patterns:
        for match in re.finditer(pat, body, re.IGNORECASE):
            numbers.add(int(match.group(1)))
    return sorted(numbers)


def gh_issue_exists(issue_num: int) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    gh CLI でIssueが存在するかチェック
    Returns: (exists, issue_data)
    """
    try:
        code, output = run(
            ["gh", "issue", "view", str(issue_num), "--json", "number,title,labels,state"],
            timeout=10
        )
        if code == 0 and output:
            return True, json.loads(output)
    except Exception:
        pass
    return False, None


def gh_pr_exists(pr_num: int) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    gh CLI でPRが存在するかチェック
    Returns: (exists, pr_data)
    """
    try:
        code, output = run(
            ["gh", "pr", "view", str(pr_num), "--json", "number,title,labels,state,reviewDecision"],
            timeout=10
        )
        if code == 0 and output:
            return True, json.loads(output)
    except Exception:
        pass
    return False, None


def issue_has_label(issue_data: Dict[str, Any], label_name: str) -> bool:
    """Issueが特定のラベルを持っているか"""
    labels = issue_data.get("labels", []) or []
    for label in labels:
        if isinstance(label, dict):
            if label.get("name") == label_name:
                return True
        elif isinstance(label, str):
            if label == label_name:
                return True
    return False


def pr_has_label(pr_data: Dict[str, Any], label_prefix: str) -> bool:
    """PRが特定のプレフィックスのラベルを持っているか"""
    labels = pr_data.get("labels", []) or []
    for label in labels:
        if isinstance(label, dict):
            if str(label.get("name", "")).startswith(label_prefix):
                return True
        elif isinstance(label, str):
            if label.startswith(label_prefix):
                return True
    return False


def validate_req_chain(body: str, args: List[str]) -> Tuple[List[str], List[str]]:
    """
    /req (type:requirements) の連鎖チェック:
    1. 関連Issueが存在する
    2. Issueに investigation-complete ラベルがある

    Returns: (errors, warnings)
    """
    errors: List[str] = []
    warnings: List[str] = []

    # Issue番号抽出
    issue_nums = extract_issue_numbers(body)

    if not issue_nums:
        errors.append("❌ 関連Issueが指定されていません")
        errors.append("   └─ 本文に 'closes #XXX' を記載してください")
        return errors, warnings

    # 各Issueをチェック
    for issue_num in issue_nums:
        exists, issue_data = gh_issue_exists(issue_num)

        if not exists:
            errors.append(f"❌ Issue #{issue_num} が見つかりません")
            continue

        # investigation-complete ラベルチェック
        if not issue_has_label(issue_data, "investigation-complete"):
            has_needs = issue_has_label(issue_data, "needs-investigation")
            if has_needs:
                errors.append(f"❌ Issue #{issue_num}: 調査未完了 (needs-investigation)")
                errors.append(f"   └─ /investigate を実行して調査を完了してください")
            else:
                warnings.append(f"⚠️ Issue #{issue_num}: investigation-complete ラベルがありません")

    return errors, warnings


def validate_dev_chain(body: str, args: List[str]) -> Tuple[List[str], List[str]]:
    """
    /dev (type:implementation) の連鎖チェック:
    1. 関連Issueが存在する
    2. Issueに ready-to-develop ラベルがある
    3. 要件定義PRが存在する（新機能の場合）
    4. 要件定義PRがapproved/mergedである

    Returns: (errors, warnings)
    """
    errors: List[str] = []
    warnings: List[str] = []

    # === Issue チェック ===
    issue_nums = extract_issue_numbers(body)

    if not issue_nums:
        errors.append("❌ 関連Issueが指定されていません")
        errors.append("   └─ 本文に 'closes #XXX' を記載してください")
    else:
        for issue_num in issue_nums:
            exists, issue_data = gh_issue_exists(issue_num)

            if not exists:
                errors.append(f"❌ Issue #{issue_num} が見つかりません")
                continue

            # ready-to-develop ラベルチェック
            if not issue_has_label(issue_data, "ready-to-develop"):
                warnings.append(f"⚠️ Issue #{issue_num}: ready-to-develop ラベルがありません")
                warnings.append(f"   └─ 要件定義PRが承認されているか確認してください")

    # === 要件定義PR チェック ===
    # 「要件定義不要」チェックボックスが選択されているかチェック
    no_req_patterns = [
        r"\[x\]\s*要件定義不要",
        r"\[x\]\s*no.?req",
        r"\[x\]\s*バグ修正",
        r"\[x\]\s*fix:",
        r"\[x\]\s*docs:",
    ]
    is_no_req = any(re.search(pat, body, re.IGNORECASE) for pat in no_req_patterns)

    if is_no_req:
        # 要件定義不要の場合はスキップ
        return errors, warnings

    # 要件定義PRが必要な場合
    req_pr_nums = extract_pr_numbers(body)

    if not req_pr_nums:
        # 新機能の可能性をチェック
        is_feat = any(re.search(pat, body, re.IGNORECASE) for pat in [
            r"\[x\]\s*feat:",
            r"\[x\]\s*新機能",
        ])

        if is_feat:
            errors.append("❌ 要件定義PRが指定されていません")
            errors.append("   └─ 本文に '要件定義PR: #XXX' を記載してください")
            errors.append("   └─ または /req で要件定義PRを先に作成してください")
        else:
            warnings.append("⚠️ 要件定義PRが指定されていません")
            warnings.append("   └─ 新機能の場合は /req で要件定義PRを作成してください")
    else:
        for pr_num in req_pr_nums:
            exists, pr_data = gh_pr_exists(pr_num)

            if not exists:
                errors.append(f"❌ 要件定義PR #{pr_num} が見つかりません")
                continue

            # type:requirements ラベルチェック
            if not pr_has_label(pr_data, "type:requirements"):
                warnings.append(f"⚠️ PR #{pr_num}: type:requirements ラベルがありません")

            # 状態チェック（merged or approved）
            state = pr_data.get("state", "").upper()
            review_decision = pr_data.get("reviewDecision", "")

            if state == "MERGED":
                pass  # OK
            elif state == "OPEN":
                if review_decision == "APPROVED":
                    pass  # OK
                elif review_decision == "CHANGES_REQUESTED":
                    errors.append(f"❌ 要件定義PR #{pr_num}: 変更要求があります")
                    errors.append(f"   └─ PRのレビューコメントを確認して修正してください")
                else:
                    warnings.append(f"⚠️ 要件定義PR #{pr_num}: 未承認 (review pending)")
                    warnings.append(f"   └─ 先に要件定義PRのレビュー・承認を得ることを推奨")
            elif state == "CLOSED":
                errors.append(f"❌ 要件定義PR #{pr_num}: クローズ済み（マージされていない）")

    return errors, warnings


def get_current_branch() -> Optional[str]:
    """現在のブランチ名を取得"""
    try:
        code, branch = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], timeout=5)
        if code == 0 and branch:
            return branch.strip()
    except Exception:
        pass
    return None


# ブランチパターン → 推奨テンプレートのマッピング
BRANCH_TEMPLATE_MAP = {
    "requirements": "requirements.md",
    "plan": "requirements.md",
    "design": "requirements.md",
}


def check_branch_template_match(branch: str, args: List[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    ブランチ名に基づいて適切なテンプレートが使われているかチェック

    Returns:
        (is_ok, expected_template, branch_prefix)
        - is_ok: テンプレートが正しく指定されているか
        - expected_template: 期待されるテンプレート名
        - branch_prefix: 検出されたブランチプレフィックス
    """
    if not branch:
        return True, None, None

    # ブランチプレフィックスを抽出
    branch_prefix = branch.split("/")[0] if "/" in branch else None

    if not branch_prefix or branch_prefix not in BRANCH_TEMPLATE_MAP:
        return True, None, None

    expected_template = BRANCH_TEMPLATE_MAP[branch_prefix]
    specified_template = get_arg_value(args, "--template")

    if specified_template == expected_template:
        return True, expected_template, branch_prefix

    return False, expected_template, branch_prefix


def handle_pr_create(args: List[str], guardrails: Dict[str, Any]) -> None:
    """PR作成時のバリデーション（ラベル + type別本文チェック + ブランチ→テンプレート検証 + コマンド経由チェック）"""
    warnings: List[str] = []
    errors: List[str] = []
    pr = get(guardrails, "pr", default={}) or {}

    # === --body 完全禁止（Issue同様） ===
    if has_flag(args, "--body"):
        errors.append("❌ --body は禁止されています（Hookでバリデーション不可）")
        errors.append("   └─ --body-file <path> を使用してください")
        errors.append("   └─ 推奨: /req または /dev コマンドを使用")

    # === --body-file 必須 ===
    body_file = get_arg_value(args, "--body-file")
    if not body_file:
        errors.append("❌ --body-file は必須です")
        errors.append("   └─ 推奨: /req または /dev コマンドを使用")

    # === コマンド経由チェック（完全ブロック） ===
    is_routed, detected_cmd = is_command_routed(body_file)

    if not is_routed:
        recommended = get_recommended_command(args)
        errors.append(f"❌ PR作成は {recommended} コマンド経由が必須です")
        errors.append(f"   └─ 直接 gh pr create は禁止されています")
        errors.append(f"   └─ /req: 要件定義PR、/dev: 実装PR")

    # === Worktree チェック（開発ブランチでは worktree 必須） ===
    current_branch = get_current_branch()
    if is_worktree_required_branch(current_branch) and not is_in_worktree():
        errors.append(f"❌ 開発ブランチでは worktree での作業が必須です")
        errors.append(f"   └─ 現在: メインリポジトリで作業中")
        errors.append(f"   └─ 推奨: git gtr new {current_branch}")
        errors.append(f"   └─       git gtr ai {current_branch}")

    # === ブランチ名 → テンプレートチェック ===
    is_template_ok, expected_template, branch_prefix = check_branch_template_match(current_branch, args)

    if not is_template_ok and expected_template:
        errors.append(f"❌ ブランチ '{current_branch}' には --template {expected_template} が必要です")
        errors.append(f"   └─ 修正例: gh pr create --template {expected_template} ...")

    # === ラベル収集 ===
    labels: List[str] = []
    for i, arg in enumerate(args):
        if arg == "--label" and i + 1 < len(args):
            labels.append(args[i + 1])
        elif arg.startswith("--label="):
            labels.append(arg[len("--label="):])

    # === 必須ラベルチェック ===
    required_labels = pr.get("required_labels", []) or []

    for req in required_labels:
        if not isinstance(req, dict):
            continue
        prefix = req.get("prefix", "")
        required = req.get("required", False)
        message = req.get("message", f"{prefix} ラベルが必要です")

        has_label = any(l.startswith(prefix) for l in labels)

        if required and not has_label:
            errors.append(f"❌ {message}")
        elif not has_label and prefix:
            warnings.append(f"⚠️ {message}")

    # === PR種別の特定 ===
    pr_type = get_pr_type_label(labels)

    # === 本文取得 ===
    body = ""
    body_file = get_arg_value(args, "--body-file")
    has_bodyfile = has_flag(args, "--body-file")

    if body_file and body_file not in STDIN_BODY_FILE_VALUES_DEFAULT:
        body_path = Path(body_file).expanduser()
        if not body_path.is_absolute():
            body_path = (Path.cwd() / body_path).resolve()
        if body_path.exists():
            body = body_path.read_text(encoding="utf-8", errors="ignore")
    else:
        body = get_arg_value(args, "--body") or ""

    if not body and not has_bodyfile:
        warnings.append("PR body not specified (template sections may be missing).")

    # === 共通チェック: Issue link ===
    common_reqs = pr.get("required_sections", []) or []
    issue_link_req = next((r for r in common_reqs if isinstance(r, dict) and r.get("id") == "issue_link"), None)
    pattern = (issue_link_req or {}).get("pattern", r"closes #\d+")
    if body and not re.search(pattern, body, re.IGNORECASE):
        warnings.append("Issue link not found (expected: closes #123).")

    # === Type別バリデーション ===
    if pr_type and body:
        type_sections = get_type_specific_sections(pr, pr_type)

        if type_sections:
            type_errors, type_warnings = validate_pr_body_for_type(body, type_sections, pr_type)
            errors.extend(type_errors)
            warnings.extend(type_warnings)

            # デフォルトCIラベルの提案
            default_ci = get_type_default_ci(pr, pr_type)
            has_ci_label = any(l.startswith("ci:") for l in labels)
            if not has_ci_label:
                warnings.append(f"💡 type:{pr_type} の推奨CI: {default_ci}")

    # === Issue→Req→Dev 連鎖チェック ===
    if body:
        if pr_type == "requirements":
            # /req: Issue → Req の連鎖チェック
            chain_errors, chain_warnings = validate_req_chain(body, args)
            errors.extend(chain_errors)
            warnings.extend(chain_warnings)

        elif pr_type == "implementation":
            # /dev: Issue + Req → Dev の連鎖チェック
            chain_errors, chain_warnings = validate_dev_chain(body, args)
            errors.extend(chain_errors)
            warnings.extend(chain_warnings)

    # === 結果出力 ===
    if errors:
        pr_type_display = pr_type or "(未指定)"
        print(f"🚫 PR VALIDATION FAILED [type:{pr_type_display}]")
        print("=" * 60)
        for e in errors:
            print(f"  {e}")
        print("")
        print("💡 推奨ワークフロー:")
        if pr_type == "requirements":
            print("   /req → 要件定義PR作成（Phase 1-5テンプレート準拠）")
            print("📋 テンプレート: .github/PULL_REQUEST_TEMPLATE/requirements.md")
        else:
            print("   /dev → 実装PR作成（DoD準拠）")
            print("📋 Example: gh pr create --label type:implementation --label ci:full --body-file /tmp/claude-cmd-dev.md")
        sys.exit(2)

    if warnings:
        print(f"⚠️ PR ROUTING WARNING [type:{pr_type or 'unknown'}]")
        print("=" * 60)
        for w in warnings:
            print(f"  {w}")
        print("")

    sys.exit(0)


def handle_git_commit(args: List[str], guardrails: Dict[str, Any]) -> None:
    commit = get(guardrails, "commit", default={}) or {}
    allowed_types = [t.split()[0] for t in (commit.get("types", []) or [])]
    if not allowed_types:
        allowed_types = ["feat", "fix", "docs", "style", "refactor", "test", "chore", "ci", "perf", "build"]

    message = get_arg_value(args, "-m")

    if message:
        if not any(message.startswith(f"{t}:") for t in allowed_types):
            print("COMMIT MESSAGE WARNING")
            print("  Format: {type}: {description}")
            print(f"  Types : {', '.join(allowed_types)}")

        for pat, name, action in secret_patterns(guardrails):
            if re.search(pat, message, re.IGNORECASE):
                if action == "block":
                    print(f"BLOCKED: secret detected in commit message ({name})")
                    sys.exit(2)
                else:
                    print(f"WARNING: secret-like pattern in commit message ({name})")

    # staged diff から検出
    try:
        code, diff = run(["git", "diff", "--cached", "-U0"], timeout=10)
        if code == 0 and diff:
            for pat, name, action in secret_patterns(guardrails):
                if re.search(pat, diff, re.IGNORECASE):
                    if action == "block":
                        print(f"BLOCKED: secret detected in staged changes ({name})")
                        sys.exit(2)
                    else:
                        print(f"WARNING: secret-like pattern in staged changes ({name})")
    except Exception:
        pass

    sys.exit(0)


def handle_git_push(command: str, args: List[str], guardrails: Dict[str, Any]) -> None:
    push = get(guardrails, "push", default={}) or {}
    protected = push.get("protected_branches", ["main", "master"]) or ["main", "master"]

    # === Worktree チェック（開発ブランチでは worktree 必須） ===
    current_branch = get_current_branch()
    if is_worktree_required_branch(current_branch) and not is_in_worktree():
        print("🚫 GIT PUSH BLOCKED")
        print("=" * 60)
        print(f"  ❌ 開発ブランチでは worktree での作業が必須です")
        print(f"     └─ 現在: メインリポジトリで作業中")
        print(f"     └─ ブランチ: {current_branch}")
        print(f"")
        print(f"  💡 worktree で作業を開始してください:")
        print(f"     $ git gtr new {current_branch}")
        print(f"     $ git gtr ai {current_branch}")
        print("=" * 60)
        sys.exit(2)

    has_force = ("--force" in args) or ("-f" in args)
    to_protected = is_push_to_protected(args, protected)

    if has_force and to_protected:
        print("BLOCKED: force push to protected branch is prohibited")
        sys.exit(2)

    if to_protected and not has_force:
        print("WARNING: direct push to protected branch")
        print("  Use PR workflow instead")

    if has_force and not to_protected:
        print("WARNING: force push detected")
        print("  Consider using --force-with-lease")

    sys.exit(0)


def warn_dangerous_ops(command: str, guardrails: Dict[str, Any]) -> None:
    rules = get(guardrails, "dangerous_operations", default=[]) or []
    for r in rules:
        if not isinstance(r, dict):
            continue
        pat = r.get("pattern")
        msg = r.get("message", "Dangerous operation detected")
        action = r.get("action", "warn")
        if pat and re.search(pat, command):
            if action == "warn":
                print(f"WARNING: {msg} ({pat})")
            elif action == "block":
                print(f"BLOCKED: {msg} ({pat})")
                sys.exit(2)


def detect_gh_command_in_raw(command: str) -> Tuple[bool, str, str]:
    """
    コマンド文字列全体から gh issue/pr create を検出
    複合コマンド（&&, ;, |）やラッパー（env, sh -c）も検出

    Returns:
        (detected, command_type, evasion_method)
        - detected: gh issue/pr create が含まれているか
        - command_type: "issue" | "pr" | ""
        - evasion_method: 検出された回避手法（"compound", "wrapper", ""）
    """
    # 複合コマンドチェック（&&, ;, |）
    compound_patterns = [r"&&", r";", r"\|"]
    is_compound = any(re.search(pat, command) for pat in compound_patterns)

    # ラッパーコマンドチェック（env, sh -c, bash -c, etc.）
    wrapper_patterns = [
        r"^\s*env\s+",
        r"^\s*sh\s+-c\s+",
        r"^\s*bash\s+-c\s+",
        r"^\s*/bin/sh\s+-c\s+",
        r"^\s*/bin/bash\s+-c\s+",
        r"^\s*xargs\s+",
    ]
    is_wrapper = any(re.search(pat, command) for pat in wrapper_patterns)

    # gh issue create / gh pr create の検出
    if re.search(r"gh\s+issue\s+create", command):
        evasion = "compound" if is_compound else ("wrapper" if is_wrapper else "")
        return True, "issue", evasion
    if re.search(r"gh\s+pr\s+create", command):
        evasion = "compound" if is_compound else ("wrapper" if is_wrapper else "")
        return True, "pr", evasion

    return False, "", ""


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    if payload.get("tool_name") != "Bash":
        sys.exit(0)

    command = (payload.get("tool_input") or {}).get("command", "") or ""
    args = parse_command(command)

    guardrails = load_guardrails()
    if "_error" in guardrails:
        print(f"WARNING: guardrails load failed: {guardrails['_error']}")
        sys.exit(0)

    # === 複合コマンド・回避コマンド検出 ===
    detected, cmd_type, evasion = detect_gh_command_in_raw(command)
    if detected and evasion:
        print("🚫 COMMAND EVASION DETECTED")
        print("=" * 60)
        print(f"  ❌ gh {cmd_type} create が {evasion} 経由で実行されようとしています")
        print(f"  └─ 直接実行は禁止されています")
        if cmd_type == "issue":
            print(f"  └─ 推奨: /issue コマンドを使用してください")
        else:
            print(f"  └─ 推奨: /req または /dev コマンドを使用してください")
        sys.exit(2)

    # gh issue create
    if "gh" in args and "issue" in args and "create" in args:
        handle_issue_create(command, args, guardrails)

    # gh pr create（args判定でなく正規表現で再チェック - パス指定対策）
    if "gh" in args and "pr" in args and "create" in args:
        handle_pr_create(args, guardrails)
    elif detected and cmd_type == "pr":
        # argsに "gh" がなくても正規表現で検出された場合（パス指定 /opt/.../gh など）
        handle_pr_create(args, guardrails)
    elif detected and cmd_type == "issue":
        # argsに "gh" がなくても正規表現で検出された場合
        handle_issue_create(command, args, guardrails)

    # git commit
    if "git" in args and "commit" in args:
        handle_git_commit(args, guardrails)

    # git push
    if "git" in args and "push" in args:
        handle_git_push(command, args, guardrails)

    # dangerous ops
    warn_dangerous_ops(command, guardrails)

    sys.exit(0)


if __name__ == "__main__":
    main()
