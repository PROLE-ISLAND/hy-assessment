#!/bin/bash
#
# sync-guardrails.sh - GitHub から claude-guardrails.yaml を同期
#
# 使用方法:
#   ~/.claude/hooks/sync-guardrails.sh
#
# SessionStart hook で自動実行するか、手動で実行
#

set -e

ORG="PROLE-ISLAND"
REPO=".github"
FILE_PATH="rules/claude-guardrails.yaml"
CACHE_DIR="${HOME}/.claude/cache"
OUTPUT_FILE="${CACHE_DIR}/claude-guardrails.yaml"
CACHE_TTL=3600  # 1時間

# キャッシュディレクトリ作成
mkdir -p "$CACHE_DIR"

# キャッシュが有効かチェック
should_sync=true
if [ -f "$OUTPUT_FILE" ]; then
    # macOS と Linux で互換性のある方法
    if [[ "$OSTYPE" == "darwin"* ]]; then
        cache_age=$(($(date +%s) - $(stat -f%m "$OUTPUT_FILE" 2>/dev/null || echo 0)))
    else
        cache_age=$(($(date +%s) - $(stat -c%Y "$OUTPUT_FILE" 2>/dev/null || echo 0)))
    fi
    if [ "$cache_age" -lt "$CACHE_TTL" ]; then
        should_sync=false
    fi
fi

if [ "$should_sync" = true ]; then
    # GitHub CLI (gh) を使用
    if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
        content=$(gh api "repos/${ORG}/${REPO}/contents/${FILE_PATH}" --jq '.content' 2>/dev/null | base64 -d 2>/dev/null || echo "")
        
        if [ -n "$content" ]; then
            echo "$content" > "$OUTPUT_FILE"
            echo "[sync-guardrails] Synced from GitHub: ${ORG}/${REPO}/${FILE_PATH}" >&2
        else
            echo "[sync-guardrails] GitHub API failed, using existing cache" >&2
        fi
    else
        echo "[sync-guardrails] gh not available or not authenticated, using existing cache" >&2
    fi
else
    echo "[sync-guardrails] Cache valid (age: ${cache_age}s < TTL: ${CACHE_TTL}s)" >&2
fi

# 設定が存在することを確認
if [ -f "$OUTPUT_FILE" ]; then
    echo "[sync-guardrails] OK: $OUTPUT_FILE" >&2
else
    echo "[sync-guardrails] WARNING: No guardrails file found" >&2
fi
