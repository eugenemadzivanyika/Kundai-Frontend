// ── OCR Review — OrderConfirmModal ────────────────────────────────────────────
//
// Shows thumbnails of the queued files so the user can:
//   • See a large preview of each page (image files render fully; PDFs show icon)
//   • Drag-and-drop to reorder
//   • Add more files
//   • Confirm to kick off OCR

import { useState, useRef, useEffect } from 'react';
import { X, Plus, ChevronRight, FileText, GripVertical, ZoomIn } from 'lucide-react';
import { uid } from './ocr.constants';

interface OrderItem {
  id: string;
  file: File;
  /** Object URL for images; empty string for PDFs */
  url: string;
}

interface OrderConfirmModalProps {
  initialFiles: File[];
  onConfirm: (ordered: File[]) => void;
  onCancel: () => void;
  onAddMore: () => void;
}

export function OrderConfirmModal({
  initialFiles,
  onConfirm,
  onCancel,
  onAddMore,
}: OrderConfirmModalProps) {
  const [items,    setItems]    = useState<OrderItem[]>([]);
  const [dragIdx,  setDragIdx]  = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  /** Index of the card being hovered for the large-preview lightbox */
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const addedKeysRef = useRef<Set<string>>(new Set());

  // Respond to initialFiles changing (e.g. when "Add more" appends new files)
  useEffect(() => {
    const newItems: OrderItem[] = [];
    initialFiles.forEach(f => {
      const key = `${f.name}__${f.size}__${f.lastModified}`;
      if (addedKeysRef.current.has(key)) return;
      addedKeysRef.current.add(key);
      newItems.push({
        id:  uid(),
        file: f,
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
      });
    });
    if (newItems.length > 0) setItems(prev => [...prev, ...newItems]);
  }, [initialFiles]);

  // Revoke URLs on unmount and clear tracking so a remount (React StrictMode)
  // can reprocess initialFiles without hitting stale keys.
  useEffect(() => {
    const keys = addedKeysRef.current;
    return () => {
      keys.clear();
      setItems(prev => {
        prev.forEach(it => it.url && URL.revokeObjectURL(it.url));
        return [];
      });
    };
  }, []);

  const handleDrop = (targetIdx: number) => {
    if (dragIdx == null || dragIdx === targetIdx) {
      setDragIdx(null); setDragOver(null); return;
    }
    setItems(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr;
    });
    setDragIdx(null); setDragOver(null);
  };

  const previewItem = previewIdx != null ? items[previewIdx] : null;

  return (
    <>
      {/* ── Main modal ──────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ width: 720, maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Confirm Page Order</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drag pages into the correct order · hover a page to preview it full-size
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>

          {/* Thumbnail grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
            >
              {items.map((item, i) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => { setDragIdx(i); setPreviewIdx(null); }}
                  onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); handleDrop(i); }}
                  onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
                  onMouseEnter={() => setPreviewIdx(i)}
                  onMouseLeave={() => setPreviewIdx(null)}
                  className="flex flex-col rounded-xl border-2 cursor-grab active:cursor-grabbing select-none transition-all duration-150 overflow-hidden bg-white group"
                  style={{
                    borderColor: dragOver === i ? '#3b82f6'
                               : dragIdx  === i ? '#93c5fd'
                               : previewIdx === i ? '#6366f1'
                               : '#e2e8f0',
                    opacity:   dragIdx === i ? 0.45 : 1,
                    transform: dragOver === i ? 'scale(1.04)' : 'scale(1)',
                    boxShadow: dragOver === i
                      ? '0 8px 24px rgba(59,130,246,0.25)'
                      : previewIdx === i
                      ? '0 4px 16px rgba(99,102,241,0.18)'
                      : '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Thumbnail — tall A4-ish ratio */}
                  <div
                    className="relative bg-slate-50 flex items-center justify-center overflow-hidden"
                    style={{ aspectRatio: '0.707' }}
                  >
                    {item.url ? (
                      <img
                        src={item.url}
                        className="w-full h-full object-cover"
                        draggable={false}
                        alt={item.file.name}
                      />
                    ) : (
                      /* PDF — show large icon + filename */
                      <div className="flex flex-col items-center gap-2 px-3 text-center">
                        <FileText size={32} className="text-slate-300" />
                        <span className="text-[9px] font-semibold text-slate-400 break-all leading-tight">
                          {item.file.name}
                        </span>
                      </div>
                    )}

                    {/* Page-number badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md">
                      {i + 1}
                    </div>

                    {/* Hover zoom hint */}
                    {item.url && (
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                        <ZoomIn
                          size={20}
                          className="text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow"
                        />
                      </div>
                    )}

                    {/* Drag handle overlay (subtle) */}
                    <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-60 transition-opacity">
                      <GripVertical size={14} className="text-slate-500" />
                    </div>
                  </div>

                  {/* File label */}
                  <div className="px-2.5 py-2 flex items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-700 truncate" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {item.file.type === 'application/pdf' ? 'PDF document' : 'Image'}
                        {' · '}
                        {(item.file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add more tile */}
              <button
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-slate-400 hover:text-indigo-500 gap-2 min-h-[180px]"
                style={{ aspectRatio: '0.85' }}
                onClick={onAddMore}
              >
                <div className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <span className="text-[10px] font-bold">Add more</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
            <p className="text-[10px] text-slate-400">
              {items.length} page{items.length !== 1 ? 's' : ''} · drag cards to reorder
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
                onClick={() => onConfirm(items.map(it => it.file))}
              >
                <ChevronRight size={13} />
                Extract Text
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Large-preview lightbox (image files only) ────────────────────────── */}
      {previewItem?.url && (
        <div
          className="fixed z-[60] pointer-events-none"
          style={{
            // Float to the right of the main modal so it doesn't obscure ordering
            right: 'calc(50% - 360px - 280px - 16px)',
            top:   '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white bg-white"
            style={{ width: 260 }}
          >
            {/* Preview header */}
            <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                Preview
              </span>
              <span className="text-[9px] text-slate-500 font-semibold truncate">
                Page {(previewIdx ?? 0) + 1} · {previewItem.file.name}
              </span>
            </div>
            <img
              src={previewItem.url}
              className="w-full object-contain"
              style={{ maxHeight: 460 }}
              alt="Page preview"
            />
          </div>
        </div>
      )}
    </>
  );
}