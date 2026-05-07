import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { adminService, BulkUploadResult, BulkUploadRowResult } from '../../../services/api';

interface BulkStudentUploadProps {
  onComplete: (succeeded: number) => void;
  onCancel: () => void;
}

interface ClientPreviewRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  form: string;
  classGroupCode: string;
  issues: string[];
}

type Phase = 'idle' | 'preview' | 'uploading' | 'done';
type ResultFilter = 'all' | 'success' | 'failed' | 'skipped';

const parseFileForPreview = async (f: File): Promise<ClientPreviewRow[]> => {
  const XLSX = await import('xlsx');
  const buf = await f.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

  return raw.slice(0, 50).map((row, i) => {
    const get = (key: string) =>
      String(row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()] ?? '').trim();

    const firstName = get('firstName');
    const lastName = get('lastName');
    const email = get('email');
    const studentId = get('studentId');
    const form = get('form');
    const classGroupCode = get('classGroupCode');

    const issues: string[] = [];
    if (!firstName) issues.push('Missing first name');
    if (!lastName) issues.push('Missing last name');
    if (!email) issues.push('Missing email');
    if (!studentId) issues.push('Missing student ID');
    if (!form) issues.push('Missing form');

    return { rowNumber: i + 1, firstName, lastName, email, studentId, form, classGroupCode, issues };
  });
};

const StatusPill: React.FC<{ status: BulkUploadRowResult['status'] }> = ({ status }) => {
  if (status === 'success') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> Success
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> Skipped
    </span>
  );
};

const BulkStudentUpload: React.FC<BulkStudentUploadProps> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [previewRows, setPreviewRows] = useState<ClientPreviewRow[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (f: File) => {
    setPreviewError(null);
    setUploadError(null);
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!['.xlsx', '.xls'].includes(ext)) {
      setPreviewError('Only .xlsx or .xls files are accepted.');
      return;
    }
    setFile(f);

    // Count total data rows for the upload button label
    try {
      const XLSX = await import('xlsx');
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setTotalRows(raw.length);
    } catch {
      setTotalRows(0);
    }

    try {
      const rows = await parseFileForPreview(f);
      setPreviewRows(rows);
      setPhase('preview');
    } catch {
      setPreviewError('Could not read the file. Make sure it is a valid Excel file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setPhase('uploading');
    setUploadError(null);
    try {
      const res = await adminService.bulkCreateStudents(file);
      setResult(res);
      setResultFilter('all');
      setPhase('done');
    } catch (err: any) {
      const message = err.message || 'Upload failed. Please try again.';
      setUploadError(message);
      setPhase('preview');
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await adminService.downloadBulkTemplate();
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to download template.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelected(f);
  };

  const resetToIdle = () => {
    setPhase('idle');
    setFile(null);
    setPreviewRows([]);
    setPreviewError(null);
    setUploadError(null);
    setResult(null);
    setTotalRows(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const btnBase = 'inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-60';

  // ── Idle ─────────────────────────────────────────────────────────────────
  if (phase === 'idle') return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-teal-600" />
          Bulk Student Upload
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center gap-3 hover:border-teal-400 hover:bg-teal-50/30 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-10 h-10 text-gray-300" />
        <p className="text-sm text-gray-600 font-medium">Drag & drop your Excel file here</p>
        <p className="text-xs text-gray-400">or</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className={`${btnBase} bg-teal-600 hover:bg-teal-700 text-white`}
        >
          Browse files
        </button>
        <p className="text-xs text-gray-400">Accepted: .xlsx, .xls</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }}
      />

      {previewError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {previewError}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          className={`${btnBase} border border-gray-300 bg-white hover:bg-gray-50 text-gray-700`}
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          Download Template
        </button>
        <button onClick={onCancel} className={`${btnBase} text-gray-500 hover:text-gray-700`}>
          Cancel
        </button>
      </div>
    </div>
  );

  // ── Preview ───────────────────────────────────────────────────────────────
  if (phase === 'preview') return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-teal-600" />
          Preview — {file?.name}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-500">
        {totalRows} row{totalRows !== 1 ? 's' : ''} detected.
        {totalRows > 50 && ' Showing first 50 rows below — all rows will be processed on upload.'}
      </p>

      {uploadError && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left border-b">
              <th className="py-2 px-3 font-medium w-10">Row</th>
              <th className="py-2 px-3 font-medium">First Name</th>
              <th className="py-2 px-3 font-medium">Last Name</th>
              <th className="py-2 px-3 font-medium">Email</th>
              <th className="py-2 px-3 font-medium">Student ID</th>
              <th className="py-2 px-3 font-medium w-12">Form</th>
              <th className="py-2 px-3 font-medium w-14">Class</th>
              <th className="py-2 px-3 font-medium">Issues</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => (
              <tr
                key={row.rowNumber}
                className={`border-b last:border-0 ${row.issues.length > 0 ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
              >
                <td className="py-1.5 px-3 text-gray-400">{row.rowNumber}</td>
                <td className="py-1.5 px-3">{row.firstName || <span className="text-gray-300">—</span>}</td>
                <td className="py-1.5 px-3">{row.lastName || <span className="text-gray-300">—</span>}</td>
                <td className="py-1.5 px-3 text-gray-600">{row.email || <span className="text-gray-300">—</span>}</td>
                <td className="py-1.5 px-3 font-mono">{row.studentId || <span className="text-gray-300">—</span>}</td>
                <td className="py-1.5 px-3 text-center">{row.form || <span className="text-gray-300">—</span>}</td>
                <td className="py-1.5 px-3 text-center">{row.classGroupCode || <span className="text-gray-300">—</span>}</td>
                <td className="py-1.5 px-3">
                  {row.issues.length > 0 && (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {row.issues.join('; ')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-1">
        <button onClick={resetToIdle} className={`${btnBase} border border-gray-300 bg-white hover:bg-gray-50 text-gray-700`}>
          ← Change File
        </button>
        <button
          onClick={handleUpload}
          className={`${btnBase} bg-teal-600 hover:bg-teal-700 text-white`}
        >
          <Upload className="w-4 h-4" />
          Upload {totalRows > 0 ? totalRows : previewRows.length} Student{(totalRows || previewRows.length) !== 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  );

  // ── Uploading ─────────────────────────────────────────────────────────────
  if (phase === 'uploading') return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      <p className="text-sm font-medium text-gray-700">Creating student accounts…</p>
      <p className="text-xs text-gray-400">This may take a moment for large files.</p>
    </div>
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  const summary = result!.summary;
  const filteredResults = result!.results.filter(
    (r) => resultFilter === 'all' || r.status === resultFilter
  );
  const tempPasswords = result!.results.filter((r) => r.temporaryPassword);

  const FILTER_TABS: { key: ResultFilter; label: string }[] = [
    { key: 'all', label: `All (${summary.total})` },
    { key: 'success', label: `Succeeded (${summary.succeeded})` },
    { key: 'failed', label: `Failed (${summary.failed})` },
    { key: 'skipped', label: `Skipped (${summary.skipped})` },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Upload Complete
        </h3>
      </div>

      {/* Summary banner */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-4 py-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{summary.succeeded} created</span>
        </div>
        {summary.failed > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-4 py-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{summary.failed} failed</span>
          </div>
        )}
        {summary.skipped > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-4 py-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{summary.skipped} skipped</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex border-b gap-0">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setResultFilter(t.key)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              resultFilter === t.key
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results table */}
      <div className="overflow-x-auto rounded-md border border-gray-200 max-h-72 overflow-y-auto">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr className="text-gray-600 text-left border-b">
              <th className="py-2 px-3 font-medium w-10">Row</th>
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Student ID</th>
              <th className="py-2 px-3 font-medium w-24">Status</th>
              <th className="py-2 px-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((r) => (
              <tr key={r.row} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-1.5 px-3 text-gray-400">{r.row}</td>
                <td className="py-1.5 px-3 font-medium">{r.name || '—'}</td>
                <td className="py-1.5 px-3 font-mono">{r.studentId || '—'}</td>
                <td className="py-1.5 px-3"><StatusPill status={r.status} /></td>
                <td className="py-1.5 px-3 text-gray-500">{r.error || ''}</td>
              </tr>
            ))}
            {filteredResults.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">No rows match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Temporary passwords */}
      {tempPasswords.length > 0 && (
        <details className="border border-gray-200 rounded-md">
          <summary className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 select-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
            Temporary Passwords ({tempPasswords.length} auto-generated)
          </summary>
          <div className="border-t overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-left border-b">
                  <th className="py-2 px-4 font-medium">Student ID</th>
                  <th className="py-2 px-4 font-medium">Name</th>
                  <th className="py-2 px-4 font-medium">Temporary Password</th>
                </tr>
              </thead>
              <tbody>
                {tempPasswords.map((r) => (
                  <tr key={r.row} className="border-b last:border-0">
                    <td className="py-1.5 px-4 font-mono">{r.studentId}</td>
                    <td className="py-1.5 px-4">{r.name}</td>
                    <td className="py-1.5 px-4 font-mono text-teal-700">{r.temporaryPassword}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
              Share these with students — they should change them on first login.
            </p>
          </div>
        </details>
      )}

      <div className="flex justify-between items-center pt-1">
        <button onClick={resetToIdle} className={`${btnBase} border border-gray-300 bg-white hover:bg-gray-50 text-gray-700`}>
          Upload Another File
        </button>
        <button
          onClick={() => onComplete(summary.succeeded)}
          className={`${btnBase} bg-teal-600 hover:bg-teal-700 text-white`}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default BulkStudentUpload;
