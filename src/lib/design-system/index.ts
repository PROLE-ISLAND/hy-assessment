// =====================================================
// Design System - Main Entry Point
// Export all design tokens, themes, and utilities
//
// IMPORTANT: Before adding new charts or color-coded components,
// read CHECKLIST.md in this directory for guidelines on:
// - Using design system colors consistently
// - Adding safelist entries for dynamic Tailwind classes
// - Auditing for hardcoded colors
// =====================================================

// Color tokens
export {
  // Chart colors
  chartColors,
  chartPrimaryColor,
  chartConfig,

  // Score colors
  scoreThresholds,
  scoreColors,
  getScoreLevel,
  getScoreColor,
  getScoreTextClass,

  // Status colors
  assessmentStatusConfig,
  candidateStatusConfig,

  // Judgment colors
  judgmentConfig,

  // Risk level colors
  riskLevelConfig,

  // Distribution colors
  scoreDistributionColors,

  // Pipeline colors
  pipelineColors,

  // Selection colors
  selectionColors,

  // Progress indicator colors (hex for inline styles)
  progressColors,
  getProgressColor,

  // Types
  type ScoreLevel,
  type CandidateStatus,
  type JudgmentLevel,
  type RiskLevel,
} from './tokens/colors';

// Semantic colors (meaning-based color mappings)
export {
  domainColors,
  getDomainColor,
  stateColors,
  getStateColorClass,
  getStateHexColor,
  interactiveColors,
  getSelectionClasses,
  type DomainKey,
  type StateKey,
} from './tokens/semantic-colors';

// Opacity tokens
export {
  gradientOpacity,
  glowIntensity,
  surfaceOpacity,
  borderOpacity,
  withOpacity,
  getGradientStops,
} from './tokens/opacity';

// Chart theme
export {
  chartTheme,
  chartSizeConfig,
  chartMargin,
  percentageDomain,
  getChartConfig,
  formatPercentage,
  formatScore,
  type ChartSize,
} from './charts/theme';

// Chart gradients
export {
  ChartGradient,
  ChartGradientDefs,
  gradientIds,
  getGradientUrl,
  getChartGradientUrl,
  getChartColor,
} from './charts/gradients';
