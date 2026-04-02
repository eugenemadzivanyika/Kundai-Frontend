import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Label } from '@/components/ui/label';
import {
  FileText,
  ClipboardList,
  PenLine,
  CheckSquare,
  Hash,
  Upload,
  X,
} from 'lucide-react';
import { AssessmentType } from '@/types';

interface BasicInfoStepProps {
  formData: {
    type: AssessmentType;
    questionCount: number;
  };
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTypeChange: (value: string) => void;
}

const ASSESSMENT_TYPES: {
  value: AssessmentType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'Exercise',       label: 'Exercise',       icon: <CheckSquare className="w-3 h-3" /> },
  { value: 'Test',       label: 'Test',       icon: <ClipboardList className="w-3 h-3" /> },
  { value: 'Homework', label: 'Homework', icon: <PenLine className="w-3 h-3" /> },
  { value: 'Exam',       label: 'Exam',       icon: <FileText className="w-3 h-3" /> },
];

export function BasicInfoStep({
  formData,
  uploadedFile,
  setUploadedFile,
  onChange,
  onTypeChange,
}: BasicInfoStepProps) {
  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setUploadedFile(files[0]);
  }, [setUploadedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  });

  const stepCount = (delta: number) => {
    const next = Math.min(50, Math.max(1, formData.questionCount + delta));
    onChange({ target: { name: 'questionCount', value: String(next) } } as any);
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">

      {/* ── LEFT: Assessment type + question count ── */}
      <div className="flex flex-col gap-5">

        {/* Type grid */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assessment Type</Label>
          <div className="grid grid-cols-2 gap-4">
            {ASSESSMENT_TYPES.map(({ value, label, icon }) => {
              const sel = formData.type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onTypeChange(value)}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 py-2 rounded-xl border-2
                    transition-all duration-150 focus:outline-none
                    ${sel
                      ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_3px_rgba(59,130,246,0.10)]'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className={`${sel ? 'text-blue-600' : 'text-gray-400'} transition-colors`}>
                    {icon}
                  </span>
                  <span className={`text-xs font-bold ${sel ? 'text-blue-700' : 'text-gray-600'}`}>
                    {label}
                  </span>
                  {sel && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question count */}
        <div className="space-y-2.5">
          <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <Hash className="w-3 h-3" /> Number of Questions
          </Label>
          <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => stepCount(-1)}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-1xl font-black text-gray-900">{formData.questionCount}</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Items</p>
              </div>
              <button
                type="button"
                onClick={() => stepCount(1)}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
              >
                +
              </button>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={formData.questionCount}
              onChange={(e) => onChange({ target: { name: 'questionCount', value: e.target.value } } as any)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-100"
            />
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              <span>1 min</span>
              <span>50 max</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: File upload ── */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Reference Document <span className="text-gray-400 normal-case font-normal">(optional)</span>
        </Label>

        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`
              flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
              cursor-pointer transition-all duration-150
              ${isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }
            `}
            style={{ minHeight: '100%' }}
          >
            <input {...getInputProps()} />
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDragActive ? 'bg-blue-100' : 'bg-white border border-gray-200'}`}>
              <Upload className={`w-6 h-6 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-gray-700">
                {isDragActive ? 'Drop it here' : 'Upload a reference doc'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">PDF or TXT · max 10 MB</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-blue-900 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-blue-500 mt-0.5">
                  {(uploadedFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="shrink-0 p-1.5 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Re-upload prompt */}
            <div
              {...getRootProps()}
              className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input {...getInputProps()} />
              <Upload className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">Replace file</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}