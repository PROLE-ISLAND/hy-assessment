#!/usr/bin/env python3
"""
PostToolUse: TypeScript品質チェック（SSOT版 v2.0）

機能:
- Edit/Write で *.ts/*.tsx を編集した場合に自動実行
- file hash + TTL キャッシュで重複実行を回避
- lint + type-check + セキュリティパターン検出

設定: ~/.claude/cache/claude-guardrails.yaml
"""
from __future__ import annotations

import hashlib
import json
import shlex
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# lib ディレクトリをパスに追加
sys.path.insert(0, str(Path(__file__).parent))
from lib.guardrails_loader import load_guardrails, get

CACHE_DIR = Path.home() / ".claude" / "cache"
CACHE_FILE = CACHE_DIR / "quality-ts-cache.json"
CACHE_TTL = 300  # 5分


def normalize_path(file_path: str) -> Optional[Path]:
    try:
        p = Path(file_path).expanduser()
        if not p.is_absolute():
            p = (Path.cwd() / p).resolve()
        return p
    except Exception:
        return None


def get_hash(path: Path) -> Optional[str]:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except Exception:
        return None


def load_cache() -> Dict[str, Any]:
    try:
        if CACHE_FILE.exists():
            return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def save_cache(cache: Dict[str, Any]) -> None:
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def is_cached(key: str, file_hash: str, cache: Dict[str, Any]) -> bool:
    entry = cache.get(key)
    if not isinstance(entry, dict):
        return False
    if entry.get("hash") != file_hash:
        return False
    ts = float(entry.get("time", 0) or 0)
    return (time.time() - ts) < CACHE_TTL


def update_cache(key: str, file_hash: str, result: str, cache: Dict[str, Any]) -> None:
    cache[key] = {"hash": file_hash, "time": time.time(), "result": result}
    save_cache(cache)


def run_cmd(cmd: List[str], timeout: int) -> Tuple[bool, str]:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=str(Path.cwd()))
        ok = (r.returncode == 0)
        out = (r.stdout or r.stderr or "").strip()
        return ok, out
    except subprocess.TimeoutExpired:
        return False, "Timeout"
    except Exception as e:
        return False, f"Error: {e}"


def shlex_split(cmd: str) -> List[str]:
    try:
        return shlex.split(cmd)
    except Exception:
        return cmd.split()


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool_name = payload.get("tool_name", "")
    if tool_name not in ["Edit", "Write"]:
        sys.exit(0)

    file_path = (payload.get("tool_input") or {}).get("file_path", "")
    if not isinstance(file_path, str) or not file_path.endswith((".ts", ".tsx")):
        sys.exit(0)

    p = normalize_path(file_path)
    if not p or not p.exists():
        sys.exit(0)

    file_hash = get_hash(p)
    if not file_hash:
        sys.exit(0)

    cache = load_cache()
    key = str(p)

    if is_cached(key, file_hash, cache):
        cached_result = cache.get(key, {}).get("result", "OK")
        print(f"[TypeScript Quality Check] Cached: {p.name} :: {cached_result}")
        sys.exit(0)

    # Guardrails から設定読み込み
    guardrails = load_guardrails()
    
    # セキュリティパターン（YAMLから取得）
    sec_rules = get(guardrails, "security_patterns", "typescript", default=[]) or []
    patterns: List[Tuple[str, str, str]] = []
    for r in sec_rules:
        if not isinstance(r, dict):
            continue
        pat = r.get("pattern")
        sev = r.get("severity", "medium")
        msg = r.get("message", "")
        if pat:
            patterns.append((str(pat), str(sev), str(msg)))
    
    # フォールバック: 最低限のパターン
    if not patterns:
        patterns = [
            ("dangerouslySetInnerHTML", "high", "XSS risk - use DOMPurify / sanitize"),
            ("eval(", "critical", "eval() is prohibited"),
            ("document.write", "medium", "document.write is deprecated"),
        ]

    # DoD Bronze commands from YAML
    bronze = get(guardrails, "dod", "bronze", "requirements", default=[]) or []
    tsc_cmd = "npx tsc --noEmit"
    lint_cmd = "npm run lint"
    for req in bronze:
        if not isinstance(req, dict):
            continue
        if req.get("id") == "A1" and req.get("command"):
            tsc_cmd = str(req["command"])
        if req.get("id") == "A2" and req.get("command"):
            lint_cmd = str(req["command"])

    print(f"\n[TypeScript Quality Check] {p.name}")

    results: List[str] = []

    # type-check (プロジェクト全体)
    ok, out = run_cmd(shlex_split(tsc_cmd), timeout=90)
    if ok:
        print("  Type check: OK")
        results.append("type:OK")
    else:
        print("  Type check: FAIL")
        if out:
            print(f"    {out[:200]}")
        results.append("type:FAIL")

    # lint (対象ファイルのみ)
    lint_args = shlex_split(lint_cmd)
    # npm run lint の場合、-- でファイルパスを追加
    if "npm" in lint_args and "run" in lint_args:
        lint_args.extend(["--", str(p)])
    else:
        lint_args.append(str(p))
    
    ok, out = run_cmd(lint_args, timeout=60)
    if ok:
        print("  Lint: OK")
        results.append("lint:OK")
    else:
        print("  Lint: FAIL")
        if out:
            print(f"    {out[:150]}")
        results.append("lint:FAIL")

    # security scan (簡易)
    content = p.read_text(encoding="utf-8", errors="ignore")
    sec_hits = 0
    for pat, sev, msg in patterns:
        if pat in content:
            sec_hits += 1
            print(f"  SECURITY[{sev}]: {pat} - {msg}")

    results.append("security:OK" if sec_hits == 0 else f"security:{sec_hits}")

    summary = " | ".join(results)
    update_cache(key, file_hash, summary, cache)

    sys.exit(0)


if __name__ == "__main__":
    main()
