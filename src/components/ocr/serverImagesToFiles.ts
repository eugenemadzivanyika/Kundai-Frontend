import { tokenStore } from '../../services/tokenStore';
import { NODE_API_URL } from './ocr.constants';

const ORIGIN = NODE_API_URL.replace('/api', '');

export async function serverImagesToFiles(pageUrls: string[]): Promise<File[]> {
  const token = tokenStore.get();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  return Promise.all(
    pageUrls.map(async (url, i) => {
      const fullUrl = url.startsWith('http') ? url : `${ORIGIN}${url}`;
      const resp = await fetch(fullUrl, { headers });
      if (!resp.ok) throw new Error(`Failed to fetch image (${resp.status}): ${url}`);
      const blob = await resp.blob();
      const ext  = blob.type === 'image/png' ? 'png' : 'jpg';
      return new File([blob], `page-${i + 1}.${ext}`, { type: blob.type || 'image/jpeg' });
    })
  );
}
