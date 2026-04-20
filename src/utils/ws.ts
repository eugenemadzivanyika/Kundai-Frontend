// src/utils/ws.ts

export const getChatWsUrl = (): string => {
  // Check if a specific WebSocket URL is defined in .env
  const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (envUrl) {
    return envUrl.endsWith('/ws/chat') ? envUrl : `${envUrl.replace(/\/$/, '')}/ws/chat`;
  }

  // Fallback: Automatically convert your API_URL (http://...) to a WS URL (ws://...)
  // This assumes your backend WebSocket server is running on the same host/port
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl && apiUrl.startsWith('http')) {
    const base = apiUrl.replace(/\/api\/?$/, '');
    return base.replace(/^http/, 'ws') + '/ws/chat';
  }

  // Local development default if no env vars are found
  return 'ws://localhost:5000/ws/chat';
};
