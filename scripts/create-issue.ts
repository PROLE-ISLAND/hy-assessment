#!/usr/bin/env npx tsx
/**
 * Issue作成スクリプト - テンプレート準拠版
 *
 * Usage:
 *   npx tsx scripts/create-issue.ts bug
 *   npx tsx scripts/create-issue.ts feature
 *   npm run issue:bug
 *   npm run issue:feature
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

  // ラベル決定
  const priorityLabel = priority.split(':')[0];
  const priorityName = priority.split('(')[0].split(':')[1].trim();
  const labels = ['bug', `${priorityLabel}: ${priorityName}`, 'ready-to-develop'];

  // Issue本文生成
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

  // 確認
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

  // Issue作成
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

  const affectedFiles = await ask('影響するファイル (カンマ区切り、未定なら空): ');

  console.log('テストケース - このIssue固有 (空行で終了):');
  const testCases: string[] = [];
  while (true) {
    const line = await ask('- ');
    if (!line) break;
    testCases.push(`- [ ] ${line}`);
  }

  const acceptanceCriteria = await ask('受け入れ条件（追加があれば）:\n');

  // ラベル決定
  const priorityLabel = priority.split(':')[0];
  const priorityName = priority.split('(')[0].split(':')[1].trim();
  const labels = ['enhancement', `${priorityLabel}: ${priorityName}`, 'ready-to-develop'];

  // Issue本文生成
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

${affectedFiles ? `## 影響するファイル\n${affectedFiles.split(',').map((f) => `- \`${f.trim()}\``).join('\n')}` : ''}

---

## テストケース（このIssue固有）
${testCases.length > 0 ? testCases.join('\n') : '- [ ] （テストケースを追加してください）'}

${DOD_CHECKLISTS[dodKey]}

${acceptanceCriteria ? `## 追加の受け入れ条件\n${acceptanceCriteria}` : ''}

---
*このIssueはテンプレート準拠スクリプトで作成されました*
`;

  // 確認
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

  // Issue作成
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

// メイン
const type = process.argv[2];

if (type === 'bug') {
  createBugIssue();
} else if (type === 'feature') {
  createFeatureIssue();
} else {
  console.log(`
Issue作成スクリプト

Usage:
  npx tsx scripts/create-issue.ts bug      # バグ報告
  npx tsx scripts/create-issue.ts feature  # 機能要望

または:
  npm run issue:bug
  npm run issue:feature
`);
  process.exit(1);
}
