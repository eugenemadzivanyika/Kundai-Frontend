import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStore } from '../../services/tokenStore';
import { createOcrSession, closeOcrSession } from './ocr.api';
import { API_ORIGIN } from '../../config/env';

const SOCKET_URL = API_ORIGIN;

export interface StudentPageEntry {
  studentId: string;
  name: string;
  pageUrls: string[];
  syncing: boolean;
}

export interface OcrSessionState {
  sessionId:        string | null;
  pairToken:        string | null;
  pairCode:         string | null;
  phoneLive:        boolean;
  studentsWithPages: StudentPageEntry[];
  closeSession():   void;
}

export function useOcrSession(assessmentId: string | null): OcrSessionState {
  const [sessionId,        setSessionId]        = useState<string | null>(null);
  const [pairToken,        setPairToken]        = useState<string | null>(null);
  const [pairCode,         setPairCode]         = useState<string | null>(null);
  const [phoneLive,        setPhoneLive]        = useState(false);
  const [studentsWithPages, setStudentsWithPages] = useState<StudentPageEntry[]>([]);

  const socketRef    = useRef<Socket | null>(null);
  const nameMapRef   = useRef<Map<string, string>>(new Map());
  const sessionIdRef = useRef<string | null>(null);

  const closeSession = useCallback(() => {
    const sid = sessionIdRef.current;
    if (sid) closeOcrSession(sid).catch(() => {});
    socketRef.current?.disconnect();
    socketRef.current    = null;
    sessionIdRef.current = null;
    nameMapRef.current.clear();
    setSessionId(null);
    setPairToken(null);
    setPairCode(null);
    setPhoneLive(false);
    setStudentsWithPages([]);
  }, []);

  useEffect(() => {
    if (!assessmentId) return;

    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      try {
        const session = await createOcrSession(assessmentId);
        if (cancelled) return;

        sessionIdRef.current = session.sessionId;
        setSessionId(session.sessionId);
        setPairToken(session.pairToken);
        setPairCode(session.pairCode);

        const jwt = tokenStore.get();
        socket = io(SOCKET_URL, { auth: { token: jwt } });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket!.emit('ocr:join', { sessionId: session.sessionId });
        });

        socket.on('phone:joined', () => setPhoneLive(true));
        socket.on('phone:left',   () => setPhoneLive(false));

        socket.on('student:selected', ({ studentId, name }: { studentId: string; name: string }) => {
          if (studentId && name) nameMapRef.current.set(studentId, name);
        });

        socket.on('page:uploaded', ({ studentId, thumbUrl }: { studentId: string | null; thumbUrl: string }) => {
          const key  = studentId ?? '__anonymous__';
          const name = studentId ? (nameMapRef.current.get(studentId) ?? 'Student') : 'Anonymous';
          setStudentsWithPages(prev => {
            const existing = prev.find(s => s.studentId === key);
            if (existing) {
              return prev.map(s =>
                s.studentId === key
                  ? { ...s, pageUrls: [...s.pageUrls, thumbUrl], syncing: true }
                  : s
              );
            }
            return [...prev, { studentId: key, name, pageUrls: [thumbUrl], syncing: true }];
          });
        });

        socket.on('submission:saved', ({ studentId }: { studentId: string | null }) => {
          const key = studentId ?? '__anonymous__';
          setStudentsWithPages(prev =>
            prev.map(s => s.studentId === key ? { ...s, syncing: false } : s)
          );
        });

      } catch {
        // Session creation failed silently; teacher can still use drag/drop
      }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [assessmentId]);

  return { sessionId, pairToken, pairCode, phoneLive, studentsWithPages, closeSession };
}
