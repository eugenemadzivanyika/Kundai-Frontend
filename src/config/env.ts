// Single source of truth for runtime configuration.
//
// Every value is read from a Vite env var (.env, VITE_* prefix) and inlined at
// BUILD time. There are deliberately NO localhost fallbacks: if a required
// variable is missing when the bundle is built, the app throws on load so the
// misconfiguration surfaces immediately instead of silently hitting localhost.
//
// NOTE: access each var with a literal `import.meta.env.VITE_X` so Vite can
// statically replace it. Dynamic (`import.meta.env[name]`) access is NOT
// reliably replaced and must be avoided.

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Define it in .env and rebuild — Vite inlines VITE_* vars at build time, ` +
        `so editing .env without rebuilding has no effect.`,
    );
  }
  return value;
}

// e.g. https://www.kundai.app/api
export const API_URL = requireEnv(
  'VITE_API_URL',
  import.meta.env.VITE_API_URL as string | undefined,
);

// e.g. https://www.kundai.app/ai-service
export const AI_SERVICE_URL = requireEnv(
  'VITE_AI_SERVICE_URL',
  import.meta.env.VITE_AI_SERVICE_URL as string | undefined,
);

// e.g. wss://www.kundai.app/ws — base for the raw chat WebSocket
export const WEBSOCKET_URL = requireEnv(
  'VITE_WEBSOCKET_URL',
  import.meta.env.VITE_WEBSOCKET_URL as string | undefined,
);

// API host without the trailing /api — used for socket.io connections and for
// resolving uploaded-file / asset URLs.
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
