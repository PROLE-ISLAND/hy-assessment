#!/usr/bin/env python3
"""
Session Manager Hook for Claude Code
- セッション開始時: Issue番号を表示、ロックファイル作成
- 並行セッション検出: 同じIssueで複数セッション起動を警告
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# ロックファイルディレクトリ
LOCK_DIR = Path.home() / ".claude" / "sessions"
LOCK_DIR.mkdir(parents=True, exist_ok=True)

# セッション状態ファイル（初回実行検出用）
SESSION_STATE_FILE = Path("/tmp") / f"claude-session-{os.getpid()}.state"


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


def extract_issue_number(branch: str) -> str | None:
    """ブランチ名からIssue番号を抽出"""
    # パターン: issue-123, issue-123-description
    match = re.search(r'issue-(\d+)', branch, re.IGNORECASE)
    return match.group(1) if match else None


def get_branch_type(branch: str) -> str:
    """ブランチタイプを取得"""
    if branch.startswith("requirements/"):
        return "requirements"
    elif branch.startswith("feature/"):
        return "feature"
    elif branch.startswith("bugfix/") or branch.startswith("hotfix/"):
        return "bugfix"
    elif branch == "main" or branch == "develop":
        return "main"
    return "other"


def get_lock_file(issue_number: str) -> Path:
    """Issue用のロックファイルパス"""
    return LOCK_DIR / f"issue-{issue_number}.lock"


def check_existing_session(issue_number: str) -> dict | None:
    """既存セッションがあるかチェック"""
    lock_file = get_lock_file(issue_number)
    if lock_file.exists():
        try:
            data = json.loads(lock_file.read_text())
            # PIDが生きているかチェック
            pid = data.get("pid")
            if pid:
                try:
                    os.kill(pid, 0)  # プロセス存在チェック
                    return data
                except OSError:
                    # プロセスが死んでいるのでロック削除
                    lock_file.unlink()
        except Exception:
            pass
    return None


def create_lock(issue_number: str, branch: str):
    """ロックファイル作成"""
    lock_file = get_lock_file(issue_number)
    data = {
        "pid": os.getpid(),
        "branch": branch,
        "started_at": datetime.now().isoformat(),
        "cwd": os.getcwd()
    }
    lock_file.write_text(json.dumps(data, indent=2))


def is_first_run() -> bool:
    """このセッションで初回実行かどうか"""
    if SESSION_STATE_FILE.exists():
        return False
    SESSION_STATE_FILE.write_text(str(os.getpid()))
    return True


def main():
    # 初回実行時のみセッション開始処理
    if not is_first_run():
        sys.exit(0)
    
    branch = get_current_branch()
    issue_number = extract_issue_number(branch)
    branch_type = get_branch_type(branch)
    
    # セッション情報を表示
    print("\n" + "=" * 60, file=sys.stderr)
    print("🚀 Claude Code Session Started", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(f"📁 Directory: {os.getcwd()}", file=sys.stderr)
    print(f"🌿 Branch: {branch}", file=sys.stderr)
    
    if issue_number:
        print(f"📋 Issue: #{issue_number}", file=sys.stderr)
        print(f"📝 Type: {branch_type}", file=sys.stderr)

        # 既存セッションチェック
        existing = check_existing_session(issue_number)
        if existing:
            print("=" * 60, file=sys.stderr)
            print("⚠️  WARNING: 並行セッション検出!", file=sys.stderr)
            print(f"   既存セッション PID: {existing.get('pid')}", file=sys.stderr)
            print(f"   開始時刻: {existing.get('started_at')}", file=sys.stderr)
            print(f"   ディレクトリ: {existing.get('cwd')}", file=sys.stderr)
            print("   → 同じIssueで複数セッションは非推奨です", file=sys.stderr)
            print("   → git gtr new <branch> で worktree を作成してください", file=sys.stderr)
            print("=" * 60, file=sys.stderr)
        else:
            # ロック作成
            create_lock(issue_number, branch)
            print(f"🔒 Session locked for Issue #{issue_number}", file=sys.stderr)
    else:
        print("⚠️  Issue番号なし（main/developブランチ?）", file=sys.stderr)

    # 開発ルール表示
    print("-" * 60, file=sys.stderr)
    print("📚 開発ルール:", file=sys.stderr)
    print("   ├─ Issue作成  → /issue コマンド", file=sys.stderr)
    print("   ├─ 要件定義PR → /req コマンド", file=sys.stderr)
    print("   ├─ 実装PR     → /dev コマンド", file=sys.stderr)
    print("   └─ 並行開発   → git gtr new <branch>", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
