// =====================================================
// k6 Load Test Configuration
// Shared configuration for all load test scenarios
// =====================================================

// Environment variables with defaults
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_TOKEN = __ENV.API_TOKEN || '';

// Performance thresholds (shared across scenarios)
export const defaultThresholds = {
  // Response time thresholds
  http_req_duration: [
    'p(50)<200',   // 50th percentile under 200ms
    'p(95)<500',   // 95th percentile under 500ms
    'p(99)<1000',  // 99th percentile under 1000ms
  ],
  // Error rate threshold
  http_req_failed: ['rate<0.01'],  // Less than 1% failure rate
  // Throughput
  http_reqs: ['rate>10'],  // At least 10 requests per second
};

// Strict thresholds for critical endpoints
export const strictThresholds = {
  http_req_duration: [
    'p(50)<100',
    'p(95)<250',
    'p(99)<500',
  ],
  http_req_failed: ['rate<0.001'],  // Less than 0.1% failure rate
};

// Load stage presets
export const loadStages = {
  // Smoke test - minimal load to verify system works
  smoke: [
    { duration: '30s', target: 1 },
    { duration: '1m', target: 1 },
    { duration: '30s', target: 0 },
  ],

  // Load test - normal expected load
  load: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],

  // Stress test - beyond normal capacity
  stress: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],

  // Spike test - sudden traffic surge
  spike: [
    { duration: '30s', target: 5 },
    { duration: '10s', target: 100 },  // Sudden spike
    { duration: '1m', target: 100 },
    { duration: '10s', target: 5 },    // Drop
    { duration: '30s', target: 0 },
  ],

  // Soak test - sustained load over time
  soak: [
    { duration: '2m', target: 20 },
    { duration: '30m', target: 20 },
    { duration: '2m', target: 0 },
  ],
};

// Common HTTP headers
export function getHeaders(authenticated = false) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (authenticated && API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  return headers;
}
