// useEdgeDetection — lazy-loads @techstark/opencv-js, runs every 300 ms on the
// live video feed, returns the 4 corners of the detected document quad.
// Also exports applyPerspectiveCrop to do the actual warpPerspective transform
// on the captured blob so it only runs once (not on every frame).

import { useEffect, useRef, useState } from 'react';

export interface Point { x: number; y: number }

// ── OpenCV bootstrap ──────────────────────────────────────────────────────────

let cvReady = false;
let cvLoadPromise: Promise<void> | null = null;

function loadCv(): Promise<void> {
  if (cvReady) return Promise.resolve();
  if (cvLoadPromise) return cvLoadPromise;
  cvLoadPromise = import('@techstark/opencv-js').then(() => {
    return new Promise<void>(resolve => {
      const existing = (globalThis as any).cv;
      if (existing && existing.Mat) {
        cvReady = true;
        resolve();
        return;
      }
      const prev = (globalThis as any).Module?.onRuntimeInitialized;
      (globalThis as any).cv = { onRuntimeInitialized() {
        if (prev) prev();
        cvReady = true;
        resolve();
      }};
    });
  });
  return cvLoadPromise;
}

// ── Corner order: top-left, top-right, bottom-right, bottom-left ─────────────

function orderCorners(pts: Point[]): Point[] {
  if (pts.length !== 4) return pts;
  const cx = pts.reduce((a, p) => a + p.x, 0) / 4;
  const cy = pts.reduce((a, p) => a + p.y, 0) / 4;
  const tl = pts.filter(p => p.x <= cx && p.y <= cy).sort((a, b) => a.x - b.x)[0];
  const tr = pts.filter(p => p.x >  cx && p.y <= cy).sort((a, b) => b.x - a.x)[0];
  const br = pts.filter(p => p.x >  cx && p.y >  cy).sort((a, b) => b.x - a.x)[0];
  const bl = pts.filter(p => p.x <= cx && p.y >  cy).sort((a, b) => a.x - b.x)[0];
  if (!tl || !tr || !br || !bl) return pts;
  return [tl, tr, br, bl];
}

// ── Edge detection in image pixel space ──────────────────────────────────────

function detectDocCorners(imageData: ImageData): Point[] | null {
  const cv = (globalThis as any).cv;
  if (!cv || !cv.Mat) return null;
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let result: Point[] | null = null;

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 50, 150);

    // Dilate slightly to close small gaps in document edges
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.dilate(edges, edges, kernel);
    kernel.delete();

    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let bestArea = 0;
    let bestQuad: Point[] | null = null;
    const imageArea = imageData.width * imageData.height;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows === 4) {
        const area = cv.contourArea(approx);
        // Must cover at least 10% of the image and be the largest quad seen
        if (area > imageArea * 0.1 && area > bestArea) {
          bestArea = area;
          bestQuad = [];
          for (let j = 0; j < 4; j++) {
            bestQuad.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] });
          }
        }
      }
      approx.delete();
      cnt.delete();
    }

    if (bestQuad) result = orderCorners(bestQuad);
  } finally {
    src.delete(); gray.delete(); blurred.delete(); edges.delete();
    contours.delete(); hierarchy.delete();
  }
  return result;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useEdgeDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const [corners, setCorners]   = useState<Point[] | null>(null);
  const [cvLoaded, setCvLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadCv().then(() => {
      if (!cancelled) setCvLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!cvLoaded) return;

    timerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || runningRef.current || video.readyState < 2) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;

      runningRef.current = true;
      const offscreen = document.createElement('canvas');
      offscreen.width  = Math.floor(w / 2); // half-res for speed
      offscreen.height = Math.floor(h / 2);
      const ctx = offscreen.getContext('2d');
      if (!ctx) { runningRef.current = false; return; }
      ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
      const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);

      // Run in a microtask so it doesn't block the frame
      Promise.resolve().then(() => {
        try {
          const pts = detectDocCorners(imageData);
          if (pts) {
            // Scale back to full video resolution
            const sx = w / offscreen.width;
            const sy = h / offscreen.height;
            setCorners(pts.map(p => ({ x: p.x * sx, y: p.y * sy })));
          } else {
            setCorners(null);
          }
        } finally {
          runningRef.current = false;
        }
      });
    }, 300);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cvLoaded, videoRef]);

  return { corners, cvLoaded };
}

// ── Perspective crop ──────────────────────────────────────────────────────────

export async function applyPerspectiveCrop(
  blob: Blob,
  corners: Point[],
): Promise<Blob> {
  const cv = (globalThis as any).cv;
  if (!cv || !cv.Mat || corners.length !== 4) return blob;

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width  = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  bitmap.close();

  const [tl, tr, br, bl] = corners;
  const wTop  = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const wBot  = Math.hypot(br.x - bl.x, br.y - bl.y);
  const hLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const hRight = Math.hypot(br.x - tr.x, br.y - tr.y);
  const dstW = Math.round(Math.max(wTop, wBot));
  const dstH = Math.round(Math.max(hLeft, hRight));

  const src = cv.matFromImageData(imageData);
  const dst = new cv.Mat();

  try {
    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y,
    ]);
    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0, dstW, 0, dstW, dstH, 0, dstH,
    ]);
    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    cv.warpPerspective(src, dst, M, new cv.Size(dstW, dstH));
    M.delete(); srcPts.delete(); dstPts.delete();

    const out = document.createElement('canvas');
    out.width  = dstW;
    out.height = dstH;
    cv.imshow(out, dst);

    return new Promise<Blob>((resolve, reject) => {
      out.toBlob(b => b ? resolve(b) : reject(new Error('Crop failed')), 'image/jpeg', 0.92);
    });
  } finally {
    src.delete(); dst.delete();
  }
}
