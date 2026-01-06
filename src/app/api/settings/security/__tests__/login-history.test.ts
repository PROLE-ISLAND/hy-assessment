// =====================================================
// Login History API Tests
// Issue: #134
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Import after mocking
import { GET } from '../login-history/route';

describe('Login History API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/security/login-history', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost/api/settings/security/login-history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('unauthorized');
    });

    it('should return empty array when no history exists', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockSelectCount = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      });

      const mockSelectData = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectCount,
      }).mockReturnValueOnce({
        select: mockSelectData,
      });

      const request = new NextRequest('http://localhost/api/settings/security/login-history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return paginated login history', async () => {
      const mockHistory = [
        {
          id: 'log-1',
          user_id: 'user-123',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 Chrome',
          device_type: 'desktop',
          browser: 'Chrome',
          os: 'macOS',
          country: 'Japan',
          city: 'Tokyo',
          success: true,
          failure_reason: null,
          created_at: '2024-01-07T00:00:00Z',
        },
        {
          id: 'log-2',
          user_id: 'user-123',
          ip_address: '192.168.1.2',
          user_agent: 'Mozilla/5.0 Firefox',
          device_type: 'desktop',
          browser: 'Firefox',
          os: 'Windows',
          country: 'Japan',
          city: 'Osaka',
          success: false,
          failure_reason: 'invalid_password',
          created_at: '2024-01-06T00:00:00Z',
        },
      ];

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockSelectCount = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 2,
          error: null,
        }),
      });

      const mockSelectData = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockHistory,
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectCount,
      }).mockReturnValueOnce({
        select: mockSelectData,
      });

      const request = new NextRequest('http://localhost/api/settings/security/login-history?page=1&pageSize=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history).toHaveLength(2);
      expect(data.pagination).toMatchObject({
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('should transform login history to correct format', async () => {
      const mockHistory = [
        {
          id: 'log-1',
          user_id: 'user-123',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 Chrome',
          device_type: 'desktop',
          browser: 'Chrome',
          os: 'macOS',
          country: 'Japan',
          city: 'Tokyo',
          success: true,
          failure_reason: null,
          created_at: '2024-01-07T00:00:00Z',
        },
      ];

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockSelectCount = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      });

      const mockSelectData = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockHistory,
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectCount,
      }).mockReturnValueOnce({
        select: mockSelectData,
      });

      const request = new NextRequest('http://localhost/api/settings/security/login-history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history[0]).toMatchObject({
        id: 'log-1',
        location: 'Tokyo, Japan',
        deviceType: 'desktop',
        browser: 'Chrome',
        success: true,
      });
      expect(data.history[0].failureReason).toBeUndefined();
    });

    it('should include failure reason for failed logins', async () => {
      const mockHistory = [
        {
          id: 'log-1',
          user_id: 'user-123',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          device_type: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          country: 'Japan',
          city: null,
          success: false,
          failure_reason: 'invalid_password',
          created_at: '2024-01-07T00:00:00Z',
        },
      ];

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockSelectCount = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      });

      const mockSelectData = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockHistory,
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectCount,
      }).mockReturnValueOnce({
        select: mockSelectData,
      });

      const request = new NextRequest('http://localhost/api/settings/security/login-history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history[0].success).toBe(false);
      expect(data.history[0].failureReason).toBe('invalid_password');
      expect(data.history[0].location).toBe('Japan');
    });

    it('should handle pagination parameters correctly', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockSelectCount = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 50,
          error: null,
        }),
      });

      const mockSelectData = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelectCount,
      }).mockReturnValueOnce({
        select: mockSelectData,
      });

      const request = new NextRequest('http://localhost/api/settings/security/login-history?page=3&pageSize=15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toMatchObject({
        page: 3,
        pageSize: 15,
        total: 50,
        totalPages: 4,
        hasNext: true,
        hasPrev: true,
      });
    });
  });
});
