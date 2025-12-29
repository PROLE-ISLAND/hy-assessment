# Generated Components

v0.dev で生成したコンポーネントを配置するディレクトリ。

## 使い方

1. [v0.dev](https://v0.dev) でプロンプト入力
2. 生成されたコードをこのディレクトリにコピー
3. デザインシステムに合わせて微調整
4. テスト追加

## コンポーネント登録形式

各コンポーネントファイルの冒頭に以下のコメントを記載:

```typescript
/**
 * {ComponentName}
 *
 * Generated with v0: {v0 URL}
 * Figma: {Figma URL}
 * Issue: #{Issue番号}
 *
 * Modifications:
 * - デザインシステム適用（stateColors使用）
 * - 日本語化
 * - Props型追加
 */
```

## 修正ルール

v0生成コードをそのまま使わず、以下を確認:

1. **ハードコード色の置換**
   - `text-green-600` → `stateColors.success.combined`
   - `text-red-600` → `stateColors.error.combined`
   - `text-yellow-600` → `stateColors.warning.combined`

2. **ダークモード確認**
   - `bg-white` → `bg-background`
   - `text-gray-900` → `text-foreground`

3. **日本語化**
   - ボタン、ラベル、プレースホルダーを日本語に

4. **型安全性**
   - Props interfaceを追加
   - 必要に応じてジェネリクス使用

## 登録済みコンポーネント

| コンポーネント | Issue | v0 URL | 説明 |
|---------------|-------|--------|------|
| （まだなし） | - | - | - |
