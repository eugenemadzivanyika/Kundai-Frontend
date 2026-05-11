import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, GripVertical, AlertCircle, Image as ImageIcon, Plus } from 'lucide-react';

export interface HandwritingFilePickerProps {
  onFilesSelected: (files: File[]) => void;
  onCancel: () => void;
}

export const HandwritingFilePicker: React.FC<HandwritingFilePickerProps> = ({
  onFilesSelected,
  onCancel,
}) => {
  const [files, setFiles]           = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [dropHighlight, setDropHighlight] = useState(false);
  const [dragIdx, setDragIdx]       = useState<number | null>(null);
  const [dragOver, setDragOver]     = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const accepted = incoming.filter(f => f.type.startsWith('image/'));
    if (!accepted.length) return;
    setFiles(prev => {
      const next = [...prev, ...accepted];
      setPreviews(ps => {
        const newPreviews = accepted.map(f => URL.createObjectURL(f));
        return [...ps, ...newPreviews];
      });
      return next;
    });
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropHighlight(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePageDrop = (targetIdx: number) => {
    if (dragIdx == null || dragIdx === targetIdx) {
      setDragIdx(null);
      setDragOver(null);
      return;
    }
    setFiles(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr;
    });
    setPreviews(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr;
    });
    setDragIdx(null);
    setDragOver(null);
  };

  const handleStart = () => {
    if (!files.length) return;
    onFilesSelected(files);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800">Upload Handwritten Submission</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Select image files (JPG / PNG). Drag to reorder pages before starting OCR.
          </p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      {/* Drop zone — only shown when no files selected yet */}
      {files.length === 0 && (
        <div
          className="mx-5 mt-4 flex-shrink-0 rounded-xl border-2 border-dashed transition-all duration-150 cursor-pointer flex flex-col items-center justify-center py-8 gap-3"
          style={{
            borderColor: dropHighlight ? '#3b82f6' : '#cbd5e1',
            background:  dropHighlight ? '#eff6ff' : '#fafafa',
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDropHighlight(true); }}
          onDragLeave={() => setDropHighlight(false)}
          onDrop={handleDrop}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Upload size={20} className="text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700">Drop images here or click to browse</p>
            <p className="text-[10px] text-slate-400 mt-0.5">PNG · JPG · Multiple files accepted</p>
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold text-white rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            <Upload size={12} /> Browse Files
          </button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInput}
      />

      {/* Preview grid — shown once files are added */}
      {files.length > 0 && (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {files.length} page{files.length !== 1 ? 's' : ''} — drag to reorder
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-blue-600 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Plus size={11} /> Add more images
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {files.map((file, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={e => { e.preventDefault(); setDragOver(idx); }}
                onDrop={e => { e.preventDefault(); handlePageDrop(idx); }}
                onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
                className="relative group rounded-lg overflow-hidden border transition-all"
                style={{
                  borderColor: dragOver === idx ? '#3b82f6' : '#e2e8f0',
                  outline: dragOver === idx ? '2px dashed #3b82f6' : undefined,
                  opacity: dragIdx === idx ? 0.5 : 1,
                }}
              >
                {/* Thumbnail — min 160×220 */}
                <div style={{ minHeight: 220, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {previews[idx] ? (
                    <img
                      src={previews[idx]}
                      alt={file.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 220, display: 'block' }}
                      draggable={false}
                    />
                  ) : (
                    <ImageIcon size={32} className="text-slate-300" />
                  )}
                </div>

                {/* Page badge */}
                <div className="absolute top-1.5 left-1.5 bg-slate-900/70 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {idx + 1}
                </div>

                {/* Drag handle */}
                <div className="absolute top-1.5 right-6 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                  <GripVertical size={14} className="drop-shadow" />
                </div>

                {/* Remove */}
                <button
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow"
                  onClick={e => { e.stopPropagation(); removeFile(idx); }}
                >
                  <X size={9} />
                </button>

                {/* Filename */}
                <div className="px-2 py-1.5 bg-white">
                  <p className="text-[9px] text-slate-500 truncate font-medium">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-slate-100 flex-shrink-0 flex items-center justify-between gap-3">
        {files.length === 0 ? (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
            <AlertCircle size={12} />
            Select at least one image to continue
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">
            {files.length} image{files.length !== 1 ? 's' : ''} ready
          </span>
        )}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={files.length === 0}
            onClick={handleStart}
            className="px-4 py-2 text-xs font-extrabold text-white rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Extract Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandwritingFilePicker;
