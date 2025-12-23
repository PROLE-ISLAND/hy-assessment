// =====================================================
// Validations Module Exports
// Centralized validation schemas for the application
// =====================================================

// Common
export {
  uuidSchema,
  emailSchema,
  nameSchema,
  requiredStringSchema,
  urlSchema,
  paginationSchema,
  sortOrderSchema,
  dateRangeSchema,
  apiErrorSchema,
  safeParse,
  type Pagination,
  type ApiError,
  type PartialExcept,
} from './common';

// Candidate
export {
  positionValues,
  positionSchema,
  candidateCreateSchema,
  candidateUpdateSchema,
  candidateSearchSchema,
  validateCandidateCreate,
  validateCandidateUpdate,
  type CandidateCreateInput,
  type CandidateUpdateInput,
  type CandidateSearchInput,
} from './candidate';

// Assessment
export {
  assessmentStatusSchema,
  assessmentTokenSchema,
  issueAssessmentSchema,
  likertResponseSchema,
  sjtResponseSchema,
  assessmentResponseSchema,
  assessmentProgressSchema,
  completeAssessmentSchema,
  analysisRequestSchema,
  validateToken,
  validateAssessmentResponse,
  type AssessmentStatusInput,
  type IssueAssessmentInput,
  type AssessmentResponseInput,
  type AssessmentProgressInput,
  type CompleteAssessmentInput,
  type AnalysisRequestInput,
} from './assessment';
