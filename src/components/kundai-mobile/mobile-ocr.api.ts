import { API_URL } from '../../config/env';

export interface PairResult {
  sessionId: string;
  phoneJwt: string;
  assessment: {
    id: string;
    name: string;
    subject: string;
    targetGroups: number;
  };
}

export interface RosterEntry {
  studentId: string;
  name: string;
  submittedPageCount: number;
}

export interface PageUploadResult {
  pageId: string;
  thumbUrl: string;
}

async function _post(url: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || res.statusText);
  }
  return res.json();
}

export async function pairPhone(input: { pairToken?: string; pairCode?: string }): Promise<PairResult> {
  return _post(`${API_URL}/ocr/pair`, input);
}

export async function fetchRoster(sessionId: string, phoneJwt: string): Promise<RosterEntry[]> {
  const res = await fetch(`${API_URL}/ocr/sessions/${sessionId}/roster`, {
    headers: { Authorization: `Bearer ${phoneJwt}` },
  });
  if (!res.ok) throw new Error('Failed to fetch roster');
  return res.json();
}

export async function uploadPage(
  sessionId: string,
  phoneJwt: string,
  blob: Blob,
  meta: { studentId?: string; pageIndex: number },
): Promise<PageUploadResult> {
  const form = new FormData();
  form.append('page', blob, 'page.jpg');
  if (meta.studentId) form.append('studentId', meta.studentId);
  form.append('pageIndex', String(meta.pageIndex));

  const res = await fetch(`${API_URL}/ocr/sessions/${sessionId}/pages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${phoneJwt}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || res.statusText);
  }
  return res.json();
}

export async function saveStudentSubmission(
  sessionId: string,
  phoneJwt: string,
  studentId: string | null,
  pageIds: string[],
): Promise<void> {
  await _post(
    `${API_URL}/ocr/sessions/${sessionId}/submissions`,
    { studentId, pageIds, pageCount: pageIds.length },
    phoneJwt,
  );
}
