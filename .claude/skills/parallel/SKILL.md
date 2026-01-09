---
name: parallel
description: 並列タスク実行ヘルパー。複数タスクの同時実行・結果統合
arguments:
  - name: tasks
    description: タスクリスト（カンマ区切り or JSON）
    required: true
  - name: agents
    description: 使用エージェント（auto/指定）
    required: false
    default: "auto"
  - name: mode
    description: 実行モード（all/race/settle）
    required: false
    default: "all"
allowed-tools:
  - Task
  - TodoWrite
  - Read
  - Write
---

# /parallel - 並列実行ヘルパー

複数の独立タスクを同時実行し、結果を統合する。

## 実行モード

### all - 全タスク完了待ち
```bash
/parallel tasks="API実装,UI実装,テスト作成" mode=all
# → 全タスク完了後に結果統合
```

### race - 最初の完了で終了
```bash
/parallel tasks="検索A,検索B,検索C" mode=race
# → 最初に完了したタスクの結果を採用
```

### settle - 全タスク結果収集（失敗含む）
```bash
/parallel tasks="タスクA,タスクB,タスクC" mode=settle
# → 成功・失敗問わず全結果を収集
```

## エージェント自動選択

```
タスク分析
  ↓
キーワード判定:
  - "UI", "コンポーネント", "フロント" → my-frontend
  - "API", "DB", "バックエンド" → my-backend
  - "Docker", "CI", "デプロイ" → my-devops
  - "デザイン", "スタイル", "UX" → my-design
  - その他 → general-purpose
```

## 実行フロー

```typescript
// タスク分解
const tasks = parseTasks(input);

// エージェント割り当て
const assignments = tasks.map(task => ({
  task,
  agent: autoSelectAgent(task)
}));

// 並列実行
const results = await Promise.all(
  assignments.map(({ task, agent }) =>
    Task({
      subagent_type: agent,
      prompt: task,
      description: `Parallel: ${task.slice(0, 20)}...`
    })
  )
);

// 結果統合
return integrateResults(results);
```

## 結果レポート

```markdown
## 並列実行レポート

### 実行サマリー
- 総タスク: 3
- 成功: 3
- 失敗: 0
- 実行時間: 45s（直列なら2m予想）

### タスク結果

| # | タスク | エージェント | 結果 | 時間 |
|---|-------|------------|------|------|
| 1 | API実装 | my-backend | ✅ | 20s |
| 2 | UI実装 | my-frontend | ✅ | 35s |
| 3 | テスト作成 | general | ✅ | 45s |

### 生成ファイル
- src/app/api/users/route.ts
- src/components/UserList.tsx
- src/lib/__tests__/users.test.ts
```

## 使用例

```bash
# 基本（自動エージェント選択）
/parallel tasks="ユーザーAPI,ユーザー一覧UI,ユーザーテスト"

# エージェント指定
/parallel tasks="機能A,機能B" agents="my-frontend,my-backend"

# レース実行
/parallel tasks="Google検索,Bing検索,DuckDuckGo検索" mode=race

# JSON形式
/parallel tasks='[{"name":"API","agent":"my-backend"},{"name":"UI","agent":"my-frontend"}]'
```
