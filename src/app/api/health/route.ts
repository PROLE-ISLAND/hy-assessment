// =====================================================
// Health Check Endpoint
// Returns system health status for monitoring tools
// =====================================================

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface HealthCheck {
  database: 'ok' | 'error';
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  responseTime: number;
  checks: HealthCheck;
  environment: string;
}

/**
 * GET /api/health
 * Public endpoint for health monitoring
 * No authentication required
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startTime = Date.now();
  const checks: HealthCheck = {
    database: 'error',
  };

  // Check Supabase connection
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (!error) {
      checks.database = 'ok';
    }
  } catch {
    checks.database = 'error';
  }

  const allHealthy = Object.values(checks).every((v) => v === 'ok');
  const responseTime = Date.now() - startTime;

  const response: HealthResponse = {
    status: allHealthy ? 'healthy' : 'degraded',
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
    responseTime,
    checks,
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(response, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
