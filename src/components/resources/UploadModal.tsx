import React, { useCallback, useState, useRef } from 'react';

// ── Inline SVG helper ─────────────────────────────────────────────────────────
const Ico: React.FC<{ d: string | string[]; size?: number; color?: string }> = ({ d, size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const I = {
  upload:  ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M17 8l-5-5-5 5','M12 3v12'],
  doc:     ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6'],
  folder:  ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'],
  x:       ['M18 6L6 18','M6 6l12 12'],
  check:   ['M20 6L9 17l-5-5'],
  alert:   ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
};

interface Course {
  _id: string;
  id?: string;
  name: string;
  code?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  selectedCourse: Course | null;
  courses: Course[];
  onCourseSelect: (course: Course) => void;
  onFileSelect?: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen, onClose, onUploadSuccess, selectedCourse, courses, onCourseSelect, onFileSelect, isUploading = false, uploadProgress = 0,
}) => {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selCourse, setSelCourse] = useState<Course | null>(selectedCourse);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { setSelCourse(selectedCourse); }, [selectedCourse]);

  const validateFile = (file: File) => {
    if (file.size > 50 * 1024 * 1024) { setError('File size must be less than 50MB'); return false; }
    setError(null);
    return true;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragging(true);
    else setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) setSelectedFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !selCourse) return;
    try {
      if (onFileSelect) onFileSelect(selectedFile);
      setSelectedFile(null); setError(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch {
      setError('Failed to upload file. Please try again.');
    }
  };

  const handleClose = () => { setSelectedFile(null); setError(null); onClose(); };

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 14, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', animation: 'rd-fade-up 0.15s ease' }}
      >
        <style>{`@keyframes rd-fade-up { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={I.upload} size={14} color="#2563eb" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Upload Resource</span>
          </div>
          <button onClick={handleClose} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', display: 'flex' }}>
            <Ico d={I.x} size={16} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Course selector */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Course <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selCourse?._id || ''}
              onChange={e => {
                const c = courses.find(c => c._id === e.target.value) || null;
                setSelCourse(c); if (c) onCourseSelect(c);
              }}
              disabled={isUploading}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#0f172a', fontFamily: 'inherit', background: 'white', cursor: 'pointer', outline: 'none' }}
            >
              <option value="">Select course…</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#2563eb' : '#e2e8f0'}`, borderRadius: 10,
                padding: '28px 20px', textAlign: 'center',
                background: dragging ? '#eff6ff' : '#f8fafc',
                transition: 'all 0.15s', cursor: 'pointer',
              }}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} disabled={isUploading}
                onChange={e => { const f = e.target.files?.[0]; if (f && validateFile(f)) setSelectedFile(f); }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Ico d={I.upload} size={28} color={dragging ? '#2563eb' : '#94a3b8'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  Drag & drop or{' '}
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>browse</span>
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>PDF, DOCX, PNG, JPG, MP4 — max 50 MB</span>
              </div>
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Ico d={I.doc} size={24} color="#22c55e" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button onClick={() => setSelectedFile(null)} style={{ color: '#ef4444', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>Remove</button>
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#2563eb', borderRadius: 99, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
              <Ico d={I.alert} size={14} color="#dc2626" />
              <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            {selectedFile && selCourse ? (
              <><Ico d={I.check} size={13} color="#22c55e" /> Ready to upload to {selCourse.code || selCourse.name}</>
            ) : 'Select a course and file to continue'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleClose}
              disabled={isUploading}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 12, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !selCourse || isUploading}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: !selectedFile || !selCourse || isUploading ? '#cbd5e1' : '#2563eb',
                fontSize: 12, fontWeight: 800, color: 'white',
                cursor: !selectedFile || !selCourse || isUploading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
              }}
            >
              <Ico d={I.upload} size={12} color="white" />
              {isUploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;