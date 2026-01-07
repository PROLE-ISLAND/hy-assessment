# 調査レポート: トップページを検査選択UIに変更

**調査日**: 2025-01-07
**調査者**: Claude Code
**目的**: トップページの検査コード入力を廃止し、直接検査選択UIに変更

## サマリー

- 現在のトップページ（gfd.prole.co.jp）は検査コード入力が必須
- AssessmentSelectorコンポーネントは既に作成済み（PR#207でマージ済み）
- CandidateInfoFormで名前・メール入力後に新規候補者作成 → 検査選択の流れに変更
- 新規候補者作成APIの追加が必要

## 調査対象

トップページ（`/`）のUX改善。現在は検査コード入力が必要だが、直接検査を受けられるようにしたい。

## 現状分析

### 関連ファイル

| ファイル | 役割 | 変更要否 |
|---------|------|---------|
| `src/app/page.tsx` | トップページ（検査コード入力） | **要変更** |
| `src/app/assessment/[token]/AssessmentSelector.tsx` | 検査選択UI | 流用可能 |
| `src/app/assessment/[token]/CandidateInfoForm.tsx` | 候補者情報入力 | 流用可能 |
| `src/app/assessment/[token]/AssessmentPageClient.tsx` | 検査フロー制御 | 参考 |
| `src/components/personality/PersonalityAssessment.tsx` | 適職診断コンポーネント | 流用可能 |

### 現在のフロー

```
gfd.prole.co.jp
    ↓
検査コード入力
    ↓
/assessment/[token]
    ↓
CandidateInfoForm（名前・メール・希望職種）
    ↓
AssessmentSelector（Gate検査 or 適職診断）
    ↓
検査実行
    ↓
/assessment/complete
```

### 提案する新フロー

```
gfd.prole.co.jp
    ↓
CandidateInfoForm（名前・メール・希望職種）
    ↓
新規候補者作成（API呼び出し）
    ↓
AssessmentSelector（Gate検査 or 適職診断）
    ↓
検査実行
    ↓
完了画面
```

## 影響範囲

### Frontend
- `src/app/page.tsx` - 検査コード入力UIを削除、CandidateInfoForm + AssessmentSelectorに置き換え
- 新しいクライアントコンポーネント作成（DirectAssessmentFlow等）

### Backend
- 新規候補者作成API（`/api/candidates/register`）
- 検査結果保存API（匿名候補者対応）

### Database
- 候補者テーブルへの匿名/直接アクセス候補者の追加
- organization_id のデフォルト値設定（マルチテナント考慮）

## 技術的考慮事項

### リスク
- マルチテナント設計: organization_id なしで作成される候補者の扱い
- 既存のトークンベースフローとの共存

### 制約
- RLS（Row Level Security）: 匿名候補者のアクセス制御
- 既存の検査テンプレートとの紐付け

## 推奨アプローチ

### 案1: トップページをシングルページアプリ化（推奨）

- **概要**: page.tsxをクライアントコンポーネント化し、ステップ管理
- **メリット**: ページ遷移なくスムーズなUX、既存コンポーネント流用可能
- **デメリット**: 状態管理が複雑化
- **工数目安**: 1-2日

### 案2: 新規ルート作成（/direct-assessment）

- **概要**: 既存トップページは残し、新ルートを追加
- **メリット**: 既存フローへの影響なし
- **デメリット**: ルート増加、メンテナンス負担
- **工数目安**: 1日

## 結論・推奨

**案1（トップページをシングルページアプリ化）** を推奨。

理由:
- 既存のAssessmentPageClientのパターンを流用可能
- ユーザーにとって最もシンプルなフロー
- /assessment/[token] との共存も可能（既存リンクは引き続き動作）

## 次のステップ

1. [x] 調査完了
2. [ ] Issue作成
3. [ ] 要件定義PR作成
4. [ ] 実装開始
