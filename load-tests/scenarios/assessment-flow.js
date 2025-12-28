// =====================================================
// Assessment Flow Load Test Scenario
// Simulates typical user assessment completion flow
// =====================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { BASE_URL, defaultThresholds, loadStages, getHeaders } from '../k6-config.js';

// Custom metrics
const errorRate = new Rate('errors');
const assessmentStarted = new Counter('assessments_started');
const assessmentCompleted = new Counter('assessments_completed');
const assessmentDuration = new Trend('assessment_flow_duration');

// Test configuration - lighter load for assessment flow
export const options = {
  stages: [
    { duration: '30s', target: 5 },    // Ramp up to 5 concurrent users
    { duration: '2m', target: 5 },     // Maintain 5 users
    { duration: '30s', target: 10 },   // Increase to 10
    { duration: '2m', target: 10 },    // Maintain 10 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    ...defaultThresholds,
    'assessment_flow_duration': ['p(95)<10000'],  // Full flow under 10s
    'errors': ['rate<0.05'],  // 5% error tolerance for complex flow
  },
};

// Simulate assessment data
function generateAssessmentData() {
  return {
    // HY適性検査の回答データ（模擬）
    responses: {
      section1: Array(10).fill(0).map(() => Math.floor(Math.random() * 5) + 1),
      section2: Array(10).fill(0).map(() => Math.floor(Math.random() * 5) + 1),
      section3: Array(10).fill(0).map(() => Math.floor(Math.random() * 5) + 1),
    },
    metadata: {
      startTime: new Date().toISOString(),
      userAgent: 'k6-load-test',
    },
  };
}

// Main test function - simulates assessment flow
export default function () {
  const flowStartTime = Date.now();
  const headers = getHeaders();

  // Step 1: Access assessment landing page
  group('Assessment Landing', () => {
    const res = http.get(`${BASE_URL}/assessment`, {
      headers,
      tags: { step: 'landing' },
    });

    const passed = check(res, {
      'landing page loads': (r) => r.status === 200 || r.status === 302,
      'landing response time OK': (r) => r.timings.duration < 3000,
    });

    if (!passed) {
      errorRate.add(1);
      return;
    }
  });

  sleep(2);  // User reads instructions

  // Step 2: Start assessment
  group('Start Assessment', () => {
    assessmentStarted.add(1);

    // Simulate form load/initialization
    const res = http.get(`${BASE_URL}/api/health`, {
      headers,
      tags: { step: 'init' },
    });

    check(res, {
      'API available': (r) => r.status === 200,
    });
  });

  sleep(1);

  // Step 3: Answer questions (simulated)
  group('Answer Questions', () => {
    // Simulate time spent answering questions
    // In real scenario, this would be form submissions
    for (let i = 0; i < 3; i++) {
      sleep(3);  // 3 seconds per "page" of questions

      // Periodic health check to simulate API calls
      http.get(`${BASE_URL}/api/health`, {
        headers,
        tags: { step: `section_${i + 1}` },
      });
    }
  });

  // Step 4: Complete assessment
  group('Complete Assessment', () => {
    assessmentCompleted.add(1);

    // Record flow duration
    assessmentDuration.add(Date.now() - flowStartTime);
  });

  sleep(1);  // Brief pause between iterations
}

// Setup
export function setup() {
  console.log(`Starting Assessment Flow load test against ${BASE_URL}`);

  // Verify target is reachable
  const res = http.get(`${BASE_URL}/api/health`);
  if (res.status !== 200) {
    throw new Error(`Target not reachable: ${BASE_URL}`);
  }

  return { startTime: Date.now() };
}

// Teardown with summary
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`
===== Assessment Flow Test Summary =====
Duration: ${duration.toFixed(2)} seconds
Target: ${BASE_URL}
========================================
  `);
}
