#!/usr/bin/env npx tsx
/**
 * 実装計画検証スクリプト
 *
 * Issueの要件に対して、実装計画が十分かどうかを検証する
 *
 * Usage:
 *   npx tsx scripts/validate-plan.ts <issue-number>
 *   npm run plan:validate 15
 */

import { execSync } from 'child_process';

interface ValidationResult {
  category: string;
  item: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

function getIssueBody(issueNumber: number): string {
  try {
    const result = execSync(`gh issue view ${issueNumber} --json body -q '.body'`, {
      encoding: 'utf-8',
    });
    return result;
  } catch {
    console.error(`❌ Issue #${issueNumber} が見つかりません`);
    process.exit(1);
  }
}

function getIssueComments(issueNumber: number): string[] {
  try {
    const result = execSync(
      `gh issue view ${issueNumber} --json comments -q '.comments[].body'`,
      { encoding: 'utf-8' }
    );
    return result.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function extractTestCases(body: string): string[] {
  const testCaseSection = body.match(
    /## テストケース（このIssue固有）\n([\s\S]*?)(?=\n##|\n---|\n\*この)/
  );
  if (!testCaseSection) return [];

  const cases = testCaseSection[1]
    .split('\n')
    .filter((line) => line.startsWith('- [ ]'))
    .map((line) => line.replace('- [ ] ', '').trim());

  return cases;
}

function extractDoDLevel(body: string): string {
  const match = body.match(/## DoD Level\n(.+)/);
  return match ? match[1].trim() : 'Bronze';
}

function extractAffectedFiles(body: string): string[] {
  const section = body.match(
    /## 影響するファイル\n([\s\S]*?)(?=\n##|\n---|\n\*この)/
  );
  if (!section) return [];

  return section[1]
    .split('\n')
    .filter((line) => line.startsWith('- `'))
    .map((line) => line.match(/`([^`]+)`/)?.[1] || '')
    .filter(Boolean);
}

function findImplementationPlan(comments: string[]): string | null {
  // 「実装計画」「Implementation Plan」などを含むコメントを探す
  for (const comment of comments) {
    if (
      comment.includes('## 実装計画') ||
      comment.includes('## Implementation Plan') ||
      comment.includes('### 実装方針') ||
      comment.includes('### 修正内容')
    ) {
      return comment;
    }
  }
  return null;
}

function validatePlan(
  issueBody: string,
  plan: string | null
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const testCases = extractTestCases(issueBody);
  const dodLevel = extractDoDLevel(issueBody);
  const affectedFiles = extractAffectedFiles(issueBody);

  // 1. 実装計画の存在
  if (!plan) {
    results.push({
      category: '実装計画',
      item: '計画の存在',
      status: 'fail',
      message: '実装計画がコメントに見つかりません。計画を追加してください。',
    });
    return results; // これがないと他の検証ができない
  }

  results.push({
    category: '実装計画',
    item: '計画の存在',
    status: 'pass',
    message: '実装計画が見つかりました',
  });

  // 2. テストケースへの対応
  for (const testCase of testCases) {
    // 計画内にテストケースに関連する記述があるか
    const keywords = testCase
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const hasRelatedContent = keywords.some((kw) =>
      plan.toLowerCase().includes(kw)
    );

    if (hasRelatedContent) {
      results.push({
        category: 'テストケース',
        item: testCase.substring(0, 40) + (testCase.length > 40 ? '...' : ''),
        status: 'pass',
        message: '計画内で言及されています',
      });
    } else {
      results.push({
        category: 'テストケース',
        item: testCase.substring(0, 40) + (testCase.length > 40 ? '...' : ''),
        status: 'warn',
        message: '計画内での言及が見つかりません',
      });
    }
  }

  // 3. 影響ファイルへの対応
  for (const file of affectedFiles) {
    if (plan.includes(file)) {
      results.push({
        category: '影響ファイル',
        item: file,
        status: 'pass',
        message: '計画内で言及されています',
      });
    } else {
      results.push({
        category: '影響ファイル',
        item: file,
        status: 'warn',
        message: '計画内での言及が見つかりません',
      });
    }
  }

  // 4. DoD Levelに応じたチェック
  if (dodLevel.includes('Silver') || dodLevel.includes('Gold')) {
    const hasTestPlan =
      plan.includes('テスト') ||
      plan.includes('test') ||
      plan.includes('ユニットテスト');
    results.push({
      category: 'DoD要件',
      item: 'テスト計画',
      status: hasTestPlan ? 'pass' : 'warn',
      message: hasTestPlan
        ? 'テスト計画が含まれています'
        : 'Silver/Goldではテスト計画を含めてください',
    });
  }

  if (dodLevel.includes('Gold')) {
    const hasE2EPlan = plan.includes('E2E') || plan.includes('e2e');
    results.push({
      category: 'DoD要件',
      item: 'E2Eテスト計画',
      status: hasE2EPlan ? 'pass' : 'warn',
      message: hasE2EPlan
        ? 'E2Eテスト計画が含まれています'
        : 'GoldではE2Eテスト計画を含めてください',
    });
  }

  // 5. 具体的な実装ステップの存在
  const hasSteps =
    plan.includes('1.') || plan.includes('Step') || plan.includes('ステップ');
  results.push({
    category: '計画の質',
    item: '実装ステップ',
    status: hasSteps ? 'pass' : 'warn',
    message: hasSteps
      ? '具体的なステップが含まれています'
      : '番号付きの実装ステップを追加することを推奨',
  });

  return results;
}

function printResults(results: ValidationResult[]) {
  console.log('\n📋 実装計画検証結果\n');
  console.log('='.repeat(60));

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  let currentCategory = '';
  for (const result of results) {
    if (result.category !== currentCategory) {
      console.log(`\n【${result.category}】`);
      currentCategory = result.category;
    }

    const icon =
      result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';

    console.log(`  ${icon} ${result.item}`);
    console.log(`     └─ ${result.message}`);

    if (result.status === 'pass') passCount++;
    else if (result.status === 'warn') warnCount++;
    else failCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n合計: ✅ ${passCount} pass, ⚠️ ${warnCount} warn, ❌ ${failCount} fail`);

  if (failCount > 0) {
    console.log('\n❌ 必須要件が満たされていません。');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('\n⚠️ 開発可能ですが、警告項目を確認してください。');
  } else {
    console.log('\n✅ 全ての要件を満たしています！開発を開始できます。');
  }
}

// Main
const issueNumber = parseInt(process.argv[2]);

if (!issueNumber) {
  console.log(`
実装計画検証スクリプト

Usage:
  npx tsx scripts/validate-plan.ts <issue-number>
  npm run plan:validate 15

検証内容:
  - 実装計画コメントの存在
  - テストケースへの対応
  - 影響ファイルへの言及
  - DoD Levelに応じた要件
  - 実装ステップの具体性
`);
  process.exit(1);
}

console.log(`\n🔍 Issue #${issueNumber} の実装計画を検証中...\n`);

const issueBody = getIssueBody(issueNumber);
const comments = getIssueComments(issueNumber);
const plan = findImplementationPlan(comments);

const results = validatePlan(issueBody, plan);
printResults(results);
