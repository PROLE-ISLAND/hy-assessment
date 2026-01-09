---
name: monitor
description: バックグラウンド監視。ビルド・テスト・ログの継続監視とアラート
arguments:
  - name: target
    description: 監視対象（build/test/log/process）
    required: true
  - name: interval
    description: 監視間隔（秒）
    required: false
    default: "10"
  - name: alert
    description: アラート条件（error/warning/all）
    required: false
    default: "error"
allowed-tools:
  - Read
  - Bash(tail:*)
  - Bash(ps:*)
  - Bash(npm:*)
  - Bash(npx:*)
  - Task
  - Write
---

# /monitor - バックグラウンド監視スキル

長時間タスクをバックグラウンドで監視し、問題発生時にアラート。

## 監視対象

### build - ビルド監視
```bash
/monitor target=build
# → npm run build の出力を監視
# → エラー発生時に報告
```

### test - テスト監視
```bash
/monitor target=test
# → npm run test の出力を監視
# → 失敗テスト発生時に報告
```

### log - ログ監視
```bash
/monitor target=log interval=5
# → 指定ログファイルを tail -f
# → エラーパターン検出時に報告
```

### process - プロセス監視
```bash
/monitor target=process
# → 開発サーバーの死活監視
# → クラッシュ時に報告・再起動提案
```

## 実行フロー

```
1. 監視開始
   Task({ run_in_background: true })
   ↓
2. 継続監視
   while(running) {
     checkStatus()
     sleep(interval)
   }
   ↓
3. 問題検出
   if (error) {
     generateAlert()
   }
   ↓
4. アラート
   "❌ ビルドエラー検出: ..."
```

## アラート形式

```markdown
## 🚨 監視アラート

**対象**: build
**時刻**: 2026-01-08 22:30:00
**種別**: error

### 検出内容
```
Error: Cannot find module './missing'
  at /src/lib/index.ts:15:1
```

### 推奨アクション
1. missing.ts ファイルを確認
2. import パスを修正
3. 再ビルド実行
```

## 使用例

```bash
# ビルド監視（バックグラウンド）
/monitor target=build

# テスト監視（5秒間隔）
/monitor target=test interval=5

# ログ監視（警告も含む）
/monitor target=log alert=warning
```

## 監視停止

```bash
# TaskOutputで状態確認
TaskOutput({ task_id: "monitor-xxx" })

# KillShellで停止
KillShell({ shell_id: "monitor-xxx" })
```
