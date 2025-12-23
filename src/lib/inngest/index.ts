// =====================================================
// Inngest Module Exports
// =====================================================

export { inngest, type InngestEvents } from './client';
export { analyzeAssessmentFunction } from './functions/analyze-assessment';

// All functions to register with Inngest
export const functions = [
  // Lazy import to avoid server-only code in client bundle
  () => import('./functions/analyze-assessment').then(m => m.analyzeAssessmentFunction),
];
