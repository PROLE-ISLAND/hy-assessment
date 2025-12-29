#!/usr/bin/env npx tsx
/**
 * Issue作成スクリプト - テンプレート準拠版
 *
 * Usage:
 *   npx tsx scripts/create-issue.ts bug
 *   npx tsx scripts/create-issue.ts feature
 *   npx tsx scripts/create-issue.ts refactor
 *   npx tsx scripts/create-issue.ts docs
 *   npx tsx scripts/create-issue.ts chore
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

// Reserved for future use
function _askMultiline(prompt: string): Promise<string[]> {
  return new Promise((resolve) => {
    console.log(prompt);
    const lines: string[] = [];
    const handler = (line: string) => {
      if (line === '') {
        rl.removeListener('line', handler);
        resolve(lines);
      } else {
        lines.push(line);
      }
    };
    rl.on('line', handler);
  });
}

function select(question: string, options: string[]): Promise<number> {
  return new Promise((resolve) => {
    console.log(question);
    options.forEach((opt, i) => console.log(`  ${i + 1}) ${opt}`));
    rl.question('選択 (番号): ', (answer) => {
      const idx = parseInt(answer) - 1;
      resolve(idx >= 0 && idx < options.length ? idx : 0);
    });
  });
}

// DoD レベル別チェックリスト
const DOD_CHECKLISTS = {
  bronze: `### DoD チェックリスト（Bronze）
- [ ] 修正コードが動作する
- [ ] 既存テストが全てパス（\`npm run test:run\`）
- [ ] lintエラーなし（\`npm run lint\`）
- [ ] 型エラーなし（\`npx tsc --noEmit\`）
- [ ] ビルド成功（\`npm run build\`）`,

  silver: `### DoD チェックリスト（Silver）
- [ ] 修正コードが動作する
- [ ] 既存テストが全てパス（\`npm run test:run\`）
- [ ] lintエラーなし（\`npm run lint\`）
- [ ] 型エラーなし（\`npx tsc --noEmit\`）
- [ ] ビルド成功（\`npm run build\`）
- [ ] **新規ユニットテスト追加**
- [ ] **影響範囲の回帰テスト確認**
- [ ] **PRレビュー承認**`,

  gold: `### DoD チェックリスト（Gold）
- [ ] 修正コードが動作する
- [ ] 既存テストが全てパス（\`npm run test:run\`）
- [ ] lintエラーなし（\`npm run lint\`）
- [ ] 型エラーなし（\`npx tsc --noEmit\`）
- [ ] ビルド成功（\`npm run build\`）
- [ ] 新規ユニットテスト追加
- [ ] 影響範囲の回帰テスト確認
- [ ] PRレビュー承認
- [ ] **E2Eテスト追加/更新**
- [ ] **カバレッジ95%以上**
- [ ] **ドキュメント更新（必要に応じて）**`,
};

const DOD_LEVELS = ['Bronze', 'Silver', 'Gold'] as const;

// ========== Bug Issue ==========
async function createBugIssue() {
  console.log('\n🐛 バグ報告 Issue 作成\n');

  const title = await ask('タイトル: ');

  const priorityOptions = [
    'P0: Critical (本番障害)',
    'P1: High (機能停止)',
    'P2: Medium (機能劣化)',
    'P3: Low (軽微な問題)',
  ];
  const priorityIdx = await select('優先度:', priorityOptions);
  const priority = priorityOptions[priorityIdx];

  const dodOptions = [
    'Bronze (最低限の修正)',
    'Silver (回帰テスト含む) ← 推奨',
    'Gold (完全なテストカバレッジ)',
  ];
  const dodIdx = await select('DoD Level:', dodOptions);
  const dodLevel = dodOptions[dodIdx];
  const dodKey = DOD_LEVELS[dodIdx].toLowerCase() as keyof typeof DOD_CHECKLISTS;

  const description = await ask('バグの説明:\n');

  console.log('再現手順 (空行で終了):');
  const reproSteps: string[] = [];
  let step = 1;
  while (true) {
    const line = await ask(`${step}. `);
    if (!line) break;
    reproSteps.push(`${step}. ${line}`);
    step++;
  }

  const affectedFiles = await ask('影響するファイル (カンマ区切り): ');

  console.log('テストケース - このIssue固有 (空行で終了):');
  const testCases: string[] = [];
  while (true) {
    const line = await ask('- ');
    if (!line) break;
    testCases.push(`- [ ] ${line}`);
  }

  const acceptanceCriteria = await ask('受け入れ条件（追加があれば）:\n');

  const priorityLabel = priority.split(':')[0];
  const priorityName = priority.split('(')[0].split(':')[1].trim();
  const labels = ['bug', `${priorityLabel}: ${priorityName}`, 'ready-to-develop'];

  const body = `## 優先度
${priority}

## DoD Level
${dodLevel}

## バグの説明
${description}

## 再現手順
${reproSteps.join('\n')}

## 影響するファイル
${affectedFiles.split(',').map((f) => `- \`${f.trim()}\``).join('\n')}

---

## テストケース（このIssue固有）
${testCases.length > 0 ? testCases.join('\n') : '- [ ] （テストケースを追加してください）'}

${DOD_CHECKLISTS[dodKey]}

${acceptanceCriteria ? `## 追加の受け入れ条件\n${acceptanceCriteria}` : ''}

---
*このIssueはテンプレート準拠スクリプトで作成されました*
`;

  await confirmAndCreate(title, labels, body);
}

// ========== Feature Issue ==========
async function createFeatureIssue() {
  console.log('\n✨ 機能要望 Issue 作成\n');

  const title = await ask('タイトル: ');

  const priorityOptions = [
    'P1: High (今週対応)',
    'P2: Medium (今スプリント)',
    'P3: Low (バックログ)',
  ];
  const priorityIdx = await select('優先度:', priorityOptions);
  const priority = priorityOptions[priorityIdx];

  const dodOptions = [
    'Bronze (プロトタイプ)',
    'Silver (本番品質) ← 推奨',
    'Gold (完全なドキュメント・テスト)',
  ];
  const dodIdx = await select('DoD Level:', dodOptions);
  const dodLevel = dodOptions[dodIdx];
  const dodKey = DOD_LEVELS[dodIdx].toLowerCase() as keyof typeof DOD_CHECKLISTS;

  const background = await ask('背景・なぜ必要か:\n');
  const description = await ask('機能の説明:\n');

  console.log('要件 (空行で終了):');
  const requirements: string[] = [];
  while (true) {
    const line = await ask('- ');
    if (!line) break;
    requirements.push(`- [ ] ${line}`);
  }

  // UI仕様
  const uiTypeOptions = [
    'なし（バックエンドのみ）',
    'テキスト説明',
    'ASCIIモックアップ',
    'Figma/デザインリンク',
    '既存UIの参考スクショ',
  ];
  const uiTypeIdx = await select('UI仕様:', uiTypeOptions);
  let uiSpec = '';
  if (uiTypeIdx === 1) {
    uiSpec = await ask('UI説明:\n');
  } else if (uiTypeIdx === 2) {
    console.log('ASCIIモックアップ (空行で終了):');
    const asciiLines: string[] = [];
    while (true) {
      const line = await ask('');
      if (!line) break;
      asciiLines.push(line);
    }
    uiSpec = '```\n' + asciiLines.join('\n') + '\n```';
  } else if (uiTypeIdx === 3) {
    uiSpec = await ask('FigmaリンクまたはデザインURL:\n');
  } else if (uiTypeIdx === 4) {
    uiSpec = await ask('参考UI説明（どこのUIを参考にするか）:\n');
  }

  const affectedFiles = await ask('影響するファイル (カンマ区切り、未定なら空): ');

  console.log('テストケース - このIssue固有 (空行で終了):');
  const testCases: string[] = [];
  while (true) {
    const line = await ask('- ');
    if (!line) break;
    testCases.push(`- [ ] ${line}`);
  }

  const acceptanceCriteria = await ask('受け入れ条件（追加があれば）:\n');

  const priorityLabel = priority.split(':')[0];
  const priorityName = priority.split('(')[0].split(':')[1].trim();
  const labels = ['enhancement', `${priorityLabel}: ${priorityName}`, 'ready-to-develop'];

  const body = `## 優先度
${priority}

## DoD Level
${dodLevel}

## 背景
${background}

## 機能の説明
${description}

## 要件
${requirements.join('\n')}

${uiSpec ? `## UI仕様\n${uiSpec}` : ''}

${affectedFiles ? `## 影響するファイル\n${affectedFiles.split(',').map((f) => `- \`${f.trim()}\``).join('\n')}` : ''}

---

## テストケース（このIssue固有）
${testCases.length > 0 ? testCases.join('\n') : '- [ ] （テストケースを追加してください）'}

${DOD_CHECKLISTS[dodKey]}

${acceptanceCriteria ? `## 追加の受け入れ条件\n${acceptanceCriteria}` : ''}

---
*このIssueはテンプレート準拠スクリプトで作成されました*
`;

  await confirmAndCreate(title, labels, body);
}

// ========== Refactor Issue ==========
async function createRefactorIssue() {
  console.log('\n🔧 リファクタリング Issue 作成\n');

  const title = await ask('タイトル: ');

  const priorityOptions = [
    'P2: Medium (今スプリント)',
    'P3: Low (バックログ)',
  ];
  const priorityIdx = await select('優先度:', priorityOptions);
  const priority = priorityOptions[priorityIdx];

  const dodOptions = [
    'Bronze (動作維持のみ)',
    'Silver (テスト追加) ← 推奨',
    'Gold (完全なテストカバレッジ)',
  ];
  const dodIdx = await select('DoD Level:', dodOptions);
  const dodLevel = dodOptions[dodIdx];
  const dodKey = DOD_LEVELS[dodIdx].toLowerCase() as keyof typeof DOD_CHECKLISTS;

  const currentProblem = await ask('現状のコードの問題点:\n');
  const targetArchitecture = await ask('目標のアーキテクチャ・設計:\n');

  const affectedFiles = await ask('影響するファイル (カンマ区切り): ');

  console.log('テストケース - このIssue固有 (空行で終了):');
  const testCases: string[] = [];
  while (true) {
    const line = await ask('- ');
    if (!line) break;
    testCases.push(`- [ ] ${line}`);
  }

  const priorityLabel = priority.split(':')[0];
  const priorityName = priority.split('(')[0].split(':')[1].trim();
  const labels = ['refactor', `${priorityLabel}: ${priorityName}`, 'ready-to-develop'];

  const body = `## 優先度
${priority}

## DoD Level
${dodLevel}

## 現状のコードの問題点
${currentProblem}

## 目標のアーキテクチャ・設計
${targetArchitecture}

## 影響するファイル
${affectedFiles.split(',').map((f) => `- \`${f.trim()}\``).join('\n')}

---

## テストケース（このIssue固有）
${testCases.length > 0 ? testCases.join('\n') : '- [ ] 既存機能が壊れていないこと'}
- [ ] リファクタリング後も全テストがパス

${DOD_CHECKLISTS[dodKey]}

---
*このIssueはテンプレート準拠スクリプトで作成されました*
`;

  await confirmAndCreate(title, labels, body);
}

// ========== Docs Issue ==========
async function createDocsIssue() {
  console.log('\n📝 ドキュメント Issue 作成\n');

  const title = await ask('タイトル: ');

  const priority = 'P3: Low (バックログ)';
  const dodLevel = 'Bronze (最低限)';

  const targetDocs = await ask('対象ドキュメント:\n');
  const updateContent = await ask('更新内容:\n');

  const labels = ['documentation', 'P3: Low', 'ready-to-develop'];

  const body = `## 優先度
${priority}

## DoD Level
${dodLevel}

## 対象ドキュメント
${targetDocs}

## 更新内容
${updateContent}

---

## テストケース（このIssue固有）
- [ ] ドキュメントの内容が正確
- [ ] リンク切れがない
- [ ] 日本語として自然

### DoD チェックリスト（Docs）
- [ ] Markdown構文エラーなし
- [ ] プレビューで表示確認
- [ ] PRレビュー承認

---
*このIssueはテンプレート準拠スクリプトで作成されました*
`;

  await confirmAndCreate(title, labels, body);
}

// ========== Chore Issue ==========
async function createChoreIssue() {
  console.log('\n🔨 Chore Issue 作成\n');

  const title = await ask('タイトル: ');

  const priority = 'P3: Low (バックログ)';
  const dodLevel = 'Bronze (最低限)';

  const taskDescription = await ask('作業内容:\n');
  const reason = await ask('なぜ必要か:\n');

  const labels = ['chore', 'P3: Low', 'ready-to-develop'];

  const body = `## 優先度
${priority}

## DoD Level
${dodLevel}

## 作業内容
${taskDescription}

## なぜ必要か
${reason}

---

## テストケース（このIssue固有）
- [ ] 作業が完了している
- [ ] 既存機能に影響がない

### DoD チェックリスト（Chore）
- [ ] 作業完了
- [ ] ビルド成功（\`npm run build\`）

---
*このIssueはテンプレート準拠スクリプトで作成されました*
`;

  await confirmAndCreate(title, labels, body);
}

// ========== Common ==========
async function confirmAndCreate(title: string, labels: string[], body: string) {
  console.log('\n--- プレビュー ---');
  console.log(`タイトル: ${title}`);
  console.log(`ラベル: ${labels.join(', ')}`);
  console.log(body);
  console.log('--- ここまで ---\n');

  const confirm = await ask('作成しますか？ (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('キャンセルしました');
    rl.close();
    return;
  }

  const escapedBody = body.replace(/'/g, "'\\''");
  const escapedTitle = title.replace(/'/g, "'\\''");
  const cmd = `gh issue create --title '${escapedTitle}' --label '${labels.join(',')}' --body '${escapedBody}'`;

  try {
    const result = execSync(cmd, { encoding: 'utf-8' });
    console.log(`\n✅ Issue作成完了: ${result.trim()}`);
  } catch (error) {
    console.error('❌ Issue作成失敗:', error);
  }

  rl.close();
}

// ========== Main ==========
const type = process.argv[2];

const handlers: Record<string, () => Promise<void>> = {
  bug: createBugIssue,
  feature: createFeatureIssue,
  refactor: createRefactorIssue,
  docs: createDocsIssue,
  chore: createChoreIssue,
};

if (handlers[type]) {
  handlers[type]();
} else {
  console.log(`
Issue作成スクリプト

Usage:
  npx tsx scripts/create-issue.ts <type>

Types:
  bug       🐛 バグ報告
  feature   ✨ 機能要望
  refactor  🔧 リファクタリング
  docs      📝 ドキュメント
  chore     🔨 雑務・メンテナンス

例:
  npm run issue:bug
  npm run issue:feature
  npx tsx scripts/create-issue.ts refactor
`);
  process.exit(1);
}
