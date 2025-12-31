// =====================================================
// Commitlint Configuration
// Enforces Conventional Commits format
// =====================================================

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of the following
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新機能
        'fix',      // バグ修正
        'docs',     // ドキュメントのみの変更
        'style',    // コードの意味に影響しない変更（空白、フォーマット等）
        'refactor', // バグ修正でも機能追加でもないコード変更
        'perf',     // パフォーマンス改善
        'test',     // テストの追加・修正
        'build',    // ビルドシステムや外部依存関係に影響する変更
        'ci',       // CI設定ファイルやスクリプトの変更
        'chore',    // その他の変更（srcやtestを変更しない）
        'revert',   // 以前のコミットの取り消し
        'wip',      // 作業中（プッシュ前にsquashすること）
      ],
    ],
    // Type is required
    'type-empty': [2, 'never'],
    // Subject is required
    'subject-empty': [2, 'never'],
    // Subject should not end with period
    'subject-full-stop': [2, 'never', '.'],
    // Header max length (type + scope + subject)
    'header-max-length': [2, 'always', 100],
  },
  // Help message in Japanese
  helpUrl: 'https://github.com/PROLE-ISLAND/hy-assessment/blob/main/CLAUDE.md#コミットprは日本語',
};
