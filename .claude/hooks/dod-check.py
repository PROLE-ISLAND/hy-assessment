#!/usr/bin/env python3
"""
Stop Hook: DoD完了確認（SSOT版 v2.0）

機能:
- セッション終了前に未完了項目を警告
- PostToolUseで実行した品質チェック結果をキャッシュから参照
- strictモード時のみ実際にチェック実行

設計原則:
- 軽量: 通常はキャッシュ参照のみ
- Repo分離: 複数worktree/複数repoのキャッシュ混入を防止
- SSOT: DoDコマンドはYAMLから取得

設定: ~/.claude/cache/claude-guardrails.yaml
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# lib ディレクトリをパスに追加
sys.path.insert(0, str(Path(__file__).parent))
from lib.guardrails_loader import load_guardrails, get

CACHE_DIR = Path.home() / ".claude" / "cache"
QUALITY_CACHE = CACHE_DIR / "quality-ts-cache.json"
DOD_CACHE = CACHE_DIR / "dod-state.json"

# strict mode: 1で有効
STRICT_MODE = os.environ.get("CLAUDE_DOD_STRICT", "0") == "1"

# quality-ts cache TTL（秒）
QUALITY_CACHE_TTL = int(os.environ.get("CLAUDE_QUALITY_CACHE_TTL", "600"))


def run(cmd: List[str], timeout: int) -> Tuple[int, str]:
    """subprocess helper"""
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    out = (r.stdout or r.stderr or "").strip()
    return r.returncode, out


def git_root() -> Optional[str]:
    """現在ディレクトリのgit rootを取得"""
    try:
        code, out = run(["git", "rev-parse", "--show-toplevel"], timeout=3)
        if code == 0 and out:
            return out.splitlines()[0].strip()
    except Exception:
        pass
    return None


def repo_key() -> str:
    """repo識別キー（git root をhash化）"""
    root = git_root() or str(Path.cwd())
    h = hashlib.sha256(root.encode("utf-8")).hexdigest()[:12]
    return f"repo:{h}"


def load_json(path: Path) -> Dict[str, Any]:
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def save_json(path: Path, data: Dict[str, Any]) -> None:
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def check_git_status() -> List[str]:
    warnings: List[str] = []
    try:
        code, out = run(["git", "status", "--porcelain"], timeout=5)
        if code == 0 and out.strip():
            lines = [l for l in out.splitlines() if l.strip()]
            warnings.append(f"Uncommitted changes: {len(lines)} files")

        code, out = run(["git", "status", "-sb"], timeout=5)
        if code == 0 and "ahead" in out:
            warnings.append("Unpushed commits exist")
    except Exception:
        pass
    return warnings


def check_dod_from_cache() -> List[str]:
    """
    PostToolUse: quality-ts.py のキャッシュを集計
    - repo混入を避けるため、キーがこのrepo配下のpathだけを見る
    - TTLを超えて古いエントリは「古い」として警告
    """
    warnings: List[str] = []
    quality_cache = load_json(QUALITY_CACHE)
    if not quality_cache:
        warnings.append("No quality cache found (run type-check/lint manually)")
        return warnings

    root = git_root()
    if not root:
        warnings.append("Not a git repository (skip DoD cache check)")
        return warnings

    now = time.time()

    type_fails = 0
    lint_fails = 0
    security_issues = 0
    stale_entries = 0
    checked_entries = 0

    for file_path, entry in quality_cache.items():
        if not isinstance(entry, dict):
            continue

        # repo配下のファイルだけ対象にする
        try:
            p = Path(file_path)
            if not p.is_absolute():
                continue
            if not str(p).startswith(str(Path(root))):
                continue
        except Exception:
            continue

        checked_entries += 1

        result = str(entry.get("result", "") or "")
        ts = float(entry.get("time", 0) or 0)

        if ts <= 0 or (now - ts) > QUALITY_CACHE_TTL:
            stale_entries += 1

        if "type:FAIL" in result:
            type_fails += 1
        if "lint:FAIL" in result:
            lint_fails += 1
        if "security:" in result and "security:OK" not in result:
            security_issues += 1

    if checked_entries == 0:
        warnings.append("No repo-local quality cache entries found")
        return warnings

    if stale_entries > 0:
        warnings.append(f"Quality cache stale: {stale_entries}/{checked_entries} entries older than {QUALITY_CACHE_TTL}s")

    if type_fails > 0:
        warnings.append(f"DoD Bronze (cache): {type_fails} type failures")
    if lint_fails > 0:
        warnings.append(f"DoD Bronze (cache): {lint_fails} lint failures")
    if security_issues > 0:
        warnings.append(f"Security (cache): {security_issues} issues detected")

    return warnings


def check_dod_strict(guardrails: Dict[str, Any]) -> List[str]:
    """
    strictモード: 実際にコマンド実行（YAMLから取得）
    """
    warnings: List[str] = []

    # Bronze commands from YAML
    bronze = get(guardrails, "dod", "bronze", "requirements", default=[]) or []
    commands: List[Tuple[str, str]] = []
    
    for req in bronze:
        if not isinstance(req, dict):
            continue
        cmd = req.get("command")
        name = req.get("name", cmd)
        if cmd and req.get("required", False) is True:
            commands.append((str(cmd), str(name)))

    # フォールバック
    if not commands:
        commands = [
            ("npx tsc --noEmit", "Type Check"),
            ("npm run lint", "Lint"),
            ("npm run test:run -- --passWithNoTests", "Tests"),
        ]

    for cmd, name in commands:
        try:
            code, _ = run(cmd.split(), timeout=180)
            if code != 0:
                warnings.append(f"DoD Bronze (strict): {name} failed")
        except subprocess.TimeoutExpired:
            warnings.append(f"DoD Bronze (strict): {name} timeout")
        except Exception as e:
            warnings.append(f"DoD Bronze (strict): {name} error ({e})")

    return warnings


def main() -> None:
    guardrails = load_guardrails()
    
    all_warnings: List[str] = []

    # Git状態
    all_warnings.extend(check_git_status())

    # DoD状態
    if STRICT_MODE:
        print("[DoD Check] Strict mode enabled -> running full checks...")
        all_warnings.extend(check_dod_strict(guardrails))
    else:
        all_warnings.extend(check_dod_from_cache())

    # 出力
    if all_warnings:
        print("\n" + "=" * 60)
        print("SESSION END CHECKLIST")
        print("=" * 60)
        for i, w in enumerate(all_warnings, 1):
            print(f"  {i}. {w}")

        print("\nActions:")
        if any("Uncommitted" in w for w in all_warnings):
            print("  - git add && git commit")
        if any("Unpushed" in w for w in all_warnings):
            print("  - git push")
        if any("DoD" in w for w in all_warnings) or any("Security" in w for w in all_warnings):
            print("  - Fix issues before merge")

        # YAMLのパスを表示
        yaml_path = get(guardrails, "_path", default="")
        if yaml_path:
            print(f"\nRules: {yaml_path}")
        print("Ref: https://github.com/PROLE-ISLAND/.github/blob/main/DoD_STANDARDS.md")
        print("=" * 60)

        # 状態を保存（repo別で格納）
        state = load_json(DOD_CACHE)
        state[repo_key()] = {
            "time": time.time(),
            "warnings": all_warnings,
            "strict_mode": STRICT_MODE,
            "cwd": str(Path.cwd()),
            "git_root": git_root() or "",
            "guardrails": yaml_path,
        }
        save_json(DOD_CACHE, state)
    else:
        print("\n[Session End] All checks passed. Good work!")

    sys.exit(0)


if __name__ == "__main__":
    main()
