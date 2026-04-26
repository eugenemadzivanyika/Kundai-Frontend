import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  LogOut,
  BarChart2,
  FileText,
  User,
  CheckCircle2,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Flame,
  Settings,
  Menu,
  X,
  Bell,
  CalendarClock,
  AlertTriangle,
  TrendingUp,
  MessageCircle,
  Brain,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Student, DevelopmentPlan, Course } from '../../types';
// Some copied components expect a Subject type with `id` property — normalize locally
type Subject = Course & { id: string };
import {
  studentService,
  developmentService,
  courseService,
  calendarService,
  notificationService,
  authService,
} from '../../services/api';
import { StudentTeacher } from '../../services/studentService';
import StudentPlanView from '../student v1.2/StudentPlanView';
import StudentAssignments from '../student v1.2/StudentAssignments';
import StudentReportCard from '../student v1.2/StudentReportCard';
import StudentPeerStudy from '../student v1.2/StudentPeerStudy';
import StudentProfileSettings from '../student v1.2/StudentProfileSettings';
import StudentSubjectsView from '../student v1.2/StudentSubjectsView';
import StudentStats from '../student v1.2/StudentStats';
import StudentMessages from '../student v1.2/StudentMessages';
import StudentTutor from '../student v1.2/StudentTutor';
import StudentMasteryGaps from '../student v1.2/StudentMasteryGaps';
import { HomePanelKey, HomeProgressRow, NavItemKey } from '../student v1.2/dashboard/types';
import { getStepIcon } from '../student v1.2/dashboard/icons';
import {
  buildHomeProgressRows,
  filterHomeProgressRows,
  formatProgressDate,
  getProgressExerciseMinutes,
  getProgressTotalLearningMinutes,
} from '../student v1.2/dashboard/progress';
import HomeTeachersPanel from '../student v1.2/dashboard/HomeTeachersPanel';
import { reportService, StudentReportCardResponse } from '../../services/reportService';
import { NotificationItem } from '../../services/notificationService';
import { CalendarEvent } from '../../types/calendar';
import { MasterySignalsSummary, StudentStreakSummary } from '../../services/developmentService';
import { getActiveAuthToken } from '../../services/authSession';

// ─── Routing lookup ───────────────────────────────────────────────────────────

type StudentRouteViewKey = Exclude<NavItemKey, 'messages'>;

const STUDENT_VIEW_PATHS: Record<StudentRouteViewKey, string> = {
  overview:     '/student/home',
  plan:         '/student/my-plans',
  subjects:     '/student/my-subjects',
  assessments:  '/student/assessments',
  results:      '/student/my-report',
  tutor:        '/student/ai-coach',
  'peer-study': '/student/peer-study',
  profile:      '/student/profile',
  stats:        '/student/stats',
  mastery:      '/student/mastery',
};

const STUDENT_PATH_VIEW_LOOKUP = Object.entries(STUDENT_VIEW_PATHS).reduce<Record<string, StudentRouteViewKey>>(
  (acc, [view, path]) => { acc[path] = view as StudentRouteViewKey; return acc; },
  {}
);

const normalizeStudentPath = (pathname: string) => pathname.replace(/\/+$/, '') || '/';
const getRouteViewFromPathname = (pathname: string): StudentRouteViewKey | null =>
  STUDENT_PATH_VIEW_LOOKUP[normalizeStudentPath(pathname)] ?? null;
const isRoutableStudentView = (view: NavItemKey): view is StudentRouteViewKey =>
  Object.prototype.hasOwnProperty.call(STUDENT_VIEW_PATHS, view);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50/80">
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="h-8 w-44 rounded-md bg-slate-200 animate-pulse" />
        <div className="h-10 w-48 rounded-md bg-slate-200 animate-pulse" />
      </div>
      <div className="border-t border-slate-200 bg-slate-50/70">
        <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center gap-3">
          <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-md bg-slate-200 animate-pulse shrink-0" />
            ))}
          </div>
          <div className="h-9 w-52 rounded-lg bg-slate-200 animate-pulse hidden md:block" />
        </div>
      </div>
    </header>
    <main className="w-full py-4">
      <div className="max-w-[1400px] mx-auto px-4 space-y-3">
        <section className="w-full border-y border-orange-100 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="h-6 w-72 rounded-md bg-orange-100 animate-pulse" />
              <div className="h-10 w-72 rounded-md bg-orange-100 animate-pulse" />
            </div>
          </div>
        </section>
        <section className="bg-white overflow-hidden border border-slate-200 rounded-xl">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[640px]">
            <aside className="hidden lg:block border-r border-slate-200 p-5 space-y-4">
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
              <div className="h-10 w-full rounded-md bg-slate-200 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse mt-6" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 w-full rounded-md bg-slate-200 animate-pulse" />
                ))}
              </div>
            </aside>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 xl:gap-x-10 gap-y-8 xl:gap-y-10">
                {Array.from({ length: 2 }).map((_, ci) => (
                  <article key={ci} className="space-y-4">
                    <div className="h-7 w-44 rounded-md bg-slate-200 animate-pulse" />
                    <div className="border-t border-slate-200 pt-4 space-y-4">
                      {Array.from({ length: 4 }).map((__, ri) => (
                        <div key={ri} className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0 flex-1 pr-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
                              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
                            </div>
                          </div>
                          {ri === 1 && <div className="h-8 w-20 rounded-md bg-slate-200 animate-pulse shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialRouteView = getRouteViewFromPathname(location.pathname) || 'overview';

  // Core data
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Course[]>([]);
  const [subjectPlans, setSubjectPlans] = useState<DevelopmentPlan[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [activePlan, setActivePlan] = useState<DevelopmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<NavItemKey>(initialRouteView);

  // Home panel
  const [homePanel, setHomePanel] = useState<HomePanelKey>('subjects');
  const [homeProgressPage, setHomeProgressPage] = useState(1);
  const [progressWindow, setProgressWindow] = useState<'week' | 'month' | 'all'>('week');
  const [progressContentFilter, setProgressContentFilter] = useState<string>('all');
  const [progressActivityFilter, setProgressActivityFilter] = useState<'all' | 'learn' | 'practice'>('all');

  // Teachers
  const [teachers, setTeachers] = useState<StudentTeacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  // Report card
  const [studentReportCard, setStudentReportCard] = useState<StudentReportCardResponse | null>(null);
  const [isResultsSidebarCollapsed, setIsResultsSidebarCollapsed] = useState(false);

  // Live data
  const [homeNotifications, setHomeNotifications] = useState<NotificationItem[]>([]);
  const [homeUnreadNotificationCount, setHomeUnreadNotificationCount] = useState(0);
  const [homeUpcomingEvents, setHomeUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [homeSubjectEvents, setHomeSubjectEvents] = useState<CalendarEvent[]>([]);
  const [homeMasterySignals, setHomeMasterySignals] = useState<MasterySignalsSummary | null>(null);
  const [homeLiveLoading, setHomeLiveLoading] = useState(false);
  const [homeLiveError, setHomeLiveError] = useState<string | null>(null);
  const [homeStreakSummary, setHomeStreakSummary] = useState<StudentStreakSummary | null>(null);
  const [homeMasterySubjectIndex, setHomeMasterySubjectIndex] = useState(0);

  // UI
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [loadingTargetView, setLoadingTargetView] = useState<NavItemKey>(initialRouteView);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [planEntryStepIndex, setPlanEntryStepIndex] = useState<number | null>(null);

  // Tutor prefill
  const [tutorPrefillMessage, setTutorPrefillMessage] = useState<string | undefined>(undefined);

  const { selectedCourse, setSelectedCourse } = useAuth();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const viewSwitchTimerRef = useRef<number | null>(null);
  const hasInitializedDefaultSubjectRef = useRef(false);
  const lastProcessedPathnameRef = useRef('');
  const [activeMissionResource, setActiveMissionResource] = useState<any | null>(null);
  const [isMissionOverlayOpen, setIsMissionOverlayOpen] = useState(false);

  const handleOpenMission = async (resourceLink: string) => {
    const resourceId = resourceLink.split('/').pop();
    try {
      const data = await developmentService.getAIResourceById(resourceId!);
      setActiveMissionResource(data);
      setIsMissionOverlayOpen(true);
    } catch (err) {
      toast.error("Could not load mission content.");
    }
};

  // ── Avatar ──────────────────────────────────────────────────────────────────

  const avatarGradients = [
    'from-indigo-500 to-sky-500',
    'from-rose-500 to-amber-500',
    'from-emerald-500 to-teal-500',
    'from-purple-500 to-pink-500',
    'from-blue-600 to-cyan-500',
    'from-orange-500 to-yellow-400',
  ];

  const avatarInitials = useMemo(() => {
    if (!student) return 'S';
    const first = student.firstName?.[0] || '';
    const last = student.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'S';
  }, [student]);

  const avatarGradient = useMemo(() => {
    if (!student) return avatarGradients[0];
    const seed = `${student.id || ''}${student.firstName || ''}${student.lastName || ''}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
    return avatarGradients[hash % avatarGradients.length];
  }, [student]);

  const notificationRecipientId = useMemo(() => {
    const currentUser = authService.getCurrentUser() as any;
    const candidate = currentUser?.id;
    return candidate ? String(candidate) : undefined;
  }, []);

  // ── Plan/subject memos ──────────────────────────────────────────────────────

 // Inside StudentDashboard component
const realPlanBySubjectId = useMemo(() => {
  const map = new Map<string, DevelopmentPlan>();
  
  console.log("🚀 [Dashboard] Mapping Subject Plans:", subjectPlans);

  subjectPlans.forEach((p: any) => {
    // FIXED: Access the course ID from the root 'course' property
    // It might be a string ID or a populated object with _id
    const sid = typeof p.course === 'object' ? p.course._id : p.course;
    
    if (!sid) return;

    const cur = map.get(sid);
    if (!cur) {
      map.set(sid, p);
      return;
    }

    // Keep the most recent plan for that subject
    const curTime = new Date(cur.updatedAt || 0).getTime();
    const newTime = new Date(p.updatedAt || 0).getTime();
    if (newTime >= curTime) {
      map.set(sid, p);
    }
  });
  return map;
}, [subjectPlans]);

  const displaySubjects = useMemo(() => subjects, [subjects]);

  const defaultSubjectId = useMemo(() => {
    if (displaySubjects.length === 0) return 'all';
    const math = displaySubjects.find((s) => {
      const name = String(s.name || '').toLowerCase();
      const code = String(s.code || '').toLowerCase();
      return name.includes('mathematics') || name === 'math' || name.includes('math') || code === 'math' || code.startsWith('math');
    });
    return math?.id || displaySubjects[0]?.id || 'all';
  }, [displaySubjects]);

  const displayPlanBySubjectId = useMemo<Map<string, DevelopmentPlan | null>>(() => {
    const m = new Map<string, DevelopmentPlan | null>();
    displaySubjects.forEach((s) => m.set(s.id, realPlanBySubjectId.get(s.id) || null));
    return m;
  }, [displaySubjects, realPlanBySubjectId]);

  const overviewSubjects = useMemo(
    () => displaySubjects.map((s) => ({ subject: s, plan: displayPlanBySubjectId.get(s.id) || null })),
    [displaySubjects, displayPlanBySubjectId]
  );

  // ── Report card rows ────────────────────────────────────────────────────────

  const getGradeFromPercent = (pct: number) => {
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'E';
  };

  const reportCardRows = useMemo(() => {
    const byId = new Map(displaySubjects.map((s) => [s.id, s]));
    return (studentReportCard?.subjects || []).map((row) => {
      const meta = byId.get(row.subjectId);
      const mp = Math.max(0, Math.min(100, Math.round(row.masteryPercent || 0)));
      const cg = String(row.currentGrade || '').trim();
      const pg = String(row.predictedZimsecGrade || '').trim();
      return {
        subjectId: row.subjectId,
        subjectCode: String(row.subjectCode || meta?.code || '-'),
        subjectName: String(row.subjectName || meta?.name || 'Subject'),
        masteryPercent: mp,
        currentGrade: cg || getGradeFromPercent(mp),
        predictedZimsecGrade: pg || cg || getGradeFromPercent(mp),
      };
    });
  }, [displaySubjects, studentReportCard]);

  const homeMasteryBySubject = useMemo(
    () =>
      reportCardRows
        .map((r) => ({ subjectId: r.subjectId, subjectName: r.subjectName, masteryPercent: Number.isFinite(r.masteryPercent) ? r.masteryPercent : 0, currentGrade: r.currentGrade }))
        .sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
    [reportCardRows]
  );

  const activeHomeMasterySubject =
    homeMasteryBySubject.length > 0 ? homeMasteryBySubject[homeMasterySubjectIndex % homeMasteryBySubject.length] : null;

  // ── Progress rows ───────────────────────────────────────────────────────────

  const homeProgressRows = useMemo<HomeProgressRow[]>(() => buildHomeProgressRows(overviewSubjects), [overviewSubjects]);

  const streakWeeks = homeStreakSummary?.streakWeeks ?? 0;
  const streakLevel = homeStreakSummary?.level ?? 1;
  const streakProgressPercent = homeStreakSummary?.progressToNextWeek ?? 0;

  const filteredHomeProgressRows = useMemo(
    () => filterHomeProgressRows(homeProgressRows, progressWindow, progressContentFilter, progressActivityFilter),
    [homeProgressRows, progressWindow, progressContentFilter, progressActivityFilter]
  );

  const progressExerciseMinutes = useMemo(() => getProgressExerciseMinutes(filteredHomeProgressRows), [filteredHomeProgressRows]);
  const progressTotalLearningMinutes = useMemo(() => getProgressTotalLearningMinutes(filteredHomeProgressRows), [filteredHomeProgressRows]);

  const homeProgressPageSize = 10;
  const homeProgressTotalPages = Math.max(1, Math.ceil(filteredHomeProgressRows.length / homeProgressPageSize));
  const safeHomeProgressPage = Math.min(homeProgressPage, homeProgressTotalPages);
  const paginatedHomeProgressRows = filteredHomeProgressRows.slice(
    (safeHomeProgressPage - 1) * homeProgressPageSize,
    safeHomeProgressPage * homeProgressPageSize
  );

  const homeLiveEvents = useMemo(
    () => (selectedSubjectId !== 'all' && homeSubjectEvents.length > 0 ? homeSubjectEvents : homeUpcomingEvents),
    [selectedSubjectId, homeSubjectEvents, homeUpcomingEvents]
  );

  const nextLiveEvent = useMemo(() => {
    if (homeLiveEvents.length === 0) return null;
    return [...homeLiveEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  }, [homeLiveEvents]);

  const criticalNotifications = useMemo(
    () =>
      homeNotifications.filter((item) => {
        const p = String(item.priority || '').toLowerCase();
        const t = `${item.title || ''} ${item.message || ''}`.toLowerCase();
        return p === 'critical' || p === 'urgent' || p === 'high' || t.includes('urgent') || t.includes('overdue') || t.includes('due today');
      }),
    [homeNotifications]
  );

  const nextCriticalDeadline = useMemo(() => {
    if (homeLiveEvents.length === 0) return null;
    const now = Date.now();
    const in48h = now + 48 * 60 * 60 * 1000;
    const candidates = homeLiveEvents.filter((e) => {
      const t = new Date(e.start).getTime();
      return Number.isFinite(t) && t >= now && t <= in48h;
    });
    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  }, [homeLiveEvents]);

  const criticalAlertsCount = criticalNotifications.length + (nextCriticalDeadline ? 1 : 0);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const currentUser = authService.getCurrentUser() as any;
        const token = getActiveAuthToken();
        if (!currentUser?.studentId || !token) throw new Error('User is not authorized or student ID is missing.');

        const studentData = await studentService.getStudent(currentUser.studentId);
        setStudent(studentData);

        const allSubjects = await courseService.getCourses().catch(() => []);
        const studentSubjectIds = (studentData?.subjects || [])
          .map((s: any) => (typeof s === 'string' ? s : s?.id))
          .filter(Boolean) as string[];

        let fetchedSubjects: Subject[] = [];
        if (studentSubjectIds.length > 0) {
          const byId = new Map(allSubjects.map((s) => [s.id, s]));
          const missingIds = studentSubjectIds.filter((id) => !byId.has(id));
          const missing = await Promise.all(missingIds.map((id) => courseService.getCourseById(id).catch(() => null)));
          missing.filter(Boolean).forEach((s) => byId.set((s as Subject).id, s as Subject));
          fetchedSubjects = studentSubjectIds.map((id) => byId.get(id)).filter(Boolean) as Subject[];
        } else {
          fetchedSubjects = allSubjects;
        }

        const normalized = (fetchedSubjects || []).map((s: any) => ({ ...(s || {}), id: s?.id || s?._id }));
        setSubjects(normalized as Course[]);

        if (studentData?.id) {
          try {
            const plans = await developmentService.getAllPlansForStudent(studentData.id, 'Active');
            setSubjectPlans(plans || []);
          } catch {
            setSubjectPlans([]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load student data');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (!student?.id) { setTeachers([]); return; }
    let cancelled = false;
    const fetchTeachers = async () => {
      try {
        setTeachersLoading(true); setTeachersError(null);
        const res = await studentService.getTeachers(student.id);
        if (!cancelled) setTeachers(res || []);
      } catch (err: any) {
        if (!cancelled) {
          setTeachers([]);
          const msg = String(err?.message || '');
          setTeachersError(
            msg.includes('No static resource') || (msg.includes('/api/students/') && msg.includes('/teachers'))
              ? 'Teachers data is currently unavailable. Please restart the backend.'
              : 'Failed to load teachers. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setTeachersLoading(false);
      }
    };
    fetchTeachers();
    return () => { cancelled = true; };
  }, [student?.id]);

  useEffect(() => {
    if (!student?.id) { setStudentReportCard(null); return; }
    let cancelled = false;
    void reportService.getStudentReportCard(student.id)
      .then((r) => { if (!cancelled) setStudentReportCard(r || null); })
      .catch(() => { if (!cancelled) setStudentReportCard(null); });
    return () => { cancelled = true; };
  }, [student?.id]);

  useEffect(() => {
    if (!student?.id) { setHomeStreakSummary(null); return; }
    let cancelled = false;
    void developmentService.touchStudentStreak(student.id).catch(() => null)
      .then((streak) => { if (!cancelled && streak) setHomeStreakSummary(streak); });
    return () => { cancelled = true; };
  }, [student?.id]);

  useEffect(() => {
    if (homeMasteryBySubject.length === 0) { setHomeMasterySubjectIndex(0); return; }
    setHomeMasterySubjectIndex((prev) => Math.min(prev, homeMasteryBySubject.length - 1));
  }, [homeMasteryBySubject.length]);

  useEffect(() => {
    if (homeMasteryBySubject.length <= 1) return;
    const id = window.setInterval(() => setHomeMasterySubjectIndex((prev) => (prev + 1) % homeMasteryBySubject.length), 4800);
    return () => window.clearInterval(id);
  }, [homeMasteryBySubject.length]);

  useEffect(() => {
    if (!student?.id) {
      setHomeNotifications([]); setHomeUnreadNotificationCount(0);
      setHomeUpcomingEvents([]); setHomeSubjectEvents([]);
      setHomeMasterySignals(null); setHomeStreakSummary(null);
      return;
    }
    let cancelled = false;
    const loadHomeLiveData = async () => {
      try {
        setHomeLiveLoading(true); setHomeLiveError(null);
        const now = new Date();
        const thirtyDaysAhead = new Date();
        thirtyDaysAhead.setDate(now.getDate() + 30);
        const [notifications, unreadCount, upcomingEvents, allCalendarEvents, subjectEvents, masterySignals, streakSummary] = await Promise.all([
          notificationService.getNotifications(1, 20, false, notificationRecipientId).catch(() => []),
          notificationService.getUnreadCount(notificationRecipientId).catch(() => 0),
          calendarService.getUpcomingEvents(6, student.id).catch(() => []),
          calendarService.getEvents(now, thirtyDaysAhead, student.id).catch(() => []),
          selectedSubjectId !== 'all' ? calendarService.getSubjectEvents(selectedSubjectId, student.id).catch(() => []) : Promise.resolve([]),
          developmentService.getStudentMasterySignalsSummary(student.id, selectedSubjectId !== 'all' ? selectedSubjectId : undefined).catch(() => null),
          developmentService.getStudentStreak(student.id).catch(() => null),
        ]);
        if (cancelled) return;
        const notifArray = Array.isArray(notifications) ? notifications : (notifications?.notifications || []);
        setHomeNotifications(notifArray.slice(0, 5));
        const unreadNum = typeof unreadCount === 'number' ? unreadCount : (unreadCount?.count ?? 0);
        setHomeUnreadNotificationCount(Number(unreadNum));
        setHomeUpcomingEvents((upcomingEvents || []).slice(0, 6));
        setHomeSubjectEvents((subjectEvents || []).slice(0, 6));
        setHomeMasterySignals(masterySignals);
        setHomeStreakSummary(streakSummary);
        void allCalendarEvents;
      } catch (liveError: any) {
        if (!cancelled) setHomeLiveError(liveError?.message || 'Failed to load live updates.');
      } finally {
        if (!cancelled) setHomeLiveLoading(false);
      }
    };
    void loadHomeLiveData();
    const intervalId = window.setInterval(() => void loadHomeLiveData(), 60 * 1000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, [student?.id, selectedSubjectId, notificationRecipientId]);

  useEffect(() => {
    if (activeView !== 'results') setIsResultsSidebarCollapsed(false);
    setAccountMenuOpen(false); setNotificationMenuOpen(false); setMobileNavOpen(false);
  }, [activeView]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(t)) setAccountMenuOpen(false);
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(t)) setNotificationMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsHeaderCompact(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => () => {
    if (viewSwitchTimerRef.current !== null) { window.clearTimeout(viewSwitchTimerRef.current); viewSwitchTimerRef.current = null; }
  }, []);

  useEffect(() => {
    const routeView = getRouteViewFromPathname(location.pathname);
    if (!routeView || routeView === activeView) return;
    // If the URL hasn't changed but activeView switched to a non-routable view
    // (e.g. 'messages'), don't override it back to the URL-derived view.
    if (location.pathname === lastProcessedPathnameRef.current && !isRoutableStudentView(activeView)) return;
    lastProcessedPathnameRef.current = location.pathname;
    if (viewSwitchTimerRef.current !== null) window.clearTimeout(viewSwitchTimerRef.current);
    setLoadingTargetView(routeView); setViewLoading(true);
    viewSwitchTimerRef.current = window.setTimeout(() => { setActiveView(routeView); setViewLoading(false); viewSwitchTimerRef.current = null; }, 180);
  }, [location.pathname, activeView]);

  useEffect(() => {
    if (displaySubjects.length === 0) return;
    if (!hasInitializedDefaultSubjectRef.current) {
      hasInitializedDefaultSubjectRef.current = true;
      if (selectedSubjectId === 'all' && defaultSubjectId !== 'all') setSelectedSubjectId(defaultSubjectId);
      return;
    }
    const exists = selectedSubjectId !== 'all' && displaySubjects.some((s) => s.id === selectedSubjectId);
    if (!exists && defaultSubjectId !== 'all') setSelectedSubjectId(defaultSubjectId);
  }, [displaySubjects, defaultSubjectId, selectedSubjectId]);

  useEffect(() => {
    if (displaySubjects.length === 0) { setActivePlan(null); return; }
    if (selectedSubjectId === 'all') {
      const firstId = displaySubjects[0]?.id;
      setActivePlan(firstId ? displayPlanBySubjectId.get(firstId) || null : null);
      return;
    }
    setActivePlan(displayPlanBySubjectId.get(selectedSubjectId) || null);
  }, [selectedSubjectId, displaySubjects, displayPlanBySubjectId]);

  useEffect(() => { setHomeProgressPage(1); }, [homePanel, progressWindow, progressContentFilter, progressActivityFilter]);
  useEffect(() => { if (homeProgressPage > homeProgressTotalPages) setHomeProgressPage(homeProgressTotalPages); }, [homeProgressPage, homeProgressTotalPages]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const setViewWithTransition = (nextView: NavItemKey, options?: { resetPlanEntry?: boolean }) => {
    if (options?.resetPlanEntry) setPlanEntryStepIndex(null);
    setMobileNavOpen(false);
    if (isRoutableStudentView(nextView)) {
      const targetPath = STUDENT_VIEW_PATHS[nextView];
      const currentPath = normalizeStudentPath(location.pathname);
      if (currentPath !== targetPath) { navigate(targetPath); return; }
    }
    if (nextView === activeView) return;
    if (viewSwitchTimerRef.current !== null) window.clearTimeout(viewSwitchTimerRef.current);
    setLoadingTargetView(nextView); setViewLoading(true);
    viewSwitchTimerRef.current = window.setTimeout(() => { setActiveView(nextView); setViewLoading(false); viewSwitchTimerRef.current = null; }, 180);
  };

  const handleNavChange = (key: NavItemKey) => setViewWithTransition(key, { resetPlanEntry: key === 'plan' });

  const openPlan = (subjectId: string, plan: DevelopmentPlan, stepIndex?: number) => {
    setSelectedSubjectId(subjectId);
    setActivePlan(plan);
    setPlanEntryStepIndex(typeof stepIndex === 'number' ? stepIndex : null);
    setViewWithTransition('plan');
  };

  const openSubjectInMySubjects = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setViewWithTransition('subjects');
  };

  const handleOpenTutor = (prompt?: string) => {
    setTutorPrefillMessage(prompt);
    setViewWithTransition('tutor');
  };

  const handleOpenProfile = () => { setViewWithTransition('profile'); setAccountMenuOpen(false); };
  const handleOpenSettings = () => { setViewWithTransition('profile'); setAccountMenuOpen(false); };

  const handleMarkNotificationRead = async (notificationId: string) => {
    const target = homeNotifications.find((item) => item.id === notificationId);
    if (!target || target.read) return;
    try {
      await notificationService.markAsRead(notificationId, notificationRecipientId);
      setHomeNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)));
      setHomeUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    } catch { /* non-blocking */ }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (homeUnreadNotificationCount <= 0) return;
    try {
      await notificationService.markAllAsRead(notificationRecipientId);
      setHomeNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setHomeUnreadNotificationCount(0);
    } catch { /* non-blocking */ }
  };

  const handleOpenNotificationContext = (notification: NotificationItem) => {
    const text = `${notification.notifType || ''} ${notification.title || ''} ${notification.message || ''}`.toLowerCase();
    if (text.includes('assessment') || text.includes('quiz') || text.includes('submission')) setViewWithTransition('assessments');
    else if (text.includes('plan') || text.includes('development')) setViewWithTransition('plan');
    else if (text.includes('subject') || text.includes('topic')) setViewWithTransition('subjects');
    else setViewWithTransition('overview');
    setNotificationMenuOpen(false);
  };

  const formatCalendarEventTime = (value: Date | string | undefined) => {
    if (!value) return 'TBD';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'TBD';
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatNotificationTime = (value: string | undefined) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // ── Nav items ─────────────────────────────────────────────────────────────────

  const navItems: Array<{ key: NavItemKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'overview',    label: 'Home',         icon: LayoutDashboard },
    { key: 'plan',        label: 'My Plans',     icon: BookOpen },
    { key: 'subjects',    label: 'My Subjects',  icon: BookOpen },
    { key: 'assessments', label: 'Assessments',  icon: FileText },
    { key: 'results',     label: 'My Report',    icon: BarChart2 },
    // { key: 'stats',       label: 'Statistics',   icon: TrendingUp },
    // { key: 'mastery',     label: 'Mastery Gaps', icon: Brain },
    { key: 'messages',    label: 'Messages',     icon: MessageCircle },
    // { key: 'peer-study',  label: 'Peer Study',   icon: Users },
    // { key: 'tutor',       label: 'AI Coach',     icon: Brain },
  ];

  const activeNavItemLabel = navItems.find((item) => item.key === activeView)?.label || 'Navigation';

  // ── Overview ──────────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Streak banner */}
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 border-y border-orange-100 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <p className="text-lg sm:text-xl font-semibold text-slate-900">
              {streakWeeks > 0 ? `You are on a ${streakWeeks}-week streak. Keep going.` : 'Start your learning streak today.'}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 text-slate-700">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-semibold">{streakWeeks > 0 ? `${streakWeeks} week streak` : 'No active streak'}</span>
              </div>
              <div className="h-8 w-px bg-orange-200" />
              <div className="w-full sm:w-auto sm:min-w-[220px]">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">Level {streakLevel}</span>
                  <span>{streakProgressPercent}% to next week</span>
                </div>
                <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
                  <div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.max(0, Math.min(100, streakProgressPercent))}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats (subjects panel only) */}
      {homePanel === 'subjects' && (
        <>
          <section className="hidden md:grid grid-cols-3 gap-3">
            <article className="rounded-xl border border-amber-100/70 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-sm font-semibold">Critical alerts</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{criticalAlertsCount}</p>
              <p className="text-xs text-slate-500">
                {nextCriticalDeadline
                  ? `${nextCriticalDeadline.title} • ${formatCalendarEventTime(nextCriticalDeadline.start)}`
                  : criticalNotifications.length > 0
                    ? `${criticalNotifications.length} urgent notification${criticalNotifications.length > 1 ? 's' : ''}`
                    : 'No critical alerts.'}
              </p>
            </article>
            <article className="rounded-xl border border-amber-100/70 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarClock className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold">Upcoming deadlines</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{homeLiveEvents.length}</p>
              <p className="text-xs text-slate-500">
                {nextLiveEvent ? `${nextLiveEvent.title} • ${formatCalendarEventTime(nextLiveEvent.start)}` : 'No upcoming events.'}
              </p>
            </article>
            <article className="rounded-xl border border-amber-100/70 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold">Mastery signals</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {activeHomeMasterySubject
                  ? `${Math.round(activeHomeMasterySubject.masteryPercent)}%`
                  : homeMasterySignals ? `${Math.round(homeMasterySignals.averageOverall || 0)}%` : '--'}
              </p>
              <div className="h-8 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHomeMasterySubject?.subjectId || 'mastery-fallback'}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <p className="text-xs text-slate-500">
                      {activeHomeMasterySubject
                        ? `${activeHomeMasterySubject.subjectName} • Grade ${activeHomeMasterySubject.currentGrade}`
                        : 'Subject mastery unavailable.'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </article>
          </section>

          {/* Mobile mastery card */}
          <section className="md:hidden">
            <article className="rounded-xl border border-amber-100/70 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold">Mastery signals</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {activeHomeMasterySubject
                  ? `${Math.round(activeHomeMasterySubject.masteryPercent)}%`
                  : homeMasterySignals ? `${Math.round(homeMasterySignals.averageOverall || 0)}%` : '--'}
              </p>
              <div className="h-8 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`mobile-${activeHomeMasterySubject?.subjectId || 'mastery-fallback'}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <p className="text-xs text-slate-500">
                      {activeHomeMasterySubject
                        ? `${activeHomeMasterySubject.subjectName} • Grade ${activeHomeMasterySubject.currentGrade}`
                        : 'Subject mastery unavailable.'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </article>
          </section>
        </>
      )}

      {homeLiveError && !homeLiveLoading && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{homeLiveError}</div>
      )}

      {/* Main panel */}
      <section className="bg-white/90 backdrop-blur-sm overflow-hidden rounded-xl border border-amber-100/60 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[580px]">
          <aside className="hidden lg:block border-r border-amber-100/60 p-5 bg-amber-50/30">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">My Stuff</p>
            <button type="button" onClick={() => setHomePanel('subjects')}
              className={`w-full mt-3 text-left rounded-md font-semibold px-4 py-2.5 text-sm ${homePanel === 'subjects' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              My Plans
            </button>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-7">My Account</p>
            <div className="mt-3 space-y-1.5">
              {(['progress', 'profile', 'teachers'] as HomePanelKey[]).map((panel) => (
                <button key={panel} type="button" onClick={() => setHomePanel(panel)}
                  className={`w-full text-left rounded-md px-4 py-2 text-sm capitalize ${homePanel === panel ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {panel}
                </button>
              ))}
            </div>
          </aside>

          <div className="p-4 sm:p-6 space-y-8">
            <AnimatePresence mode="wait">

              {/* ── My Plans ── */}
              {homePanel === 'subjects' && (
                <motion.div key="home-subjects-panel"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 xl:gap-x-10 gap-y-8 xl:gap-y-10">
{overviewSubjects.map(({ subject, plan }: { subject: any, plan: any }) => {
  if (!plan) return (
    <article key={subject.id} className="space-y-3 w-full">
      <button type="button" onClick={() => openSubjectInMySubjects(subject.id)}
        className="text-left text-xl sm:text-2xl font-semibold text-slate-900 hover:text-blue-700 transition">
        {subject.name}
      </button>
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-500">No surgical intervention active.</p>
      </div>
    </article>
  );

  // FIXED: Map missions to steps for the UI visualization
  const sortedMissions = (plan.missions || []).slice();
  const totalMissions = sortedMissions.length;
  const safeProgress = Math.max(0, Math.min(100, plan.progress || 0));
  
  // Calculate which mission we are on based on progress percentage
  const completedMissionsCount = Math.floor((safeProgress / 100) * totalMissions);
  const currentMissionIndex = Math.min(completedMissionsCount, Math.max(totalMissions - 1, 0));
  
  const visibleMissions = sortedMissions.slice(0, 4);

  return (
    <article key={subject.id} className="space-y-3 w-full">
      <button type="button" onClick={() => openSubjectInMySubjects(subject.id)}
        className="text-left text-xl sm:text-2xl font-semibold text-slate-900 hover:text-blue-700 transition">
        {subject.name}
      </button>
      <div className="border-t border-slate-200 pt-4">
        <div className="relative">
          <div className="space-y-4">
            {visibleMissions.map((mission: any, index: number) => {
              const isCompleted = mission.status === 'Completed';
              const isActive = index === currentMissionIndex;
              const label = safeProgress >= 100 ? 'Review' : isCompleted ? 'Done' : 'Start';
              
              return (
                <div key={mission._id} className="flex items-start justify-between gap-3 py-0.5">
                  <div className="flex items-start gap-2 min-w-0 flex-1 pr-2">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <button type="button" onClick={() => openPlan(subject.id, plan, index)}
                        className="block max-w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-blue-700">
                        {mission.task}
                      </button>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-bold tracking-tighter">
                        {mission.status}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <button type="button" onClick={() => openPlan(subject.id, plan, index)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shrink-0">
                      {label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
})}
                  </div>
                </motion.div>
              )}

              {/* ── Progress ── */}
              {homePanel === 'progress' && (
                <motion.div key="home-progress-panel"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }} className="space-y-5">
                  <h2 className="text-3xl font-bold text-slate-900">My progress</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <select value={progressWindow} onChange={(e) => setProgressWindow(e.target.value as 'week' | 'month' | 'all')}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none">
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                      <option value="all">All time</option>
                    </select>
                    <select value={progressContentFilter} onChange={(e) => setProgressContentFilter(e.target.value)}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none">
                      <option value="all">All content</option>
                      {displaySubjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <select value={progressActivityFilter} onChange={(e) => setProgressActivityFilter(e.target.value as 'all' | 'learn' | 'practice')}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none">
                      <option value="all">All activities</option>
                      <option value="learn">Learning</option>
                      <option value="practice">Practice</option>
                    </select>
                    <div className="ml-auto flex items-center gap-3 text-slate-800">
                      <div className="text-right"><p className="text-4xl leading-none font-bold">{progressExerciseMinutes}</p><p className="text-xs text-slate-500">exercise min</p></div>
                      <div className="h-10 w-px bg-slate-300" />
                      <div className="text-right"><p className="text-4xl leading-none font-bold">{progressTotalLearningMinutes}</p><p className="text-xs text-slate-500">total learning min</p></div>
                    </div>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full min-w-[920px]">
                      <thead className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="text-left font-semibold px-3 py-2">Activity</th>
                          <th className="text-left font-semibold px-3 py-2">Date</th>
                          <th className="text-left font-semibold px-3 py-2">Level</th>
                          <th className="text-left font-semibold px-3 py-2">Change</th>
                          <th className="text-right font-semibold px-3 py-2">Correct/Total Problems</th>
                          <th className="text-right font-semibold px-3 py-2">Time (min)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedHomeProgressRows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-200 text-sm text-slate-800">
                            <td className="px-3 py-3">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-500 mt-0.5">{getStepIcon(row.type)}</span>
                                <div className="min-w-0"><p className="font-semibold truncate">{row.title}</p><p className="text-xs text-slate-500 truncate">{row.subjectName}</p></div>
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">{formatProgressDate(row.date)}</td>
                            <td className="px-3 py-3">{row.progressPercent >= 100 ? 'Mastered' : row.progressPercent > 0 ? 'In progress' : '-'}</td>
                            <td className="px-3 py-3">{row.progressPercent > 0 ? `+${Math.max(1, Math.round(row.progressPercent / 20))}` : '-'}</td>
                            <td className="px-3 py-3 text-right">{row.correctTotal}</td>
                            <td className="px-3 py-3 text-right">{row.timeMinutes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => setHomeProgressPage((p) => Math.max(1, p - 1))} disabled={safeHomeProgressPage <= 1}
                      className="inline-flex items-center text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                    <span className="text-slate-500">Page {safeHomeProgressPage} of {homeProgressTotalPages}</span>
                    <button type="button" onClick={() => setHomeProgressPage((p) => Math.min(homeProgressTotalPages, p + 1))} disabled={safeHomeProgressPage >= homeProgressTotalPages}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
                  </div>
                </motion.div>
              )}

              {/* ── Profile ── */}
              {homePanel === 'profile' && (
                <motion.div key="home-profile-panel"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}>
                  <StudentProfileSettings student={student!} onStudentUpdated={(updated) => setStudent(updated)} />
                </motion.div>
              )}

              {/* ── Teachers ── */}
              {homePanel === 'teachers' && (
                <motion.div key="home-teachers-panel"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}>
                  <HomeTeachersPanel teachers={teachers} loading={teachersLoading} error={teachersError} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );

  // ── Skeletons ──────────────────────────────────────────────────────────────────

  const renderViewSkeleton = (view: NavItemKey) => {
    if (view === 'overview') return (
      <div className="space-y-4 animate-pulse">
        <section className="h-24 border border-slate-200 bg-slate-100" />
        <section className="border border-slate-200 bg-white overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[640px]">
            <aside className="hidden lg:block border-r border-slate-200 bg-slate-50 p-5"><div className="h-3 w-20 rounded bg-slate-200" /></aside>
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-7 w-40 rounded bg-slate-200" />
                  {Array.from({ length: 4 }).map((__, j) => (
                    <div key={j} className="flex items-center gap-2 flex-1">
                      <div className="h-8 w-8 rounded-full bg-slate-200" />
                      <div className="space-y-1.5 flex-1"><div className="h-4 w-40 rounded bg-slate-200" /><div className="h-3 w-24 rounded bg-slate-200" /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
    if (view === 'plan') return (
      <div className="border border-slate-200 bg-white overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] min-h-[760px]">
          <aside className="hidden md:flex border-r border-slate-200 bg-slate-50 flex-col">
            <div className="border-b border-slate-200 px-5 py-4 space-y-3"><div className="h-6 w-44 rounded bg-slate-200" /><div className="h-1.5 w-full rounded bg-slate-200" /></div>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[72px] w-full border-b border-slate-200 bg-slate-100" />)}
          </aside>
          <div className="bg-white"><div className="h-[74px] border-b border-slate-200 px-6 py-5"><div className="h-9 w-72 rounded bg-slate-200" /></div><div className="p-6 space-y-4"><div className="h-28 w-full rounded bg-slate-100" /><div className="h-28 w-full rounded bg-slate-100" /></div></div>
        </div>
      </div>
    );
    if (view === 'subjects') return (
      <div className="border border-slate-200 bg-white overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] min-h-[640px]">
          <aside className="hidden xl:block border-r border-slate-200 bg-slate-50 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 w-full border-b border-slate-200 bg-slate-100" />)}</aside>
          <div className="p-6 space-y-4"><div className="h-8 w-80 rounded bg-slate-200" />{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 w-full rounded border border-slate-200 bg-slate-50" />)}</div>
        </div>
      </div>
    );
    if (view === 'assessments') return (
      <div className="border border-slate-200 bg-white overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-[680px]">
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="h-3 w-24 rounded bg-slate-200" />{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 w-full border-b border-slate-200 bg-slate-100" />)}
          </aside>
          <div className="p-6 space-y-4"><div className="h-16 rounded-lg border border-slate-200 bg-slate-50" />{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 rounded-lg border border-slate-200 bg-white" />)}</div>
        </div>
      </div>
    );
    if (view === 'results') return (
      <div className="border border-slate-200 bg-white overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-[680px]">
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="h-3 w-20 rounded bg-slate-200" />{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 w-full border-b border-slate-200 bg-slate-100" />)}
          </aside>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-lg border border-slate-200 bg-white" />)}</div>
            <div className="h-72 rounded-lg border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    );
    if (view === 'messages') return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
        <div className="h-6 w-44 bg-slate-200 rounded mb-4" />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`flex mb-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}><div className="w-2/3 h-12 bg-slate-200 rounded-lg" /></div>)}
      </div>
    );
    if (view === 'peer-study') return (
      <div className="border border-slate-200 bg-white overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-[640px]">
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="h-3 w-20 rounded bg-slate-200" />{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-10 w-full border-b border-slate-200 bg-slate-100" />)}
          </aside>
          <div className="p-6 space-y-4"><div className="h-16 rounded-lg border border-slate-200 bg-slate-50" /></div>
        </div>
      </div>
    );
    if (view === 'tutor' || view === 'profile') return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="h-72 border border-slate-200 bg-white" /><div className="h-72 border border-slate-200 bg-white" /></div>
      </div>
    );
    return <div className="h-64 border border-slate-200 bg-white animate-pulse" />;
  };

  // ── Content render ────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (!student) return null;
    if (viewLoading) return renderViewSkeleton(loadingTargetView);

    switch (activeView) {
      case 'plan':
        return activePlan ? (
        <StudentPlanView 
          plan={activePlan} 
          studentId={student.id}
          selectedSubjectId={selectedSubjectId}
          initialStepIndex={planEntryStepIndex ?? undefined} 
          onOpenMission={handleOpenMission}
        />
        ) : (
          <div className="bg-white/90 rounded-2xl border border-amber-100/70 p-8 text-center shadow-sm">
            <BookOpen className="w-14 h-14 text-amber-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Plan</h3>
            <p className="text-slate-500 text-sm">No plan available for the selected subject.</p>
          </div>
        );

      case 'subjects':
        return (
          <StudentSubjectsView
            studentId={student.id}
            selectedSubjectId={selectedSubjectId}
            subjects={displaySubjects}
          />
        );

      case 'assessments':
        return (
          <StudentAssignments
            studentId={student.id}
            selectedSubjectId={selectedSubjectId}
            onOpenTutor={handleOpenTutor}
          />
        );

      case 'results': {
        const reportNeedsAttentionCount = reportCardRows.filter((r) => r.masteryPercent < 50).length;
        return (
          <section className="border border-amber-100/60 bg-white/90 overflow-hidden rounded-xl shadow-sm">
            <div className={`grid grid-cols-1 min-h-[560px] ${isResultsSidebarCollapsed ? 'lg:grid-cols-[88px_1fr]' : 'lg:grid-cols-[280px_1fr]'}`}>
              <aside className="relative border-b lg:border-b-0 lg:border-r border-amber-100/60 bg-amber-50/30 p-4 sm:p-5 space-y-4">
                <button type="button" onClick={() => setIsResultsSidebarCollapsed((prev) => !prev)}
                  className="hidden lg:inline-flex absolute top-1/2 -translate-y-1/2 -right-4 z-10 h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                  aria-label={isResultsSidebarCollapsed ? 'Expand my report panel' : 'Collapse my report panel'}>
                  {isResultsSidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                </button>
                <p className={`text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold transition-[max-width,opacity,transform] duration-200 ${isResultsSidebarCollapsed ? 'max-w-0 opacity-0 -translate-x-1 overflow-hidden' : 'max-w-[180px] opacity-100 translate-x-0'}`}>
                  My Report
                </p>
                <nav className={`${isResultsSidebarCollapsed ? '-mx-4 sm:-mx-5 border-y border-slate-200 bg-white overflow-hidden' : '-mx-4 sm:-mx-5 border-t border-slate-200'}`}>
                  <button type="button" aria-current="page" title="Report Card"
                    className={`w-full inline-flex items-center text-sm transition ${isResultsSidebarCollapsed ? 'justify-center h-11' : 'justify-between rounded-none border-b border-slate-200 px-4 sm:px-5 py-2.5'} ${isResultsSidebarCollapsed ? 'bg-blue-50 text-blue-700' : 'bg-blue-50 border-l-4 border-l-blue-600 pl-2 text-blue-700 font-semibold'}`}>
                    <span className={`inline-flex items-center min-w-0 ${isResultsSidebarCollapsed ? '' : 'gap-2'}`}>
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <GraduationCap className="w-4 h-4" />
                      </span>
                      <span className={`truncate transition-[max-width,opacity,transform] duration-200 ${isResultsSidebarCollapsed ? 'max-w-0 opacity-0 -translate-x-1 overflow-hidden' : 'max-w-[180px] opacity-100 translate-x-0'}`}>
                        Report Card
                      </span>
                    </span>
                    {!isResultsSidebarCollapsed && <span className="text-xs font-semibold text-blue-700">{reportNeedsAttentionCount}</span>}
                  </button>
                </nav>
              </aside>
              <div className="p-4 sm:p-6 bg-white">
                <StudentReportCard rows={reportCardRows} />
              </div>
            </div>
          </section>
        );
      }

      case 'stats':
        return (
          <StudentStats
            student={student}
            selectedSubjectId={selectedSubjectId !== 'all' ? selectedSubjectId : undefined}
          />
        );

      case 'messages':
        return <StudentMessages studentId={student.id} />;

      case 'mastery':
        return (
          <StudentMasteryGaps
            selectedSubjectId={selectedSubjectId}
            subjects={displaySubjects}
            activePlan={activePlan}
            onOpenTutor={handleOpenTutor}
          />
        );

      case 'tutor':
        return (
          <StudentTutor
            studentId={student.id}
            selectedSubjectId={selectedSubjectId}
            subjects={displaySubjects}
            activePlan={activePlan}
            prefillMessage={tutorPrefillMessage}
            onPrefillApplied={() => setTutorPrefillMessage(undefined)}
          />
        );

      case 'peer-study':
        return (
          <StudentPeerStudy
            studentId={student.id}
            selectedSubjectId={selectedSubjectId}
            subjects={subjects}
          />
        );

      case 'profile':
        return (
          <StudentProfileSettings
            student={student}
            onStudentUpdated={(updated) => setStudent(updated)}
          />
        );

      default:
        return renderOverview();
    }
  };

  // ── Error / loading guard ──────────────────────────────────────────────────────

  if (loading) return <DashboardSkeleton />;

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-center p-4">
        <div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">An Error Occurred</h2>
          <p className="text-slate-600 mb-6">{error || 'Student data could not be found.'}</p>
          <button onClick={handleLogout} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50/80"
      style={{ ['--student-header-offset' as string]: isHeaderCompact ? '4.75rem' : '9rem' }}
    >
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        {/* Brand row */}
        <div className={`transition-all duration-200 ${isHeaderCompact ? 'max-h-0 overflow-hidden opacity-0 -translate-y-1 pointer-events-none' : 'relative z-30 max-h-28 overflow-visible opacity-100 translate-y-0'}`}>
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-2xl font-bold text-blue-700">KundAI</span>

            <div className="flex items-center justify-end gap-2">
              {/* Notifications */}
              <div ref={notificationMenuRef} className="relative z-50">
                <button type="button"
                  onClick={() => { setNotificationMenuOpen((prev) => !prev); setAccountMenuOpen(false); }}
                  className="relative inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-haspopup="menu" aria-expanded={notificationMenuOpen} aria-label="Open notifications" title="Notifications">
                  <Bell className="h-4 w-4" />
                  {homeUnreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {homeUnreadNotificationCount > 99 ? '99+' : homeUnreadNotificationCount}
                    </span>
                  )}
                </button>
                {notificationMenuOpen && (
                  <div role="menu" className="absolute top-full right-0 mt-2 w-[340px] max-w-[90vw] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg z-[70]">
                    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-800">Notifications</p>
                      <button type="button" onClick={handleMarkAllNotificationsRead} disabled={homeUnreadNotificationCount <= 0}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {homeNotifications.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-slate-500">No notifications yet.</p>
                      ) : (
                        homeNotifications.map((item) => (
                          <div key={item.id} className="border-b border-slate-100 last:border-b-0">
                            <button type="button" onClick={() => handleOpenNotificationContext(item)}
                              className={`w-full px-3 py-2.5 text-left transition hover:bg-slate-50 ${item.read ? 'bg-white' : 'bg-blue-50/40'}`}>
                              <p className="text-sm font-semibold text-slate-800">{item.title || 'Update'}</p>
                              {item.message && <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{item.message}</p>}
                              <p className="mt-1 text-[11px] text-slate-400">{formatNotificationTime(item.createdAt)}</p>
                            </button>
                            {item.read === false && (
                              <div className="px-3 pb-2">
                                <button type="button" onClick={() => handleMarkNotificationRead(item.id)}
                                  className="text-[11px] font-semibold text-blue-700 hover:text-blue-800">Mark as read</button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Account */}
              <div ref={accountMenuRef} className="relative z-50">
                <button type="button"
                  onClick={() => { setAccountMenuOpen((prev) => !prev); setNotificationMenuOpen(false); }}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  aria-haspopup="menu" aria-expanded={accountMenuOpen}>
                  <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold ${student.avatar ? 'bg-slate-100 border border-slate-200 text-slate-600' : `bg-gradient-to-br ${avatarGradient} text-white`}`}>
                    {student.avatar ? <img src={student.avatar} alt={`${student.firstName} avatar`} className="w-full h-full object-cover" /> : avatarInitials}
                  </div>
                  <span className="hidden md:block font-medium">{student.firstName} {student.lastName}</span>
                  <ChevronDown className={`w-4 h-4 transition ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountMenuOpen && (
                  <div role="menu" className="absolute top-full right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-[70]">
                    <button type="button" onClick={() => { handleOpenProfile(); setAccountMenuOpen(false); }}
                      className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" /> Profile
                    </button>
                    <button type="button" onClick={() => { handleOpenSettings(); setAccountMenuOpen(false); }}
                      className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-500" /> Settings
                    </button>
                    <button type="button" onClick={() => { setAccountMenuOpen(false); handleLogout(); }}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div className={`${isHeaderCompact ? '' : 'border-t border-slate-200'} relative z-10 bg-slate-50/70`}>
          <nav className="max-w-[1400px] mx-auto px-4">
            {/* Mobile */}
            <div className="lg:hidden py-2 relative z-40">
              <button type="button" onClick={() => setMobileNavOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700"
                aria-expanded={mobileNavOpen} aria-controls="student-mobile-nav-panel">
                <span className="inline-flex items-center gap-2">
                  {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  {activeNavItemLabel}
                </span>
                <ChevronDown className={`w-4 h-4 transition ${mobileNavOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileNavOpen && (
                <div id="student-mobile-nav-panel" className="mt-2 rounded-lg border border-slate-200 bg-white p-2 space-y-1 shadow-lg max-h-[70vh] overflow-y-auto">
                  {navItems.map(({ key, label, icon: Icon }) => (
                    <button key={key} type="button" onClick={() => handleNavChange(key)}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition ${activeView === key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                  {subjects.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-200">
                      <label className="text-[11px] font-medium text-slate-500">Subject</label>
                      <div className="relative mt-1">
                        <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full appearance-none rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none px-3 pr-8 py-2">
                          <option value="all">All Subjects</option>
                          {subjects.map((s) => <option key={s.id} value={s.id}>{`${s.code}: ${s.name}`}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop */}
            <div className="hidden lg:flex items-center gap-3 py-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-0 overflow-x-auto overflow-y-hidden whitespace-nowrap pr-2 [&::-webkit-scrollbar]:hidden">
                  {navItems.map(({ key, label, icon: Icon }) => (
                    <button key={key} type="button" onClick={() => handleNavChange(key)}
                      className={`group relative inline-flex items-center gap-2 py-3 pl-1 pr-4 text-sm transition shrink-0 ${activeView === key ? 'text-slate-900 font-semibold' : 'text-slate-500 font-medium hover:text-slate-900'}`}>
                      <Icon className={`hidden xl:block w-4 h-4 transition ${activeView === key ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      <span>{label}</span>
                      <span className={`absolute left-0 right-0 bottom-0 h-0.5 rounded-full transition ${activeView === key ? 'bg-blue-600' : 'bg-transparent group-hover:bg-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {subjects.length > 0 && (
                <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shrink-0 ml-auto relative z-0">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Subject</span>
                  <div className="relative">
                    <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="appearance-none bg-transparent text-sm font-semibold text-slate-700 focus:outline-none min-w-[170px] pl-1 pr-6 py-0.5">
                      <option value="all">All Subjects</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{`${s.code}: ${s.name}`}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <button type="button" onClick={() => setMobileNavOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-slate-900/15 backdrop-blur-sm"
          aria-label="Close navigation menu" />
      )}

      {/* ── Main ── */}
      {/* Strip the container/padding only when StudentPlanView is actually rendered (plan + activePlan).
          For the no-plan fallback and every other view, keep the standard max-w container + padding. */}
      <main
        className={`w-full overflow-hidden ${activeView === 'subjects' ? 'pt-4 pb-0' : 'py-4'}`}
        style={{ height: 'calc(100vh - var(--student-header-offset, 9rem))' }}
      >
        <div className="h-full max-w-[1400px] mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="h-full overflow-y-auto"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Mission Content Overlay ── */}
<AnimatePresence>
  {isMissionOverlayOpen && activeMissionResource && (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
      >
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Surgical Module</span>
            <h2 className="text-xl font-black truncate">{activeMissionResource.title}</h2>
          </div>
          <button onClick={() => setIsMissionOverlayOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-50/50">
          {activeMissionResource.resourceType === 'Theory' && (
            <>
              {/* Scenario Section */}
              <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">1</div>
                  <h3 className="text-lg font-black uppercase text-slate-800 tracking-tighter">The Real-World Context</h3>
                </div>
                <p className="text-blue-600 font-bold mb-2">{activeMissionResource.content.relatable_context.scenario}</p>
                <p className="text-slate-600 leading-relaxed text-sm">{activeMissionResource.content.relatable_context.setup}</p>
              </section>

              {/* Misconceptions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                  <h4 className="text-rose-700 font-black text-xs uppercase tracking-widest mb-4">Avoid These Pitfalls</h4>
                  <ul className="space-y-3">
                    {activeMissionResource.content.misconceptions.common_errors.map((err: string, i: number) => (
                      <li key={i} className="text-xs text-rose-800 flex gap-2 font-medium">
                        <span className="text-rose-400">✕</span> {err}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                  <h4 className="text-emerald-700 font-black text-xs uppercase tracking-widest mb-4">The "Aha!" Moments</h4>
                  <div className="space-y-4">
                    {activeMissionResource.content.misconceptions.aha_moments.slice(0, 2).map((aha: any, i: number) => (
                      <div key={i}>
                        <p className="text-xs font-black text-emerald-900 uppercase tracking-tighter">{aha.pitfall}</p>
                        <p className="text-[11px] text-emerald-700 italic">"{aha.correction}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Practice/Quiz Renderer (Simple fallback) */}
          {(activeMissionResource.resourceType === 'Practice' || activeMissionResource.resourceType === 'Quiz') && (
            <div className="space-y-4">
               {activeMissionResource.content.map((item: any, i: number) => (
                 <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200">
                    <p className="font-bold text-slate-800 mb-4">{i + 1}. {item.question}</p>
                    <div className="p-3 bg-slate-900 rounded-xl text-emerald-400 text-xs font-mono">
                      Expected Outcome: {item.final_answer || item.correct_answer}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex justify-center shrink-0">
          <button 
            onClick={() => setIsMissionOverlayOpen(false)}
            className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Mission Reviewed
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

export default StudentDashboard;