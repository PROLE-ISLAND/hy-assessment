#!/usr/bin/env python3
"""
PreToolUse / SessionStart: デザインシステムコンテキスト提供

機能:
- UI開発開始前にデザインシステムの現状を把握・表示
- registry.json / Storybook / コンポーネント一覧を検出
- 既存トークン・コンポーネントをコンテキストとして提供

トリガー:
- PreToolUse: v0, mcp__v0__*, UI関連コマンド実行前
- UserPromptSubmit: UI/デザイン関連キーワード検出時
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# キャッシュ（セッション中の重複表示防止）
CACHE_FILE = Path.home() / ".claude" / "cache" / "design-system-context-shown.json"


def find_git_root() -> Optional[Path]:
    """git root を探す"""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0:
            return Path(result.stdout.strip())
    except Exception:
        pass
    return Path.cwd()


def load_registry(git_root: Path) -> Optional[Dict[str, Any]]:
    """Design System Registry を読み込む"""
    registry_paths = [
        git_root / 'registry.json',
        git_root / 'src' / 'registry.json',
        git_root / '.design-system' / 'registry.json',
        git_root / 'next-app' / 'registry.json',
    ]
    for path in registry_paths:
        if path.exists():
            try:
                return json.loads(path.read_text(encoding='utf-8'))
            except Exception:
                pass
    return None


def find_storybook(git_root: Path) -> Optional[Path]:
    """Storybook 設定を探す"""
    storybook_paths = [
        git_root / '.storybook',
        git_root / 'next-app' / '.storybook',
        git_root / 'src' / '.storybook',
    ]
    for path in storybook_paths:
        if path.exists():
            return path
    return None


def find_components(git_root: Path) -> List[Tuple[str, Path]]:
    """コンポーネントファイルを探す"""
    components = []
    component_dirs = [
        git_root / 'src' / 'components',
        git_root / 'next-app' / 'src' / 'components',
        git_root / 'components',
        git_root / 'app' / 'components',
    ]

    for comp_dir in component_dirs:
        if not comp_dir.exists():
            continue
        for tsx in comp_dir.rglob('*.tsx'):
            # index.tsx やテストは除外
            if tsx.name in ['index.tsx', 'index.ts'] or '.test.' in tsx.name or '.spec.' in tsx.name:
                continue
            # ファイル名からコンポーネント名を推測
            name = tsx.stem
            # kebab-case を PascalCase に
            pascal = ''.join(word.capitalize() for word in name.split('-'))
            components.append((pascal, tsx))

    return components[:30]  # 最大30件


def find_design_tokens(git_root: Path) -> Dict[str, Path]:
    """デザイントークンファイルを探す"""
    tokens = {}
    token_patterns = [
        ('colors', ['colors.css', 'colors.ts', 'colors.json']),
        ('typography', ['fonts.css', 'typography.css', 'typography.ts']),
        ('spacing', ['spacing.css', 'spacing.ts']),
        ('tokens', ['tokens.css', 'design-tokens.ts', 'tokens.json']),
    ]

    search_dirs = [
        git_root / 'src' / 'styles',
        git_root / 'src' / 'lib',
        git_root / 'styles',
        git_root / 'next-app' / 'src' / 'styles',
    ]

    for token_type, filenames in token_patterns:
        for search_dir in search_dirs:
            if not search_dir.exists():
                continue
            for filename in filenames:
                token_file = search_dir / filename
                if token_file.exists():
                    tokens[token_type] = token_file
                    break
            # tokens ディレクトリも探す
            tokens_dir = search_dir / 'tokens'
            if tokens_dir.exists():
                for filename in filenames:
                    token_file = tokens_dir / filename
                    if token_file.exists():
                        tokens[token_type] = token_file
                        break

    return tokens


def was_shown_recently(git_root: Path) -> bool:
    """最近表示済みかチェック（5分以内）"""
    try:
        if CACHE_FILE.exists():
            cache = json.loads(CACHE_FILE.read_text())
            key = str(git_root)
            if key in cache:
                import time
                if time.time() - cache[key] < 300:  # 5分
                    return True
    except Exception:
        pass
    return False


def mark_shown(git_root: Path) -> None:
    """表示済みマーク"""
    try:
        import time
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        cache = {}
        if CACHE_FILE.exists():
            cache = json.loads(CACHE_FILE.read_text())
        cache[str(git_root)] = time.time()
        CACHE_FILE.write_text(json.dumps(cache))
    except Exception:
        pass


def display_design_system_context(git_root: Path, force: bool = False) -> None:
    """デザインシステムコンテキストを表示"""
    if not force and was_shown_recently(git_root):
        return

    registry = load_registry(git_root)
    storybook = find_storybook(git_root)
    components = find_components(git_root)
    tokens = find_design_tokens(git_root)

    print("\n" + "=" * 60)
    print("🎨 DESIGN SYSTEM CONTEXT")
    print("=" * 60)

    # Registry 状態
    if registry:
        print(f"\n📦 Registry: ✓ 検出済み")
        reg_components = registry.get('components', [])
        if reg_components:
            print(f"   登録コンポーネント: {len(reg_components)}件")
            for comp in reg_components[:5]:
                if isinstance(comp, dict):
                    print(f"   - {comp.get('name', 'unknown')}")
            if len(reg_components) > 5:
                print(f"   ... 他 {len(reg_components) - 5}件")
    else:
        print(f"\n📦 Registry: ❌ 未設定")
        print("   → registry.json を作成してください")
        print("   → 参照: https://github.com/PROLE-ISLAND/.github/wiki/デザインシステム構築ガイド")

    # Storybook 状態
    if storybook:
        print(f"\n📚 Storybook: ✓ {storybook.relative_to(git_root)}")
    else:
        print(f"\n📚 Storybook: ❌ 未設定")
        print("   → npx storybook@latest init で初期化")

    # デザイントークン
    if tokens:
        print(f"\n🎯 Design Tokens:")
        for token_type, path in tokens.items():
            print(f"   - {token_type}: {path.relative_to(git_root)}")
    else:
        print(f"\n🎯 Design Tokens: ❌ 未検出")

    # コンポーネント一覧
    if components:
        print(f"\n🧩 既存コンポーネント ({len(components)}件):")
        # UI コンポーネントとその他を分類
        ui_comps = [c for c in components if 'ui' in str(c[1]).lower()]
        other_comps = [c for c in components if 'ui' not in str(c[1]).lower()]

        if ui_comps:
            print("   [UI]")
            for name, path in ui_comps[:10]:
                print(f"   - {name}")

        if other_comps:
            print("   [Feature]")
            for name, path in other_comps[:10]:
                print(f"   - {name}")

    # 推奨アクション
    print(f"\n💡 推奨アクション:")
    if not registry:
        print("   1. Storybook でデザインシステムを構築")
        print("   2. registry.json を作成")
    if not tokens:
        print("   3. デザイントークン（colors, typography）を定義")
    if registry and tokens:
        print("   ✓ デザインシステム準備完了 - 既存コンポーネントを活用してください")

    print("=" * 60 + "\n")

    mark_shown(git_root)


def is_ui_related_tool(tool_name: str, tool_input: Dict[str, Any]) -> bool:
    """UI関連ツールかどうか判定"""
    # v0 MCP
    if tool_name.startswith('mcp__v0__'):
        return True

    # Bash で v0 や UI 関連コマンド
    if tool_name == 'Bash':
        cmd = tool_input.get('command', '')
        ui_keywords = ['v0', 'storybook', 'component', 'ui-generate', 'design']
        if any(kw in cmd.lower() for kw in ui_keywords):
            return True

    return False


def is_ui_related_prompt(prompt: str) -> bool:
    """UI関連のプロンプトかどうか判定"""
    ui_keywords = [
        'ui', 'UI', 'デザイン', 'コンポーネント', 'component',
        'v0', 'storybook', 'figma', 'ボタン', 'フォーム',
        '画面', 'ページ', 'レイアウト', 'スタイル',
    ]
    return any(kw in prompt for kw in ui_keywords)


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    git_root = find_git_root()
    if not git_root:
        sys.exit(0)

    # PreToolUse の場合
    tool_name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input", {})

    if tool_name and is_ui_related_tool(tool_name, tool_input):
        display_design_system_context(git_root)
        sys.exit(0)

    # UserPromptSubmit の場合
    user_prompt = payload.get("user_prompt", "") or payload.get("prompt", "")
    if user_prompt and is_ui_related_prompt(user_prompt):
        display_design_system_context(git_root)

    sys.exit(0)


if __name__ == "__main__":
    main()
