# Design System - Color Usage Checklist

This document helps ensure all color usages are properly using the design system.

## Why This Matters

Dynamic Tailwind class names (e.g., `bg-${color}-500`) are NOT detected by the JIT compiler.
When colors are scattered across the codebase:
- Inconsistent styling occurs
- Dark mode may break
- Safelist entries may be missed
- Refactoring becomes difficult

## Search Patterns for Color Audits

Run these grep patterns to find potential issues:

### 1. Hardcoded Tailwind Colors
```bash
# Find hardcoded color classes (potential issues)
grep -rn "text-green-\|text-red-\|text-yellow-\|text-blue-" src/ --include="*.tsx"
grep -rn "bg-green-\|bg-red-\|bg-yellow-\|bg-blue-" src/ --include="*.tsx"
grep -rn "#[0-9a-fA-F]\{6\}" src/ --include="*.tsx"
```

### 2. Dynamic Class Patterns (Need Safelist)
```bash
# Find dynamic class name constructions
grep -rn "\`.*\${.*}\`" src/ --include="*.tsx" | grep -E "bg-|text-|border-"
grep -rn "\[&>div\]:" src/ --include="*.tsx"
```

### 3. Chart-like Components (Not Just Recharts)
```bash
# Recharts usage
grep -rn "from 'recharts'" src/

# Progress bars used as visual indicators
grep -rn "<Progress" src/ --include="*.tsx"

# Custom progress bars
grep -rn "h-2.*bg-" src/ --include="*.tsx" | grep -E "rounded|overflow"
```

## Component Types to Check

### 1. Recharts Charts
- [x] ScoreBarChart
- [x] DomainRadarChart
- [x] ScoreDistributionChart
- [x] AssessmentTrendChart
- [x] CandidateComparisonClient (inline RadarChart)

### 2. Progress Bars (Visual Indicators)
- [x] PipelineFunnel - pipeline stages
- [x] CandidateDetailTabs - risk level bars (6 domains)
- [x] assessments/[id]/page.tsx - risk level bars (6 domains)
- [x] CandidateCard - mini score bar
- [x] reports/page.tsx - domain average bars

### 3. Status Badges
- [x] Assessment status badges
- [x] Candidate status badges
- [x] Judgment badges (recommended/consider/caution)
- [x] Risk level badges

### 4. Interactive States
- [x] Selection highlighting (CandidateComparisonClient)
- [ ] Hover states (generally handled by Tailwind)

## Safelist Categories

The following safelist classes are defined in `globals.css`:

| Safelist Class | Purpose | Used By |
|---------------|---------|---------|
| `.safelist-pipeline` | Pipeline funnel colors | PipelineFunnel |
| `.safelist-risk` | Risk progress bar colors | CandidateDetailTabs, assessments/[id] |
| `.safelist-score` | Score text/bg colors | Various score displays |
| `.safelist-selection` | Interactive selection | CandidateComparisonClient |
| `.safelist-status` | Status badge colors | Status badges |
| `.safelist-judgment` | Judgment badge colors | Judgment badges |
| `.safelist-progress-indicator` | Progress [&>div] colors | reports/page |

## When Adding New Charts/Visualizations

1. **Always use design system imports** - Never hardcode colors
2. **Check for dynamic class names** - Add to safelist if needed
3. **Update this checklist** - Add new component to the list above
4. **Run audit commands** - Verify no hardcoded colors remain

## Design System Imports

```typescript
import {
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

  // Status configs
  assessmentStatusConfig,
  candidateStatusConfig,
  judgmentConfig,
  riskLevelConfig,

  // Visual colors
  scoreDistributionColors,
  pipelineColors,
  selectionColors,

  // Chart theme
  chartTheme,
  chartSizeConfig,
} from '@/lib/design-system';
```
