#!/usr/bin/env python3
"""
Guardrails YAML Loader - SSOT版
Claude Code Hooks の共通設定ローダー

環境変数:
  CLAUDE_GUARDRAILS_PATH: カスタムYAMLパス
  デフォルト: ~/.claude/cache/claude-guardrails.yaml
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional

# 優先順位: ローカルソース > キャッシュ
LOCAL_GUARDRAILS_PATHS = [
    str(Path.home() / "projects" / "prole-github-org" / "rules" / "claude-guardrails.yaml"),
]
DEFAULT_GUARDRAILS_PATH = str(Path.home() / ".claude" / "cache" / "claude-guardrails.yaml")


def _safe_import_yaml():
    """YAML モジュールを安全にインポート"""
    try:
        import yaml  # type: ignore
        return yaml
    except ImportError:
        return None


def load_guardrails(path: Optional[str] = None) -> Dict[str, Any]:
    """
    Guardrails YAML を読み込む。

    優先順位:
    1. path 引数
    2. CLAUDE_GUARDRAILS_PATH 環境変数
    3. ローカルソース（prole-github-org/rules/）← 開発中はこちらを優先
    4. ~/.claude/cache/claude-guardrails.yaml

    Returns:
        dict: 設定データ。エラー時は {"_error": "..."} を返す
    """
    yaml_mod = _safe_import_yaml()
    if yaml_mod is None:
        return {"_error": "PyYAML not installed (pip install pyyaml)"}

    # 優先順位に従ってパスを決定
    p = path or os.environ.get("CLAUDE_GUARDRAILS_PATH")

    if not p:
        # ローカルソースを先にチェック
        for local_path in LOCAL_GUARDRAILS_PATHS:
            if Path(local_path).exists():
                p = local_path
                break

    if not p:
        p = DEFAULT_GUARDRAILS_PATH

    try:
        pp = Path(p).expanduser()
        if not pp.is_absolute():
            pp = (Path.cwd() / pp).resolve()

        if not pp.exists():
            return {"_error": f"Guardrails file not found: {pp}"}

        data = yaml_mod.safe_load(pp.read_text(encoding="utf-8")) or {}
        data["_path"] = str(pp)
        return data
    except Exception as e:
        return {"_error": f"Failed to load guardrails: {e}"}


def get(d: Dict[str, Any], *keys: str, default=None):
    """
    ネストされた辞書から安全に値を取得
    
    例:
        get(data, "issue", "required_sections", default=[])
        get(data, "dod", "bronze", "requirements", default=[])
    """
    cur: Any = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur


if __name__ == "__main__":
    # テスト用
    import json
    data = load_guardrails()
    print(json.dumps(data, indent=2, ensure_ascii=False))
