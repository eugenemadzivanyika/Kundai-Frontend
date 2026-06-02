import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseErrorMessage, resolveAssetUrl, fetchData } from '../apiClient';
import { tokenStore } from '../tokenStore';

// ---------------------------------------------------------------------------
// parseErrorMessage
// ---------------------------------------------------------------------------

describe('parseErrorMessage', () => {
  it('extracts message from an axios-style error with a message field', () => {
    const err = { isAxiosError: true, response: { data: { message: 'Not found' } } };
    expect(parseErrorMessage(err)).toBe('Not found');
  });

  it('joins multiple validation errors into one string', () => {
    const err = {
      isAxiosError: true,
      response: { data: { errors: [{ msg: 'Required' }, { msg: 'Too short' }] } },
    };
    expect(parseErrorMessage(err)).toBe('Required | Too short');
  });

  it('falls back to error.message for axios error without response data', () => {
    const err = { isAxiosError: true, response: { data: null }, message: 'Network Error' };
    expect(parseErrorMessage(err)).toBe('Network Error');
  });

  it('handles non-axios Error instances', () => {
    expect(parseErrorMessage(new Error('plain error'))).toBe('plain error');
  });

  it('returns fallback string for unknown error shape', () => {
    expect(parseErrorMessage(null)).toBe('An unexpected error occurred');
    expect(parseErrorMessage(undefined)).toBe('An unexpected error occurred');
  });

  it('extracts error field from non-axios error with response.data', () => {
    const err = { response: { data: { error: 'Forbidden' } } };
    expect(parseErrorMessage(err)).toBe('Forbidden');
  });
});

// ---------------------------------------------------------------------------
// resolveAssetUrl
// ---------------------------------------------------------------------------

describe('resolveAssetUrl', () => {
  it('returns empty string for null/undefined', () => {
    expect(resolveAssetUrl(null)).toBe('');
    expect(resolveAssetUrl(undefined)).toBe('');
    expect(resolveAssetUrl('')).toBe('');
  });

  it('returns absolute http/https URLs unchanged', () => {
    expect(resolveAssetUrl('https://cdn.example.com/img.png')).toBe('https://cdn.example.com/img.png');
    expect(resolveAssetUrl('http://localhost/file')).toBe('http://localhost/file');
  });

  it('returns blob: URLs unchanged', () => {
    expect(resolveAssetUrl('blob:http://localhost/abc')).toBe('blob:http://localhost/abc');
  });

  it('returns data: URLs unchanged', () => {
    expect(resolveAssetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('prepends the API origin to relative paths', () => {
    // API_URL is 'http://localhost:5000/api', so origin = 'http://localhost:5000'
    expect(resolveAssetUrl('/uploads/avatar.png')).toBe('http://localhost:5000/uploads/avatar.png');
  });
});

// ---------------------------------------------------------------------------
// fetchData — happy path and auth-header injection
// ---------------------------------------------------------------------------

describe('fetchData', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal('fetch', mockFetch);
    tokenStore.set(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    tokenStore.set(null);
  });

  it('returns parsed JSON on a successful response', async () => {
    const payload = { id: 1, name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    const result = await fetchData('/test');
    expect(result).toEqual(payload);
  });

  it('injects the Authorization header when a token is stored', async () => {
    tokenStore.set('my-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await fetchData('/secure');
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });

  it('does not inject Authorization header when no token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await fetchData('/public');
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('throws on a non-ok, non-401 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad input' }),
    });

    await expect(fetchData('/bad')).rejects.toMatchObject({ message: expect.stringContaining('400') });
  });
});
