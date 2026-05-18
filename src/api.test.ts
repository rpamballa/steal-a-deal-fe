import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {
  ApiError,
  api,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from './api';

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

const AUTH = {
  token: 'access-1',
  refreshToken: 'refresh-1',
  expiresAt: new Date(Date.now() + 900_000).toISOString(),
  userId: 1,
  displayName: 'Maya',
  email: 'maya@example.com',
  role: 'BUYER' as const,
  dealerId: null,
};

let handler: Handler;

beforeEach(() => {
  clearAuthSession();
  handler = () => json({});
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init)),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearAuthSession();
});

describe('auth session (in-memory only)', () => {
  it('stores and clears tokens in memory', () => {
    setAuthSession({token: 'a', refreshToken: 'r'});
    expect(getAccessToken()).toBe('a');
    expect(getRefreshToken()).toBe('r');
    clearAuthSession();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('never touches localStorage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    setAuthSession({token: 'a', refreshToken: 'r'});
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe('request wrapper', () => {
  it('attaches the bearer token on protected calls', async () => {
    setAuthSession({token: 'access-1', refreshToken: 'refresh-1'});
    let seenAuth: string | null = null;
    handler = (_url, init) => {
      seenAuth = new Headers(init?.headers).get('Authorization');
      return json({userId: 1, displayName: 'Maya', email: 'm', role: 'BUYER', dealerId: null});
    };
    await api.getCurrentUser();
    expect(seenAuth).toBe('Bearer access-1');
  });

  it('parses the standard error body into ApiError', async () => {
    handler = () =>
      json(
        {error: 'NOT_FOUND', message: 'Vehicle missing', timestamp: '2026-01-01T00:00:00Z'},
        404,
      );
    await expect(api.getVehicle(99)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      error: 'NOT_FOUND',
      message: 'Vehicle missing',
    });
  });
});

describe('401 -> refresh -> retry (rotation)', () => {
  it('refreshes once, rotates tokens, retries and succeeds', async () => {
    setAuthSession({token: 'expired', refreshToken: 'refresh-1'});
    const calls: string[] = [];
    handler = (url, init) => {
      calls.push(`${(init?.method ?? 'GET')} ${url}`);
      if (url.endsWith('/api/auth/refresh')) {
        return json({...AUTH, token: 'access-2', refreshToken: 'refresh-2'});
      }
      if (url.endsWith('/api/auth/me')) {
        const auth = new Headers(init?.headers).get('Authorization');
        if (auth === 'Bearer expired') return json({error: 'UNAUTHORIZED', message: 'expired'}, 401);
        return json({userId: 1, displayName: 'Maya', email: 'm', role: 'BUYER', dealerId: null});
      }
      return json({});
    };
    const me = await api.getCurrentUser();
    expect(me.displayName).toBe('Maya');
    expect(getAccessToken()).toBe('access-2');
    expect(getRefreshToken()).toBe('refresh-2'); // rotated
    expect(calls.filter(c => c.includes('/api/auth/refresh'))).toHaveLength(1);
  });

  it('concurrent 401s share a single refresh', async () => {
    setAuthSession({token: 'expired', refreshToken: 'refresh-1'});
    let refreshCount = 0;
    handler = (url, init) => {
      if (url.endsWith('/api/auth/refresh')) {
        refreshCount += 1;
        return json({...AUTH, token: 'access-2', refreshToken: 'refresh-2'});
      }
      const auth = new Headers(init?.headers).get('Authorization');
      if (auth === 'Bearer expired') return json({error: 'UNAUTHORIZED', message: 'x'}, 401);
      return json([]);
    };
    await Promise.all([api.listDeals(), api.listLeads(), api.listAppointments()]);
    expect(refreshCount).toBe(1);
  });
});

describe('refresh failure -> clean logout', () => {
  it('clears session and signals logout when refresh fails', async () => {
    setAuthSession({token: 'expired', refreshToken: 'bad-refresh'});
    let loggedOut = false;
    window.addEventListener('stealadeal:unauthorized', () => {
      loggedOut = true;
    });
    handler = url => {
      if (url.endsWith('/api/auth/refresh')) {
        return json({error: 'UNAUTHORIZED', message: 'refresh expired'}, 401);
      }
      return json({error: 'UNAUTHORIZED', message: 'expired'}, 401);
    };
    await expect(api.getCurrentUser()).rejects.toBeInstanceOf(ApiError);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(loggedOut).toBe(true);
  });
});

describe('403 does not trigger refresh', () => {
  it('throws an authorization error without refreshing', async () => {
    setAuthSession({token: 'access-1', refreshToken: 'refresh-1'});
    let refreshCount = 0;
    handler = url => {
      if (url.endsWith('/api/auth/refresh')) {
        refreshCount += 1;
        return json(AUTH);
      }
      return json({error: 'FORBIDDEN', message: 'not your tenant'}, 403);
    };
    await expect(api.listDeals()).rejects.toMatchObject({status: 403});
    expect(refreshCount).toBe(0);
    expect(getAccessToken()).toBe('access-1'); // session preserved
  });
});

describe('no refresh attempt for /api/auth/* calls', () => {
  it('login 401 does not loop into refresh', async () => {
    let refreshCount = 0;
    handler = url => {
      if (url.endsWith('/api/auth/refresh')) {
        refreshCount += 1;
        return json(AUTH);
      }
      return json({error: 'UNAUTHORIZED', message: 'bad creds'}, 401);
    };
    await expect(
      api.login({email: 'x@y.z', password: 'nope'}),
    ).rejects.toBeInstanceOf(ApiError);
    expect(refreshCount).toBe(0);
  });
});
