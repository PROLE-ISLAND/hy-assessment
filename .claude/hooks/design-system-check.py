#!/usr/bin/env python3
"""
PostToolUse: デザインシステム準拠チェック（汎用版）

機能:
- Edit/Write で *.tsx を編集した場合に自動実行
- ハードコード色・サイズの検出
- Design System Registry との整合性チェック
- data-testid 必須チェック

設定:
- registry.json が存在する場合: Registry準拠チェック
- 存在しない場合: 基本ルールのみチェック + 警告
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


# ハードコード色パターン（Tailwind）
HARDCODED_COLOR_PATTERNS = [
    # 基本色
    r'\b(text|bg|border|fill|stroke)-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\d{2,3}\b',
    # 任意の色指定
    r'\b(text|bg|border)-\[(#[0-9a-fA-F]{3,6}|rgb|rgba|hsl)\b',
]

# 許可されたデザインシステム変数パターン
ALLOWED_PATTERNS = [
    r'stateColors\.',
    r'designTokens\.',
    r'theme\.',
    r'cn\(',  # clsx/tailwind-merge
    r'var\(--',  # CSS変数
]

# data-testid が必要なコンポーネント
TESTID_REQUIRED_TAGS = [
    'button', 'Button',
    'input', 'Input',
    'select', 'Select',
    'form', 'Form',
    'dialog', 'Dialog', 'Modal',
    'table', 'Table', 'DataTable',
]


def find_git_root(start: Path) -> Optional[Path]:
    """git root を探す"""
    current = start
    while current != current.parent:
        if (current / '.git').exists():
            return current
        current = current.parent
    return None


def load_registry(git_root: Path) -> Optional[Dict[str, Any]]:
    """Design System Registry を読み込む"""
    registry_paths = [
        git_root / 'registry.json',
        git_root / 'src' / 'registry.json',
        git_root / '.design-system' / 'registry.json',
    ]
    for path in registry_paths:
        if path.exists():
            try:
                return json.loads(path.read_text(encoding='utf-8'))
            except Exception:
                pass
    return None


def check_hardcoded_colors(content: str, file_path: Path) -> List[str]:
    """ハードコード色を検出"""
    warnings = []
    lines = content.split('\n')

    for i, line in enumerate(lines, 1):
        # コメント行はスキップ
        if line.strip().startswith('//') or line.strip().startswith('*'):
            continue

        # 許可パターンを含む行はスキップ
        if any(re.search(pat, line) for pat in ALLOWED_PATTERNS):
            continue

        for pattern in HARDCODED_COLOR_PATTERNS:
            matches = re.findall(pattern, line)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        match = '-'.join(match)
                    warnings.append(f"L{i}: ハードコード色 `{match}` → Design System変数を使用")

    return warnings


def check_testid(content: str, file_path: Path) -> List[str]:
    """data-testid の存在チェック"""
    warnings = []
    lines = content.split('\n')

    for i, line in enumerate(lines, 1):
        for tag in TESTID_REQUIRED_TAGS:
            # <Button や <button を検出
            if re.search(rf'<{tag}[\s>]', line, re.IGNORECASE):
                # 同じ行または次の数行に data-testid があるか
                context = '\n'.join(lines[max(0, i-1):min(len(lines), i+3)])
                if 'data-testid' not in context:
                    warnings.append(f"L{i}: `<{tag}>` に data-testid が必要")

    return warnings


def check_registry_compliance(content: str, registry: Dict[str, Any], file_path: Path) -> List[str]:
    """Registry 登録コンポーネントの使用チェック"""
    warnings = []

    components = registry.get('components', [])
    if not components:
        return warnings

    registered_names = {c.get('name', '') for c in components if isinstance(c, dict)}

    # import 文からコンポーネント名を抽出
    import_pattern = r"import\s+\{([^}]+)\}\s+from\s+['\"]@/components"
    imports = re.findall(import_pattern, content)

    for import_group in imports:
        imported_components = [c.strip() for c in import_group.split(',')]
        for comp in imported_components:
            # kebab-case に変換して比較
            kebab = re.sub(r'([a-z])([A-Z])', r'\1-\2', comp).lower()
            if kebab not in registered_names and comp.lower() not in registered_names:
                warnings.append(f"コンポーネント `{comp}` が Registry 未登録")

    return warnings


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool_name = payload.get("tool_name", "")
    if tool_name not in ["Edit", "Write"]:
        sys.exit(0)

    file_path = (payload.get("tool_input") or {}).get("file_path", "")
    if not isinstance(file_path, str) or not file_path.endswith((".tsx", ".jsx")):
        sys.exit(0)

    p = Path(file_path)
    if not p.exists():
        sys.exit(0)

    content = p.read_text(encoding='utf-8', errors='ignore')
    git_root = find_git_root(p)

    all_warnings: List[str] = []

    # 1. ハードコード色チェック
    all_warnings.extend(check_hardcoded_colors(content, p))

    # 2. data-testid チェック
    all_warnings.extend(check_testid(content, p))

    # 3. Registry 準拠チェック
    registry = load_registry(git_root) if git_root else None
    if registry:
        all_warnings.extend(check_registry_compliance(content, registry, p))
    else:
        # Registry がない場合は警告
        print(f"\n[Design System Check] {p.name}")
        print("  ⚠️ registry.json が見つかりません")
        print("  → Storybook でデザインシステムを構築してください")
        print("  → 参照: https://github.com/PROLE-ISLAND/.github/wiki/デザインシステム構築ガイド")

    # 結果出力
    if all_warnings:
        print(f"\n[Design System Check] {p.name}")
        print("=" * 50)
        for w in all_warnings[:10]:  # 最大10件
            print(f"  ⚠️ {w}")
        if len(all_warnings) > 10:
            print(f"  ... 他 {len(all_warnings) - 10} 件")
        print("=" * 50)
        print("  💡 参照: https://github.com/PROLE-ISLAND/.github/wiki/Design-System-Checklist")
    elif registry:
        print(f"[Design System Check] {p.name} ✓ OK")

    sys.exit(0)


if __name__ == "__main__":
    main()
