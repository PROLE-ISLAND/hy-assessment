// =====================================================
// Personality Analysis Component Types
// Re-exports from database types for component usage
// =====================================================

export type {
  PersonalityBehavioral,
  PersonalityBehavioralTrait,
  PersonalityStress,
  PersonalityStressMetric,
  PersonalityEQ,
  PersonalityEQDimension,
  PersonalityValues,
  PersonalityValueDimension,
} from '@/types/database';

// Component-specific props
export interface PersonalityCardBaseProps {
  className?: string;
}
