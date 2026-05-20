// Access token lives only in memory — never written to localStorage/sessionStorage.
// On page refresh the token is gone; the app bootstraps via the refresh cookie.

let _accessToken: string | null = null;
const _listeners: Array<(token: string | null) => void> = [];

export const tokenStore = {
  get(): string | null {
    return _accessToken;
  },
  set(token: string | null): void {
    _accessToken = token;
    _listeners.forEach(fn => fn(token));
  },
  subscribe(fn: (token: string | null) => void): () => void {
    _listeners.push(fn);
    return () => {
      const idx = _listeners.indexOf(fn);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  },
};
