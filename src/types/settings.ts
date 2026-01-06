// =====================================================
// Settings Types
// Organization settings definitions
// =====================================================

/**
 * 組織の検査設定
 */
export interface AssessmentSettings {
  /** デフォルト有効期限（日数） */
  defaultValidityDays: number;
  /** リマインダー送信日（有効期限からの日数） */
  reminderDays: number[];
  /** 自動リマインダー有効化 */
  autoReminder: boolean;
}

/**
 * 組織設定（organizations.settings JSONB）
 */
export interface OrganizationSettings {
  assessment: AssessmentSettings;
}

/**
 * デフォルトの組織設定
 */
export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  assessment: {
    defaultValidityDays: 7,
    reminderDays: [3, 1],
    autoReminder: true,
  },
};

/**
 * 組織情報更新リクエスト
 */
export interface UpdateOrganizationRequest {
  name?: string;
  settings?: Partial<OrganizationSettings>;
}

/**
 * 組織削除リクエスト
 */
export interface DeleteOrganizationRequest {
  /** 確認用の組織名（一致必須） */
  confirmationName: string;
}

/**
 * 組織情報レスポンス
 */
export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  settings: OrganizationSettings;
  created_at: string;
  /** リクエストしたユーザーのロール */
  userRole: 'admin' | 'recruiter' | 'viewer';
}
