#!/usr/bin/env python3
"""
Branch Guard Hook for Claude Code (PreToolUse)
- git checkout / git switch でブランチ切り替えを検出して警告
- worktree では別ブランチに切り替えないことを推奨
"""
import json
import os
import re
import sys


def parse_input() -> dict:
    """標準入力からツール情報を取得"""
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def is_branch_switch_command(tool_name: str, tool_input: dict) -> tuple[bool, str]:
    """
    ブランチ切り替えコマンドかどうかを判定
    Returns: (is_switch, target_branch)
    """
    if tool_name != "Bash":
        return False, ""
    
    command = tool_input.get("command", "")
    
    # git checkout <branch> を検出
    # ただし git checkout -b (新規作成) や git checkout -- <file> (ファイル復元) は除外
    checkout_match = re.search(
        r'git\s+checkout\s+(?!-b\s)(?!--\s)([a-zA-Z0-9/_-]+)',
        command
    )
    if checkout_match:
        target = checkout_match.group(1)
        # ファイルパスっぽいものは除外
        if not target.startswith('.') and '/' not in target or target.startswith(('feature/', 'bugfix/', 'hotfix/', 'requirements/', 'main', 'develop')):
            return True, target
    
    # git switch <branch> を検出
    # ただし git switch -c (新規作成) は除外
    switch_match = re.search(
        r'git\s+switch\s+(?!-c\s)([a-zA-Z0-9/_-]+)',
        command
    )
    if switch_match:
        return True, switch_match.group(1)
    
    return False, ""


def main():
    data = parse_input()
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    
    is_switch, target_branch = is_branch_switch_command(tool_name, tool_input)
    
    if is_switch:
        print("\n" + "=" * 60, file=sys.stderr)
        print("⚠️  BRANCH SWITCH WARNING", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(f"   検出: ブランチ切り替え → {target_branch}", file=sys.stderr)
        print("", file=sys.stderr)
        print("   並行開発では worktree を使用してください:", file=sys.stderr)
        print(f"   $ git gtr new {target_branch}", file=sys.stderr)
        print(f"   $ git gtr ai {target_branch}", file=sys.stderr)
        print("", file=sys.stderr)
        print("   現在のセッションは現在のブランチで作業を続けるべきです", file=sys.stderr)
        print("=" * 60 + "\n", file=sys.stderr)
        # 警告のみ、ブロックはしない (exit 0)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
