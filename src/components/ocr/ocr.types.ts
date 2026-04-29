// ── OCR Review — Types ────────────────────────────────────────────────────────

export interface OcrLine {
  text: string;
  confidence: number;
  correctedText?: string;
  error?: string;
}

export interface OcrRegion {
  id: string;
  label: string;
  colorIdx: number;
  /** % of image dimensions */
  bounds: { x: number; y: number; w: number; h: number };
  lines: OcrLine[];
  corrected: boolean;
  correctedText?: string;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

export interface DragState {
  regionId: string;
  mode: 'move' | 'resize';
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  startBounds: { x: number; y: number; w: number; h: number };
}

export interface OcrPage {
  id: string;
  name: string;
  imageUrl?: string;
  isPdf: boolean;
  status: 'pending' | 'processing' | 'done' | 'error';
  regions: OcrRegion[];
  /** Original file kept for retry; absent on backend-generated extra pages */
  sourceFile?: File;
  /** User-applied visual rotation in degrees */
  rotation: 0 | 90 | 180 | 270;
  /** Natural pixel dimensions captured on image load — used for rotation layout */
  naturalW?: number;
  naturalH?: number;
}

export interface CompiledSubmission {
  pages: OcrPage[];
  fullText: string;
}

export interface OcrReviewProps {
  mode: 'resource-upload' | 'teacher-mark' | 'student-submit';
  assessmentId?: string;
  studentId?: string;
  submissionId?: string;
  /** Files to begin processing immediately when the component opens */
  initialFiles?: File[];
  onSubmit?: (data: CompiledSubmission) => void | Promise<void>;
  onCancel?: () => void;
}

// ── Backend API types ──────────────────────────────────────────────────────────

export interface BackendOcrLine {
  text: string;
  confidence: number;
}

export interface BackendOcrRegion {
  id: string;
  label: string;
  colorIdx: number;
  bounds: { x: number; y: number; w: number; h: number };
  lines: BackendOcrLine[];
  corrected: boolean;
}

export interface BackendOcrPage {
  page_number: number;
  width: number;
  height: number;
  raw_markdown: string;
  regions: BackendOcrRegion[];
}