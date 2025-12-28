// =====================================================
// API Load Test Scenario
// Tests API endpoint performance under load
// =====================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, defaultThresholds, loadStages, getHeaders } from '../k6-config.js';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');

// Test configuration
export const options = {
  stages: loadStages[__ENV.LOAD_PROFILE || 'load'],
  thresholds: {
    ...defaultThresholds,
    'health_check_duration': ['p(95)<100'],  // Health check should be fast
    'errors': ['rate<0.01'],
  },
};

// Main test function
export default function () {
  const headers = getHeaders();

  // Health Check endpoint
  group('Health Check', () => {
    const startTime = Date.now();
    const res = http.get(`${BASE_URL}/api/health`, { headers });
    healthCheckDuration.add(Date.now() - startTime);

    const passed = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check response has status': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy';
        } catch {
          return false;
        }
      },
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });

    errorRate.add(!passed);
  });

  sleep(1);

  // Public pages
  group('Public Pages', () => {
    const res = http.get(`${BASE_URL}/login`, { headers });

    const passed = check(res, {
      'login page status is 200': (r) => r.status === 200,
      'login page loads under 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!passed);
  });

  sleep(0.5);
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log(`Starting API load test against ${BASE_URL}`);
  console.log(`Load profile: ${__ENV.LOAD_PROFILE || 'load'}`);

  // Verify the target is reachable
  const res = http.get(`${BASE_URL}/api/health`);
  if (res.status !== 200) {
    throw new Error(`Target not reachable: ${BASE_URL}`);
  }

  return { startTime: Date.now() };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Test completed in ${duration.toFixed(2)} seconds`);
}
