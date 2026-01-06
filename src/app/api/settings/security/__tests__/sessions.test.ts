// =====================================================
// Security Sessions API Tests
// Issue: #134
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(),
};

const mockAdminClient = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  createAdminClient: vi.fn(() => mockAdminClient),
}));

// Import after mocking
import { GET, DELETE } from '../sessions/route';

describe('Security Sessions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/security/sessions', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('unauthorized');
    });

    it('should return empty array when no sessions exist', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'current-token' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return sessions with correct format', async () => {
      const mockSession = {
        id: 'session-1',
        user_id: 'user-123',
        session_token: 'current-token',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 Chrome',
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        country: 'Japan',
        city: 'Tokyo',
        is_current: true,
        last_active_at: '2024-01-07T00:00:00Z',
        expires_at: '2024-01-08T00:00:00Z',
        created_at: '2024-01-06T00:00:00Z',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'current-token' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [mockSession],
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toHaveLength(1);
      expect(data.sessions[0]).toMatchObject({
        id: 'session-1',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        location: 'Tokyo, Japan',
        isCurrent: true,
      });
    });
  });

  describe('DELETE /api/settings/security/sessions', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('unauthorized');
    });

    it('should return 400 when no current session token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('現在のセッションが見つかりません');
    });

    it('should terminate all other sessions successfully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'current-token' } },
      });
      mockAdminClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({
              count: 2,
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.terminatedCount).toBe(2);
    });
  });
});

describe('Security Session Individual API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Import the individual session route
  const mockParams = { params: Promise.resolve({ id: 'session-123' }) };

  it('should validate session ID format', async () => {
    const { DELETE: DeleteById } = await import('../sessions/[id]/route');

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const invalidParams = { params: Promise.resolve({ id: 'invalid-id' }) };
    const request = new NextRequest('http://localhost/api/settings/security/sessions/invalid-id', {
      method: 'DELETE',
    });

    const response = await DeleteById(request, invalidParams);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_error');
  });

  it('should return 404 when session not found', async () => {
    const { DELETE: DeleteById } = await import('../sessions/[id]/route');

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'current-token' } },
    });
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }),
    });

    const validUUID = '12345678-1234-1234-1234-123456789abc';
    const validParams = { params: Promise.resolve({ id: validUUID }) };
    const request = new NextRequest(`http://localhost/api/settings/security/sessions/${validUUID}`, {
      method: 'DELETE',
    });

    const response = await DeleteById(request, validParams);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('not_found');
  });
});
