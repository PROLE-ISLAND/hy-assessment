#!/usr/bin/env python3
"""
Session Cleanup Hook for Claude Code
- セッション終了時にロックファイルを削除
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

LOCK_DIR = Path.home() / ".claude" / "sessions"


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
    match = re.search(r'issue-(\d+)', branch, re.IGNORECASE)
    return match.group(1) if match else None


def cleanup_lock(issue_number: str):
    """ロックファイル削除（自分のPIDのもののみ）"""
    lock_file = LOCK_DIR / f"issue-{issue_number}.lock"
    if lock_file.exists():
        try:
            data = json.loads(lock_file.read_text())
            if data.get("pid") == os.getpid():
                lock_file.unlink()
                print(f"🔓 Session lock released for Issue #{issue_number}", file=sys.stderr)
        except Exception:
            pass


def cleanup_state_file():
    """セッション状態ファイル削除"""
    state_file = Path("/tmp") / f"claude-session-{os.getpid()}.state"
    if state_file.exists():
        state_file.unlink()


def main():
    branch = get_current_branch()
    issue_number = extract_issue_number(branch)
    
    if issue_number:
        cleanup_lock(issue_number)
    
    cleanup_state_file()
    
    print("\n👋 Claude Code Session Ended\n", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
