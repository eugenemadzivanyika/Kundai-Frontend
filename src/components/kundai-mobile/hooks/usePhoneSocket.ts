import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000/api').replace('/api', '');

export function usePhoneSocket(sessionId: string | null, phoneJwt: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId || !phoneJwt) return;

    const socket = io(SOCKET_URL, { auth: { token: phoneJwt } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('ocr:join', { sessionId });
    });
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [sessionId, phoneJwt]);

  const emitStudentSelected = useCallback((studentId: string, name: string) => {
    socketRef.current?.emit('ocr:student_selected', { sessionId, studentId, name });
  }, [sessionId]);

  const emitSubmissionSaved = useCallback((studentId: string | null, pageIds: string[], pageCount: number) => {
    socketRef.current?.emit('ocr:submission_saved', { sessionId, studentId, pageIds, pageCount });
  }, [sessionId]);

  return { emitStudentSelected, emitSubmissionSaved, connected };
}
