// =====================================================
// Inngest Client Configuration
// For background job processing
// =====================================================

import { Inngest } from 'inngest';

// Create a client to send and receive events
export const inngest = new Inngest({
  id: 'hy-assessment',
  // In development, events are sent to the dev server
  // In production, configure INNGEST_SIGNING_KEY and INNGEST_EVENT_KEY
});

// =====================================================
// Event Types
// =====================================================

export type AssessmentCompletedEvent = {
  name: 'assessment/completed';
  data: {
    assessmentId: string;
    organizationId: string;
    candidateId: string;
  };
};

export type AnalysisRequestedEvent = {
  name: 'analysis/requested';
  data: {
    assessmentId: string;
    organizationId: string;
    candidatePosition: string;
  };
};

// Union of all events
export type InngestEvents = AssessmentCompletedEvent | AnalysisRequestedEvent;
