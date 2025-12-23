// =====================================================
// Inngest API Route
// Serves Inngest functions
// =====================================================

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { analyzeAssessmentFunction } from '@/lib/inngest/functions/analyze-assessment';

// Create and export the serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeAssessmentFunction],
});
