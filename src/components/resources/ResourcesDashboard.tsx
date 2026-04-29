import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResourcesView from './ResourcesView';
import CoverageView from './CoverageView';
import { AIAssessmentModal } from '../assessments/AIAssessmentModal';
import { resourceService, courseService, API_URL } from '../../services/api';
import type { SyllabusAttribute, LinkedFile } from './CoverageView';
import { LEGEND_ITEMS } from './CoverageView';

// ── SVG Icon helper ───────────────────────────────────────────────────────────
const Ico: React.FC<{ d: string | string[]; size?: number; color?: string; className?: string }> = ({
  d, size = 14, color = 'currentColor', className = ''
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }} className={className}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const I = {
  folder:   ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'],
  upload:   ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M17 8l-5-5-5 5','M12 3v12'],
  search:   ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z','M21 21l-4.35-4.35'],
  doc:      ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  img:      ['M21 15l-5-5L5 20','M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z','M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  video:    ['M23 7l-7 5 7 5V7z','M1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z'],
  file:     ['M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z','M13 2v7h7'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  bar:      ['M18 20V10','M12 20V4','M6 20v-6'],
  star:     ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  arrowL:   ['M19 12H5','M12 19l-7-7 7-7'],
  map:      ['M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z','M8 2v16','M16 6v16'],
  check:    ['M20 6L9 17l-5-5'],
  target:   ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2','M12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6','M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4'],
  x:        ['M18 6L6 18','M6 6l12 12'],
  award:    ['M12 15l-3.09 6.26L12 18.77l3.09 2.49L12 15z','M8.21 13.89L7 23l5-3 5 3-1.21-9.12','M12 2a7 7 0 1 0 0 14A7 7 0 0 0 12 2z'],
  link:     ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71','M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
};

const TYPE_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  document: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'DOC' },
  image:    { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'IMG' },
  video:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'VID' },
  other:    { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'FILE' },
};
const typeMeta = (t: string) => TYPE_META[t] || TYPE_META.other;
const typeIcon = (t: string) =>
  t === 'document' ? I.doc : t === 'image' ? I.img : t === 'video' ? I.video : I.file;

const fmtDate = (iso: string) => {
  const d = new Date(iso), now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// ── Type Definitions ──────────────────────────────────────────────────────────
export interface Course {
  _id: string;
  name: string;
  code?: string;
  resourceCount: number;
  lastUpdated: string;
  documents: number;
  images: number;
  videos: number;
  others: number;
}

export interface RecentUpload {
  _id: string;
  name: string;
  type: string;
  createdAt: string;
  course: { _id: string; name: string; code?: string };
  uploadedBy: { _id: string; firstName: string; lastName: string };
}

export interface Analytics {
  totalResources: number;
  averageDownloads: number;
  mostPopularResource: string;
  topClassEngagement: string;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: string[]; value: string | number; label: string; accent: string }> = ({
  icon, value, label, accent,
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: 'white', border: '1px solid #e2e8f0', borderRadius: 9,
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 7, background: accent + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Ico d={icon} size={13} color={accent} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

// ── Course Card ───────────────────────────────────────────────────────────────
const CourseCard: React.FC<{ course: Course; onClick: () => void; onUpload: () => void }> = ({
  course, onClick, onUpload,
}) => {
  const bars = [
    { label: 'Docs',   count: course.documents, color: '#2563eb' },
    { label: 'Imgs',   count: course.images,    color: '#7c3aed' },
    { label: 'Vids',   count: course.videos,    color: '#dc2626' },
    { label: 'Other',  count: course.others,    color: '#94a3b8' },
  ];
  const max = Math.max(...bars.map(b => b.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 11,
        padding: '12px', cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
      whileHover={{ borderColor: '#93c5fd', backgroundColor: '#f8fafc' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.name}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginTop: 1 }}>{course.code || '—'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#eff6ff', flexShrink: 0 }}>
          <Ico d={I.folder} size={13} color="#2563eb" />
        </div>
      </div>

      {/* File type mini-bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {bars.map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', width: 26, textAlign: 'right', textTransform: 'uppercase' }}>{b.label}</span>
            <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${b.count / max * 100}%`, background: b.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', width: 14, textAlign: 'left' }}>{b.count}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 20 }}>
          {course.resourceCount} files
        </span>
        <button
          onClick={e => { e.stopPropagation(); onUpload(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800,
            color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 6, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.05em',
            cursor: 'pointer',
          }}
        >
          <Ico d={I.upload} size={10} /> Upload
        </button>
      </div>
    </motion.div>
  );
};

// ── Upload Modal ──────────────────────────────────────────────────────────────
const UploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  selectedCourse: Course | null;
  courses: Course[];
  onCourseSelect: (course: Course) => void;
}> = ({ isOpen, onClose, onUploadSuccess, selectedCourse, courses, onCourseSelect }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selCourse, setSelCourse] = useState<Course | null>(selectedCourse);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { setSelCourse(selectedCourse); }, [selectedCourse]);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file || !selCourse) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', selCourse._id);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resources/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Upload failed (${response.status})`);
      }

      onCourseSelect(selCourse);
      setFile(null);
      onUploadSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 14, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={I.upload} size={14} color="#2563eb" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Upload Resource</span>
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', padding: 4, borderRadius: 6, border: 'none', background: 'none' }}>
            <Ico d={I.x} size={16} color="#94a3b8" />
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Course select */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Course *</label>
            <select
              value={selCourse?._id || ''}
              onChange={e => {
                const c = courses.find(c => c._id === e.target.value) || null;
                setSelCourse(c);
                if (c) onCourseSelect(c);
              }}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#0f172a', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}
            >
              <option value="">Select course…</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) { if (f.size > 50 * 1024 * 1024) { setError('File too large (max 50MB)'); return; } setFile(f); setError(null); } }}
            style={{
              border: `2px dashed ${dragging ? '#2563eb' : file ? '#22c55e' : '#e2e8f0'}`,
              borderRadius: 10, padding: '28px 20px', textAlign: 'center',
              background: dragging ? '#eff6ff' : file ? '#f0fdf4' : '#f8fafc',
              transition: 'all 0.15s', cursor: 'pointer',
            }}
          >
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Ico d={I.doc} size={28} color="#22c55e" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{file.name}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                  <button onClick={() => setFile(null)} style={{ color: '#ef4444', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Ico d={I.upload} size={28} color="#94a3b8" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  Drag & drop or{' '}
                  <label style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}>
                    browse
                    <input type="file" style={{ display: 'none' }} onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { if (f.size > 50 * 1024 * 1024) { setError('File too large (max 50MB)'); return; } setFile(f); setError(null); }
                    }} />
                  </label>
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>PDF, DOCX, PNG, JPG, MP4 — max 50 MB</span>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#fafafa' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white',
            fontSize: 12, fontWeight: 700, color: '#64748b', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={handleUpload}
            disabled={!file || !selCourse || isUploading}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: !file || !selCourse || isUploading ? '#cbd5e1' : '#2563eb',
              fontSize: 12, fontWeight: 800, color: 'white', cursor: !file || !selCourse || isUploading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Ico d={I.upload} size={12} color="white" />
            {isUploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const ResourcesDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [selectedClass, setSelectedClass] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<'courses' | 'coverage'>('courses');
  const [analytics, setAnalytics] = useState<Analytics>({
    totalResources: 0, averageDownloads: 0, mostPopularResource: 'N/A', topClassEngagement: 'N/A',
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState<Course | null>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedCourseIdForAssessment, setSelectedCourseIdForAssessment] = useState<string | null>(null);

  // Coverage tab data
  const [syllabus, setSyllabus] = useState<Record<string, SyllabusAttribute[]>>({});
  const [filesByCourse, setFilesByCourse] = useState<Record<string, LinkedFile[]>>({});
  const [coverageSelCourseId, setCoverageSelCourseId] = useState<string>('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [teachingCourses, countsData, recentRes] = await Promise.all([
        courseService.getTeachingCourses(),
        resourceService.getResourceCounts(),
        resourceService.getRecentUploads(5),
      ]);
      const updatedCourses = teachingCourses.map((course: any) => {
        const stats = countsData[course._id] || {};
        return { ...course, resourceCount: stats.count || 0, lastUpdated: stats.lastUpdated || '', documents: stats.documents || 0, images: stats.images || 0, videos: stats.videos || 0, others: stats.others || 0 };
      });
      setCourses(updatedCourses);
      setRecentUploads(recentRes);
      // Initialise coverage course selector to first course
      setCoverageSelCourseId(prev => prev || updatedCourses[0]?._id || '');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Fetch syllabus + files for coverage tab when it becomes active
  useEffect(() => {
    if (mainTab !== 'coverage' || courses.length === 0) return;
    const fetchCoverageData = async () => {
      try {
        // resourceService.getSyllabus(courseId) → SyllabusAttribute[]
        // resourceService.getFilesByCourse(courseId) → LinkedFile[]
        const [syllabusResults, filesResults] = await Promise.all([
          Promise.all(courses.map(c => resourceService.getSyllabus(c._id).then((attrs: SyllabusAttribute[]) => [c._id, attrs] as const))),
          Promise.all(courses.map(c => resourceService.getFilesByCourse(c._id).then((files: LinkedFile[]) => [c._id, files] as const))),
        ]);
        setSyllabus(Object.fromEntries(syllabusResults));
        setFilesByCourse(Object.fromEntries(filesResults));
      } catch (error) {
        console.error('Error fetching coverage data:', error);
      }
    };
    fetchCoverageData();
  }, [mainTab, courses]);

  useMemo(() => {
    if (courses.length === 0) return;
    const totalResources = courses.reduce((sum, course) => sum + course.resourceCount, 0);
    const topClass = courses.reduce((prev, current) => prev.resourceCount > current.resourceCount ? prev : current, courses[0]);
    setAnalytics({ totalResources, averageDownloads: 0, mostPopularResource: 'N/A', topClassEngagement: topClass?.name || 'N/A' });
  }, [courses]);

  const handleClassNavigation = (classId: string) => {
    const courseToNavigate = courses.find(c => c._id === classId);
    if (courseToNavigate) setSelectedClass(courseToNavigate);
  };

  const handleUploadClick = (course?: Course) => {
    setSelectedCourseForUpload(course || null);
    setShowUploadModal(true);
  };

  const handleFileUploadSuccess = () => {
    setShowUploadModal(false);
    fetchDashboardData();
  };

  const handleCreateAssignment = (courseId: string) => {
    setSelectedCourseIdForAssessment(courseId);
    setIsAssessmentModalOpen(true);
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.code && course.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Totals for the "by type" section
  const totalDocs   = courses.reduce((a, c) => a + c.documents, 0);
  const totalImgs   = courses.reduce((a, c) => a + c.images, 0);
  const totalVids   = courses.reduce((a, c) => a + c.videos, 0);
  const totalAll    = analytics.totalResources || 1;

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Loading Resources…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <ResourcesView
        classId={selectedClass._id}
        className={selectedClass.name}
        classCode={selectedClass.code}
        onBack={() => setSelectedClass(null)}
        onUploadClick={() => handleUploadClick(selectedClass)}
        onUploadSuccess={fetchDashboardData}
      />
    );
  }

  return (
    <div style={{
      height: 'calc(100vh - 160px)', display: 'flex', background: '#f8fafc',
      borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rd-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .rd-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .rd-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .rd-hover-row:hover { background: #eff6ff !important; }
        .rd-upload-btn:hover { background: #1d4ed8 !important; }
        .rd-action-btn:hover { background: #f1f5f9 !important; }
      `}</style>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden' }}>
        {/* Brand */}
        <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={I.folder} size={14} color="#2563eb" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Resources</span>
          </div>
        </div>

        {/* Upload CTA */}
        <div style={{ padding: '10px 12px', flexShrink: 0 }}>
          <button
            onClick={() => handleUploadClick()}
            className="rd-upload-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 9,
              fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
              transition: 'background 0.15s', cursor: 'pointer',
            }}
          >
            <Ico d={I.upload} size={13} color="white" /> Upload Resource
          </button>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 10px 4px', flexShrink: 0 }}>
          {[
            { label: 'Create Assignment', icon: I.check,  onClick: () => handleCreateAssignment(courses[0]?._id) },
            { label: 'Mark Assignment',   icon: I.award,  onClick: () => {} },
            { label: 'Dev Plans',         icon: I.target, onClick: () => {} },
          ].map(({ label, icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="rd-action-btn"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 8px', borderRadius: 8, border: 'none', background: 'none',
                fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.12s',
              }}
            >
              <Ico d={icon} size={13} color="#64748b" /> {label}
            </button>
          ))}
        </div>

        {/* Recent uploads */}
        <div className="rd-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
          <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent Uploads</div>
          {recentUploads.length === 0 && (
            <p style={{ padding: '4px 14px', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>No uploads yet.</p>
          )}
          {recentUploads.slice(0, 5).map(r => {
            const m = typeMeta(r.type);
            return (
              <div key={r._id} style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f8fafc' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ico d={typeIcon(r.type)} size={12} color={m.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 1 }}>{r.course.code || r.course.name} · {fmtDate(r.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header with tabs */}
        <div style={{ padding: '0 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'stretch', background: 'white', flexShrink: 0, minHeight: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16, borderRight: '1px solid #e2e8f0', marginRight: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Resources</span>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{courses.length} courses · {analytics.totalResources} files</span>
          </div>

          {/* Tab buttons */}
          {([
            { key: 'courses',  label: 'Courses',  icon: I.folder },
            { key: 'coverage', label: 'Coverage', icon: I.map },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => { setMainTab(t.key); setSelectedClass(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
                border: 'none', borderBottom: `2.5px solid ${mainTab === t.key ? '#2563eb' : 'transparent'}`,
                background: 'none', color: mainTab === t.key ? '#2563eb' : '#64748b',
                fontSize: 12, fontWeight: mainTab === t.key ? 700 : 500, cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              <Ico d={t.icon} size={13} color={mainTab === t.key ? '#2563eb' : '#94a3b8'} />
              {t.label}
            </button>
          ))}

          {/* Search in header — courses tab only */}
          {mainTab === 'courses' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Ico d={I.search} size={12} color="#94a3b8" />
                </div>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  style={{ padding: '5px 10px 5px 28px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#0f172a', width: 180, background: '#f8fafc', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Coverage controls — coverage tab only, inline in the same header row */}
          {mainTab === 'coverage' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Course selector */}
              <select
                value={coverageSelCourseId}
                onChange={e => setCoverageSelCourseId(e.target.value)}
                style={{ padding: '4px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#0f172a', fontFamily: 'inherit', background: 'white', cursor: 'pointer', outline: 'none' }}
              >
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
              </select>

              {/* Coverage progress bar */}
              {(() => {
                const attrs = syllabus[coverageSelCourseId] || [];
                if (!attrs.length) return null;
                const covered = attrs.filter(a => a.resources > 0).length;
                const pct = Math.round(covered / attrs.length * 100);
                const col = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 220 }}>
                    <div style={{ width: 100, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: col, whiteSpace: 'nowrap' }}>
                      {covered}/{attrs.length} ({pct}%)
                    </span>
                  </div>
                );
              })()}

              {/* Legend */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: 10 }}>
                {LEGEND_ITEMS.map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: mainTab === 'coverage' ? 'column' : 'row', overflow: 'hidden', minHeight: 0 }}>

          {mainTab === 'coverage' ? (
            <CoverageView
              courses={courses}
              selCourseId={coverageSelCourseId}
              onCourseChange={setCoverageSelCourseId}
              syllabus={syllabus}
              filesByCourse={filesByCourse}
              onUpload={(course) => handleUploadClick(course as Course)}
            />
          ) : (
            <>
              {/* Course grid */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <div className="rd-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {filteredCourses.map(c => (
                      <CourseCard
                        key={c._id}
                        course={c}
                        onClick={() => handleClassNavigation(c._id)}
                        onUpload={() => handleUploadClick(c)}
                      />
                    ))}
                    {filteredCourses.length === 0 && (
                      <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                        No courses match your search.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT analytics panel */}
              <div className="rd-scrollbar" style={{ width: 190, flexShrink: 0, borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', background: 'white' }}>
                {/* Analytics */}
                <div style={{ padding: '12px 14px 6px', fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Analytics</div>
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <StatCard icon={I.folder}   value={analytics.totalResources}       label="Total Files"    accent="#2563eb" />
                  <StatCard icon={I.download} value={analytics.averageDownloads}     label="Downloads"      accent="#16a34a" />
                  <StatCard icon={I.link}     value={analytics.mostPopularResource}  label="Most Popular"   accent="#d97706" />
                  <StatCard icon={I.star}     value={analytics.topClassEngagement}   label="Top Class"      accent="#7c3aed" />
                </div>

                {/* Quick Access */}
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 14px 6px', fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick Access</div>
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {courses.slice(0, 6).map(c => (
                    <button
                      key={c._id}
                      onClick={() => handleClassNavigation(c._id)}
                      className="rd-hover-row"
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px',
                        borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer',
                        textAlign: 'left', transition: 'background 0.1s',
                      }}
                    >
                      <Ico d={I.folder} size={12} color="#f59e0b" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>{c.resourceCount}</span>
                    </button>
                  ))}
                </div>

                {/* By Type */}
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 14px 6px', fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>By Type</div>
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {([['Documents', totalDocs, '#2563eb'], ['Images', totalImgs, '#7c3aed'], ['Videos', totalVids, '#dc2626']] as const).map(([type, count, color]) => {
                    const pct = totalAll > 0 ? count / totalAll * 100 : 0;
                    return (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>{type}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUploadSuccess={handleFileUploadSuccess}
            selectedCourse={selectedCourseForUpload}
            courses={courses}
            onCourseSelect={setSelectedCourseForUpload}
          />
        )}
      </AnimatePresence>

      {selectedCourseIdForAssessment && (
        <AIAssessmentModal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          courseId={selectedCourseIdForAssessment}
          onAssessmentCreated={() => {}}
        />
      )}
    </div>
  );
};

export default ResourcesDashboard;