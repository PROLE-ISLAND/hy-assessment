// =====================================================
// Database Types for hy-assessment
// Auto-generated from Supabase schema
// =====================================================

// =====================================================
// Enums
// =====================================================

export type UserRole = 'admin' | 'recruiter' | 'viewer';
export type AssessmentStatus = 'pending' | 'in_progress' | 'completed' | 'expired';
export type AuditAction = 'view' | 'create' | 'update' | 'delete' | 'export';
export type AuditEntityType = 'candidate' | 'assessment' | 'analysis' | 'template' | 'user';
export type PromptKey = 'system' | 'analysis_user' | 'judgment' | 'candidate';

// =====================================================
// Base Types
// =====================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Person {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Candidate {
  id: string;
  organization_id: string;
  person_id: string;
  position: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AssessmentType {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  default_validity_days: number;
  is_active: boolean;
  created_at: string;
}

export interface AssessmentTemplate {
  id: string;
  organization_id: string;
  type_id: string;
  name: string;
  version: string;
  questions: SurveyJSDefinition;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Assessment {
  id: string;
  organization_id: string;
  candidate_id: string;
  template_id: string;
  token: string;
  status: AssessmentStatus;
  progress: AssessmentProgress;
  expires_at: string;
  started_at: string | null;
  completed_at: string | null;
  // Report sharing fields
  report_token: string | null;
  report_shared_at: string | null;
  report_expires_at: string | null;
  report_viewed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Response {
  id: string;
  organization_id: string;
  assessment_id: string;
  question_id: string;
  answer: unknown;
  page_number: number;
  answered_at: string;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  organization_id: string;
  assessment_id: string;
  scores: Record<string, number>;
  // Legacy fields (v1)
  strengths: string[];
  weaknesses: string[];
  // Enhanced fields (v2)
  enhanced_strengths: EnhancedStrength[] | null;
  enhanced_watchouts: EnhancedWatchout[] | null;
  risk_scenarios: RiskScenario[] | null;
  interview_checks: InterviewCheck[] | null;
  candidate_report: CandidateReport | null;
  report_version: 'v1' | 'v2';
  // Personality analysis fields (Issue #153) - optional until AI generates them
  personality_behavioral?: PersonalityBehavioral | null;
  personality_stress?: PersonalityStress | null;
  personality_eq?: PersonalityEQ | null;
  personality_values?: PersonalityValues | null;
  // Common fields
  summary: string | null;
  recommendation: string | null;
  model_version: string;
  prompt_version: string;
  tokens_used: number;
  version: number;
  is_latest: boolean;
  analyzed_at: string;
  created_at: string;
}

// Enhanced strength with evidence (v2)
export interface EnhancedStrength {
  title: string;
  behavior: string;
  evidence: string;
}

// Enhanced watchout with evidence (v2)
export interface EnhancedWatchout {
  title: string;
  risk: string;
  evidence: string;
}

// Risk scenario for accident prevention
export interface RiskScenario {
  condition: string;
  symptom: string;
  impact: string;
  prevention: string;
  risk_environment: string[];
}

// Interview check item
export interface InterviewCheck {
  question: string;
  intent: string;
  look_for: string;
}

// Candidate-facing report (disclosure-ready)
export interface CandidateReport {
  strengths: Array<{
    title: string;
    description: string;
  }>;
  leverage_tips: string[];
  stress_tips: string[];
  values_tags: string[];
  note: string;
}

// =====================================================
// Personality Analysis Types (Issue #153)
// =====================================================

// Behavioral analysis (DISC-based)
export interface PersonalityBehavioralTrait {
  name: string;
  score: number;
  description: string;
}

export interface PersonalityBehavioral {
  dominance: number;
  influence: number;
  steadiness: number;
  conscientiousness: number;
  traits: PersonalityBehavioralTrait[];
  overallType: string;
}

// Stress resilience analysis
export interface PersonalityStressMetric {
  name: string;
  score: number;
  description: string;
}

export interface PersonalityStress {
  pressureHandling: number;
  recoverySpeed: number;
  emotionalStability: number;
  adaptability: number;
  metrics: PersonalityStressMetric[];
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// EQ (Emotional Intelligence) analysis
export interface PersonalityEQDimension {
  name: string;
  score: number;
  description: string;
}

export interface PersonalityEQ {
  selfAwareness: number;
  selfManagement: number;
  socialAwareness: number;
  relationshipManagement: number;
  dimensions: PersonalityEQDimension[];
  overallScore: number;
}

// Values analysis
export interface PersonalityValueDimension {
  name: string;
  score: number;
  description: string;
}

export interface PersonalityValues {
  achievement: number;
  stability: number;
  growth: number;
  socialContribution: number;
  autonomy: number;
  dimensions: PersonalityValueDimension[];
  primaryValue: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  organization_id: string | null;
  key: PromptKey;
  name: string;
  description: string | null;
  version: string;
  content: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Prompt version history (Issue #139)
export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: string;
  content: string;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

// =====================================================
// Extended Types with Relations
// =====================================================

export interface CandidateWithPerson extends Candidate {
  person: Person;
}

export interface CandidateWithAssessments extends CandidateWithPerson {
  assessments: Assessment[];
}

export interface AssessmentWithRelations extends Assessment {
  candidate: CandidateWithPerson;
  template: AssessmentTemplate;
  responses?: Response[];
  analysis?: AIAnalysis;
}

export interface UserWithOrganization extends User {
  organization: Organization;
}

// =====================================================
// Form/Input Types
// =====================================================

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
}

export interface CreatePersonInput {
  organization_id: string;
  name: string;
  email: string;
}

export interface CreateCandidateInput {
  organization_id: string;
  person_id: string;
  position: string;
  notes?: string;
}

export interface CreateAssessmentInput {
  organization_id: string;
  candidate_id: string;
  template_id: string;
  expires_at?: string;
}

export interface CreateUserInput {
  id: string; // From Supabase Auth
  organization_id: string;
  email: string;
  name: string;
  role?: UserRole;
}

// =====================================================
// SurveyJS Types
// =====================================================

export interface SurveyJSDefinition {
  title?: string;
  description?: string;
  pages?: SurveyJSPage[];
  showProgressBar?: 'top' | 'bottom' | 'both' | 'none';
  showQuestionNumbers?: 'on' | 'off' | 'onPage';
  questionErrorLocation?: 'top' | 'bottom';
  [key: string]: unknown;
}

export interface SurveyJSPage {
  name: string;
  title?: string;
  elements: SurveyJSElement[];
}

export interface SurveyJSElement {
  type: string;
  name: string;
  title?: string;
  description?: string;
  isRequired?: boolean;
  [key: string]: unknown;
}

// =====================================================
// Progress Types
// =====================================================

export interface AssessmentProgress {
  currentPage?: number;
  totalPages?: number;
  answeredQuestions?: string[];
  lastActivityAt?: string;
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================================================
// Session/Auth Types
// =====================================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization_id: string;
  organization_slug: string;
}

export interface JWTClaims {
  sub: string;
  email: string;
  organization_id: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// =====================================================
// Security Types (Issue #134)
// =====================================================

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface LoginHistory {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: DeviceType | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: DeviceType | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  is_current: boolean;
  last_active_at: string;
  expires_at: string;
  created_at: string;
}

// API response types for security endpoints
export interface SessionListItem {
  id: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  location: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface LoginHistoryItem {
  id: string;
  timestamp: string;
  location: string;
  deviceType: string;
  browser: string;
  success: boolean;
  failureReason?: string;
}

// =====================================================
// Database Type Helpers (for Supabase client)
// =====================================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>;
      };
      persons: {
        Row: Person;
        Insert: Omit<Person, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Person, 'id' | 'created_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      candidates: {
        Row: Candidate;
        Insert: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Candidate, 'id' | 'created_at'>>;
      };
      assessment_types: {
        Row: AssessmentType;
        Insert: Omit<AssessmentType, 'id' | 'created_at'>;
        Update: Partial<Omit<AssessmentType, 'id' | 'created_at'>>;
      };
      assessment_templates: {
        Row: AssessmentTemplate;
        Insert: Omit<AssessmentTemplate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AssessmentTemplate, 'id' | 'created_at'>>;
      };
      assessments: {
        Row: Assessment;
        Insert: Omit<Assessment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Assessment, 'id' | 'created_at'>>;
      };
      responses: {
        Row: Response;
        Insert: Omit<Response, 'id' | 'created_at'>;
        Update: Partial<Omit<Response, 'id' | 'created_at'>>;
      };
      ai_analyses: {
        Row: AIAnalysis;
        Insert: Omit<AIAnalysis, 'id' | 'created_at'>;
        Update: Partial<Omit<AIAnalysis, 'id' | 'created_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never; // Audit logs should never be updated
      };
      prompt_templates: {
        Row: PromptTemplate;
        Insert: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PromptTemplate, 'id' | 'created_at'>>;
      };
      prompt_versions: {
        Row: PromptVersion;
        Insert: Omit<PromptVersion, 'id' | 'created_at'>;
        Update: never; // Versions are immutable
      };
      login_history: {
        Row: LoginHistory;
        Insert: Omit<LoginHistory, 'id' | 'created_at'>;
        Update: never; // Login history should never be updated
      };
      user_sessions: {
        Row: UserSession;
        Insert: Omit<UserSession, 'id' | 'created_at'>;
        Update: Partial<Omit<UserSession, 'id' | 'created_at'>>;
      };
    };
    Enums: {
      user_role: UserRole;
      assessment_status: AssessmentStatus;
      audit_action: AuditAction;
      audit_entity_type: AuditEntityType;
      prompt_key: PromptKey;
    };
  };
}
