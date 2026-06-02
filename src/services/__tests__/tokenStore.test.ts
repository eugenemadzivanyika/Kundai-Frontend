import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tokenStore } from '../tokenStore';

beforeEach(() => {
  // Reset to clean state before each test.
  tokenStore.set(null);
});

describe('tokenStore', () => {
  it('returns null initially', () => {
    expect(tokenStore.get()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    tokenStore.set('abc123');
    expect(tokenStore.get()).toBe('abc123');
  });

  it('clears the token when set to null', () => {
    tokenStore.set('abc123');
    tokenStore.set(null);
    expect(tokenStore.get()).toBeNull();
  });

  it('notifies subscribers on set', () => {
    const listener = vi.fn();
    tokenStore.subscribe(listener);
    tokenStore.set('newToken');
    expect(listener).toHaveBeenCalledWith('newToken');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribing stops notifications', () => {
    const listener = vi.fn();
    const unsub = tokenStore.subscribe(listener);
    unsub();
    tokenStore.set('ignored');
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies multiple subscribers independently', () => {
    const a = vi.fn();
    const b = vi.fn();
    tokenStore.subscribe(a);
    tokenStore.subscribe(b);
    tokenStore.set('tok');
    expect(a).toHaveBeenCalledWith('tok');
    expect(b).toHaveBeenCalledWith('tok');
  });
});
