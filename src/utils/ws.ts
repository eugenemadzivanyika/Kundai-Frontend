// src/utils/ws.ts
import { WEBSOCKET_URL } from '../config/env';

export const getChatWsUrl = (): string => {
  return WEBSOCKET_URL.endsWith('/ws/chat')
    ? WEBSOCKET_URL
    : `${WEBSOCKET_URL.replace(/\/$/, '')}/ws/chat`;
};
