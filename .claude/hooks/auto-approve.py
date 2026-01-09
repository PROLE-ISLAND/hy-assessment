#!/usr/bin/env python3
"""
PermissionRequest Hook: 安全なツールの自動承認
Claude Code v2.1.1+ 対応

確認ダイアログを50%削減するための自動許可システム
"""
import json
import sys
import os

# 自動許可する読み取り専用ツール
READONLY_TOOLS = [
    "Read",
    "Grep",
    "Glob",
    "LS",
    "WebSearch",
    "WebFetch",
]

# 自動許可するBashコマンドパターン
SAFE_BASH_PATTERNS = [
    # Git読み取り
    "git status",
    "git log",
    "git diff",
    "git branch",
    "git show",
    "git remote",
    "git tag",
    # ファイル読み取り
    "ls ",
    "cat ",
    "head ",
    "tail ",
    "wc ",
    "file ",
    "stat ",
    # npm/node読み取り
    "npm run test",
    "npm run lint",
    "npm run build",
    "npm run typecheck",
    "npm list",
    "node --version",
    "npx tsc --noEmit",
    # GitHub CLI読み取り
    "gh pr view",
    "gh pr list",
    "gh pr status",
    "gh issue view",
    "gh issue list",
    "gh repo view",
    "gh auth status",
    # Python
    "python3 --version",
    "pip list",
    "pytest ",
    # その他
    "which ",
    "type ",
    "echo ",
    "pwd",
    "whoami",
    "date",
    "env",
]

# 自動許可するMCPツール
MCP_READONLY = [
    # filesystem MCP
    "mcp__filesystem__read_text_file",
    "mcp__filesystem__read_file",
    "mcp__filesystem__read_multiple_files",
    "mcp__filesystem__list_directory",
    "mcp__filesystem__list_directory_with_sizes",
    "mcp__filesystem__directory_tree",
    "mcp__filesystem__get_file_info",
    "mcp__filesystem__search_files",
    "mcp__filesystem__list_allowed_directories",
    # o3 search
    "mcp__o3__o3-search",
    "mcp__o3-search__o3-search",
    # v0 読み取り
    "mcp__v0__getChat",
    "mcp__v0__findChats",
    "mcp__v0__getUser",
    # figma 読み取り
    "mcp__figma__get_screenshot",
    "mcp__figma__get_metadata",
    "mcp__figma__get_variable_defs",
    "mcp__figma__get_code_connect_map",
    "mcp__figma__whoami",
    # gpt5-devops 読み取り
    "mcp__gpt5-devops__plan",
    "mcp__gpt5-devops__review",
    "mcp__gpt5-devops__guard",
    "mcp__gpt5-devops__code_review",
    "mcp__gpt5-devops__ask",
]


def main():
    try:
        # 環境変数からフックデータを取得
        hook_input = os.environ.get("CLAUDE_HOOK_INPUT", "{}")
        hook_data = json.loads(hook_input)

        tool_name = hook_data.get("tool", "")
        tool_input = hook_data.get("input", {})

        # 入力がdict でない場合は文字列として処理
        if isinstance(tool_input, str):
            input_str = tool_input
        else:
            input_str = json.dumps(tool_input)

        decision = "ask"  # デフォルトはユーザーに確認
        reason = ""

        # 1. 読み取り専用ツールは自動許可
        if tool_name in READONLY_TOOLS:
            decision = "allow"
            reason = f"Readonly tool: {tool_name}"

        # 2. 安全なBashコマンドは自動許可
        elif tool_name == "Bash":
            command = tool_input.get("command", "") if isinstance(tool_input, dict) else input_str
            for pattern in SAFE_BASH_PATTERNS:
                if command.strip().startswith(pattern):
                    decision = "allow"
                    reason = f"Safe bash pattern: {pattern}"
                    break

        # 3. MCP読み取りツールは自動許可
        elif tool_name in MCP_READONLY:
            decision = "allow"
            reason = f"MCP readonly: {tool_name}"

        # 4. Task/TodoWriteは自動許可（サブエージェント・タスク管理）
        elif tool_name in ["Task", "TodoWrite", "TaskOutput"]:
            decision = "allow"
            reason = f"Agent management: {tool_name}"

        # 結果を出力
        result = {"decision": decision}
        if reason:
            result["reason"] = reason

        print(json.dumps(result))

    except Exception as e:
        # エラー時はユーザーに確認させる
        print(json.dumps({
            "decision": "ask",
            "error": str(e)
        }))


if __name__ == "__main__":
    main()
