import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PairResult, RosterEntry, fetchRoster, uploadPage, saveStudentSubmission } from './mobile-ocr.api';
import { usePhoneSocket } from './hooks/usePhoneSocket';
import { queuePage, registerOnlineListener, drainQueue, type DrainResult } from './lib/outbox';
import { PairScreen } from './screens/PairScreen';
import { ConnectedScreen } from './screens/ConnectedScreen';
import { StudentPickerScreen } from './screens/StudentPickerScreen';
import { CameraScreen } from './screens/CameraScreen';
import { PreviewScreen } from './screens/PreviewScreen';
import { StudentDoneScreen } from './screens/StudentDoneScreen';
import { GalleryScreen } from './screens/GalleryScreen';
import { DoneScreen } from './screens/DoneScreen';

type Screen = 'pair' | 'connected' | 'student-picker' | 'camera' | 'preview' | 'student-done' | 'gallery' | 'done';

interface PageEntry { pageId: string; thumbUrl: string; synced: boolean; }

export function MobileOcrApp() {
  const { pairToken: tokenFromUrl } = useParams<{ pairToken?: string }>();

  const [screen, setScreen] = useState<Screen>('pair');
  const [phoneJwt, setPhoneJwt]  = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<PairResult['assessment'] | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [currentStudent, setCurrentStudent] = useState<RosterEntry | null>(null);
  // pagesByStudent: key = studentId or 'anon', value = page list
  const [pagesByStudent, setPagesByStudent] = useState<Record<string, PageEntry[]>>({});
  const [capturedBlob, setCapturedBlob]       = useState<Blob | null>(null);
  const [capturedCorners, setCapturedCorners] = useState<import('./hooks/useEdgeDetection').Point[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const { emitStudentSelected, emitSubmissionSaved, connected } = usePhoneSocket(sessionId, phoneJwt);

  // Keep stable refs for upload credentials so the online listener callback
  // doesn't capture stale closures.
  const sessionIdRef = useRef(sessionId);
  const phoneJwtRef  = useRef(phoneJwt);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { phoneJwtRef.current  = phoneJwt;  }, [phoneJwt]);

  // Register online / Background Sync listener once on mount; drains queue
  // whenever connectivity is restored.
  useEffect(() => {
    // Listen for SW message (Background Sync fires when tab may be backgrounded)
    const onMessage = (evt: MessageEvent) => {
      if (evt.data?.type === 'OCR_DRAIN_OUTBOX') {
        const sid = sessionIdRef.current;
        const jwt = phoneJwtRef.current;
        if (!sid || !jwt) return;
        drainQueue((blob, meta) => uploadPage(meta.sessionId, meta.phoneJwt, blob, {
          studentId: meta.studentId ?? undefined,
          pageIndex: meta.pageIndex,
        })).then(applyDrainResults);
      }
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);

    const removeOnline = registerOnlineListener(
      (blob, meta) => uploadPage(meta.sessionId, meta.phoneJwt, blob, {
        studentId: meta.studentId ?? undefined,
        pageIndex: meta.pageIndex,
      }),
      applyDrainResults,
    );

    return () => {
      removeOnline();
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, []);

  function onPaired(result: PairResult) {
    setPhoneJwt(result.phoneJwt);
    setSessionId(result.sessionId);
    setAssessment(result.assessment);
    setScreen('connected');
  }

  // Load roster when session is established
  useEffect(() => {
    if (!sessionId || !phoneJwt) return;
    fetchRoster(sessionId, phoneJwt).then(setRoster).catch(() => {});
  }, [sessionId, phoneJwt]);

  function selectStudent(student: RosterEntry | null) {
    setCurrentStudent(student);
    if (student) emitStudentSelected(student.studentId, student.name);
    setScreen('camera');
  }

  function handleCapture(blob: Blob, corners: import('./hooks/useEdgeDetection').Point[] | null) {
    setCapturedBlob(blob);
    setCapturedCorners(corners);
    setScreen('preview');
  }

  const currentKey = currentStudent?.studentId ?? 'anon';
  const currentPages = pagesByStudent[currentKey] ?? [];

  // Applied when the online listener or SW sync drains queued uploads.
  function applyDrainResults(results: DrainResult[]) {
    results.forEach(r => {
      if (r.ok) {
        // We don't know which student the drained entry belongs to — the entry
        // stored the studentId. We mark the page as synced in all buckets by
        // pageId. This is a best-effort UI update; the submission is already
        // persisted server-side.
        setPagesByStudent(prev => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            next[key] = (next[key] ?? []).map(p =>
              p.pageId === `queued:${r.entryId}` ? { ...p, pageId: r.pageId, thumbUrl: r.thumbUrl, synced: true } : p
            );
          }
          return next;
        });
      }
    });
  }

  async function handleKeepPage(blobToUpload: Blob) {
    if (!sessionId || !phoneJwt) return;
    setUploading(true);

    const pageIndex = currentPages.length;

    try {
      if (navigator.onLine) {
        // Online — upload directly
        const result = await uploadPage(sessionId, phoneJwt, blobToUpload, {
          studentId: currentStudent?.studentId,
          pageIndex,
        });
        setPagesByStudent(prev => ({
          ...prev,
          [currentKey]: [...(prev[currentKey] ?? []), { pageId: result.pageId, thumbUrl: result.thumbUrl, synced: true }],
        }));
      } else {
        // Offline — queue for later upload; show optimistic placeholder
        const entryId = await queuePage({
          sessionId,
          phoneJwt,
          studentId:  currentStudent?.studentId ?? null,
          pageIndex,
          blob:       blobToUpload,
        });
        const placeholderUrl = URL.createObjectURL(blobToUpload);
        setPagesByStudent(prev => ({
          ...prev,
          [currentKey]: [...(prev[currentKey] ?? []), { pageId: `queued:${entryId}`, thumbUrl: placeholderUrl, synced: false }],
        }));
      }
      setCapturedBlob(null);
      setCapturedCorners(null);
      setScreen('camera');
    } catch {
      // stay on preview — let user retry
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDone() {
    if (!sessionId || !phoneJwt) return;
    const pageIds = currentPages.map(p => p.pageId);
    await saveStudentSubmission(sessionId, phoneJwt, currentStudent?.studentId ?? null, pageIds);
    emitSubmissionSaved(currentStudent?.studentId ?? null, pageIds, pageIds.length);
    // refresh roster page count
    setRoster(prev => prev.map(s =>
      s.studentId === currentStudent?.studentId
        ? { ...s, submittedPageCount: pageIds.length }
        : s
    ));
    setScreen('student-done');
  }

  const allPages = Object.values(pagesByStudent).flat();
  const submittedCount = Object.keys(pagesByStudent).filter(k => (pagesByStudent[k]?.length ?? 0) > 0).length;

  const galleryEntries = Object.entries(pagesByStudent).map(([studentId, pages]) => {
    const rosterEntry = roster.find(r => r.studentId === studentId);
    return {
      studentId: studentId === 'anon' ? null : studentId,
      name: rosterEntry?.name ?? 'Anonymous',
      pages,
    };
  });

  const handleDisconnect = useCallback(() => {
    setPhoneJwt(null);
    setSessionId(null);
    setAssessment(null);
    setRoster([]);
    setPagesByStudent({});
    setCapturedBlob(null);
    setCapturedCorners(null);
    setCurrentStudent(null);
    setScreen('pair');
  }, []);

  return (
    <div style={{ width: '100%', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      {screen === 'pair' && (
        <PairScreen initialToken={tokenFromUrl} onPaired={onPaired} />
      )}
      {screen === 'connected' && assessment && (
        <ConnectedScreen
          assessment={assessment}
          connected={connected}
          onStart={() => setScreen('student-picker')}
          onDisconnect={handleDisconnect}
        />
      )}
      {screen === 'student-picker' && (
        <StudentPickerScreen
          roster={roster}
          onSelect={selectStudent}
          onBack={() => setScreen('connected')}
        />
      )}
      {screen === 'camera' && (
        <CameraScreen
          student={currentStudent}
          pageIndex={currentPages.length}
          onCapture={handleCapture}
          onSaveDone={handleSaveDone}
          onBack={() => setScreen('student-picker')}
        />
      )}
      {screen === 'preview' && capturedBlob && (
        <PreviewScreen
          blob={capturedBlob}
          corners={capturedCorners}
          pageNumber={currentPages.length + 1}
          uploading={uploading}
          onRetake={() => { setCapturedBlob(null); setCapturedCorners(null); setScreen('camera'); }}
          onKeep={handleKeepPage}
        />
      )}
      {screen === 'student-done' && (
        <StudentDoneScreen
          student={currentStudent}
          pages={currentPages}
          totalStudents={roster.length}
          submittedCount={submittedCount}
          onNextStudent={() => setScreen('student-picker')}
          onViewGallery={() => setScreen('gallery')}
        />
      )}
      {screen === 'gallery' && assessment && (
        <GalleryScreen
          assessmentName={assessment.name}
          studentEntries={galleryEntries}
          totalStudents={roster.length}
          onNextStudent={() => setScreen('student-picker')}
          onDone={() => setScreen('done')}
          onBack={() => setScreen('student-done')}
        />
      )}
      {screen === 'done' && assessment && (
        <DoneScreen
          assessmentName={assessment.name}
          pageCount={allPages.length}
          onNewBatch={handleDisconnect}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  );
}
