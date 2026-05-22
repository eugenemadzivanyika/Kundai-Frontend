import { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { tokenStore } from './services/tokenStore';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/dashboard/Dashboard';
import Inbox from './components/staffroom/Inbox';
import CalendarView from './components/calendar/CalendarView';
import ClassroomView from './components/classroom/ClassroomView';
import ResourcesDashboard from './components/resources/ResourcesDashboard';
import GradingDashboard from './components/teacher/GradingDashboard';
import Login from './components/pages/Login';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import StudentDashboard from './components/student/StudentDashboard';
import NotFound from './components/pages/NotFound';
import DevelopmentPage from './components/classroom/DevelopmentPage';
import DevelopmentPlanCreation from './components/classroom/DevelopmentPlanCreation';
import AdminDashboardPage from './components/admin/pages/AdminDashboardPage';
import AdminUsersPage from './components/admin/pages/AdminUsersPage';
import AdminSubjectsPage from './components/admin/pages/AdminSubjectsPage';
import AdminClassesPage from './components/admin/pages/AdminClassesPage';
import AdminCurriculumPage from './components/admin/pages/AdminCurriculumPage';
import AdminTermForecastsPage from './components/admin/pages/AdminTermForecastsPage';
import SchoolAdminLayout from './components/school-admin/SchoolAdminLayout';
import SchoolDashboardPage from './components/school-admin/pages/SchoolDashboardPage';
import SchoolTeachersPage from './components/school-admin/pages/SchoolTeachersPage';
import SchoolStudentsPage from './components/school-admin/pages/SchoolStudentsPage';
import SchoolClassesPage from './components/school-admin/pages/SchoolClassesPage';
import SchoolSubjectsPage from './components/school-admin/pages/SchoolSubjectsPage';
import SchoolReportsPage from './components/school-admin/pages/SchoolReportsPage';
import SchoolBillingPage from './components/school-admin/pages/SchoolBillingPage';
import SchoolSettingsPage from './components/school-admin/pages/SchoolSettingsPage';
import AIResourceViewer from './components/classroom/AIResourceViewer';
import AssessmentsDashboardPage from './components/assessments/AssessmentsDashboardPage';
import AssessmentDetailPage from './components/assessments/AssessmentDetailPage';
import AssessmentAnalysisPage from './components/assessments/AssessmentAnalysisPage';
import EditAssessmentPage from './components/assessments/EditAssessmentPage';
import SysAdminShell from './components/sysadmin/SysAdminShell';
import SysAdminDashboardPage from './components/sysadmin/pages/SysAdminDashboardPage';
import SysAdminSchoolsPage from './components/sysadmin/pages/SysAdminSchoolsPage';
import SchoolDetailPage from './components/sysadmin/pages/SchoolDetailPage';
import SysAdminSubscriptionsPage from './components/sysadmin/pages/SysAdminSubscriptionsPage';
import SysAdminPackagesPage from './components/sysadmin/pages/SysAdminPackagesPage';
import SysAdminSettingsPage from './components/sysadmin/pages/SysAdminSettingsPage';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import TeacherProfilePage from './components/teacher/TeacherProfilePage';
import ClassDrillDownDashboard from './components/class-drill-down/ClassDrillDownDashboard';
import { MobileOcrApp } from './components/kundai-mobile/MobileOcrApp';

function AnalyticsPage() {
  const { classId } = useParams<{ classId: string }>();
  return <ClassDrillDownDashboard classId={classId!} />;
}

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (!user || user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // On mount: attempt a silent token refresh using the HttpOnly cookie.
  // This restores auth state after a page reload without exposing the token in localStorage.
  useEffect(() => {
    authService.tryRefresh().then(ok => {
      setIsAuthenticated(ok);
      setAuthChecked(true);
    });
  }, []);

  // Keep isAuthenticated in sync with the in-memory token store (e.g. forced logout on 401).
  useEffect(() => {
    return tokenStore.subscribe(token => setIsAuthenticated(!!token));
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const publicPaths = ['/', '/login', '/register'];
    const isPublic = publicPaths.includes(location.pathname) || location.pathname.startsWith('/m/ocr');
    if (!isAuthenticated && !isPublic) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authChecked, location.pathname, navigate]);

  if (!authChecked) return null;

  const renderStudentDashboard = () => (
    isAuthenticated ? <StudentDashboard /> : <Navigate to="/login" replace />
  );

  return (
    <AuthProvider>
      <Routes>
        {/* --- Auth --- */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              (() => {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                if (user?.role === 'sys_admin') return <Navigate to="/sys-admin" replace />;
                if (user?.role === 'admin') return <Navigate to="/admin" replace />;
                if (user?.role === 'teacher') return <Navigate to="/dashboard" replace />;
                if (user?.role === 'student') return <Navigate to="/student/home" replace />;
                return <Navigate to="/dashboard" replace />;
              })()
            ) : (
              <Login onLogin={() => {
                setIsAuthenticated(true);
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                if (user?.role === 'sys_admin') navigate('/sys-admin', { replace: true });
                else if (user?.role === 'admin') navigate('/admin', { replace: true });
                else if (user?.role === 'teacher') navigate('/dashboard', { replace: true });
                else if (user?.role === 'student') navigate('/student/home', { replace: true });
                else navigate('/dashboard', { replace: true });
              }} />
            )
          }
        />

        {/* --- Student Portal --- */}
        <Route path="/student" element={<Navigate to="/student/home" replace />} />
        <Route path="/student/dashboard" element={<Navigate to="/student/home" replace />} />
        <Route path="/student/home" element={renderStudentDashboard()} />
        <Route path="/student/my-plans" element={renderStudentDashboard()} />
        <Route path="/student/my-subjects" element={renderStudentDashboard()} />
        <Route path="/student/assessments" element={renderStudentDashboard()} />
        <Route path="/student/my-report" element={renderStudentDashboard()} />
        <Route path="/student/ai-coach" element={renderStudentDashboard()} />
        <Route path="/student/peer-study" element={renderStudentDashboard()} />
        <Route path="/student/profile" element={renderStudentDashboard()} />
        <Route path="/student/stats" element={renderStudentDashboard()} />
        <Route path="/student/mastery" element={renderStudentDashboard()} />

        {/* --- Public routes --- */}
        <Route path="/" element={
          isAuthenticated ? (
            (() => {
              const userStr = localStorage.getItem('user');
              const user = userStr ? JSON.parse(userStr) : null;
              if (user?.role === 'sys_admin') return <Navigate to="/sys-admin" replace />;
              if (user?.role === 'admin') return <Navigate to="/admin" replace />;
              if (user?.role === 'teacher') return <Navigate to="/dashboard" replace />;
              if (user?.role === 'student') return <Navigate to="/student/home" replace />;
              return <Navigate to="/dashboard" replace />;
            })()
          ) : (
            <LandingPage />
          )
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        } />

        {/* --- Sys Admin Portal --- */}
        {isAuthenticated && (
          <Route path="/sys-admin" element={<RequireRole role="sys_admin"><SysAdminShell /></RequireRole>}>
            <Route index element={<SysAdminDashboardPage />} />
            <Route path="schools" element={<SysAdminSchoolsPage />} />
            <Route path="schools/:schoolId" element={<SchoolDetailPage />} />
            <Route path="packages" element={<SysAdminPackagesPage />} />
            <Route path="subscriptions" element={<SysAdminSubscriptionsPage />} />
            <Route path="settings" element={<SysAdminSettingsPage />} />
          </Route>
        )}

        {/* --- School Admin Portal (new design) --- */}
        {isAuthenticated && (
          <Route path="/admin" element={<RequireRole role="admin"><SchoolAdminLayout /></RequireRole>}>
            <Route index element={<SchoolDashboardPage />} />
            <Route path="teachers" element={<SchoolTeachersPage />} />
            <Route path="students" element={<SchoolStudentsPage />} />
            <Route path="classes" element={<SchoolClassesPage />} />
            <Route path="subjects" element={<SchoolSubjectsPage />} />
            <Route path="reports" element={<SchoolReportsPage />} />
            <Route path="billing" element={<SchoolBillingPage />} />
            <Route path="settings" element={<SchoolSettingsPage />} />
          </Route>
        )}

        {/* --- Legacy School Admin (kept temporarily) --- */}
        {isAuthenticated && (
          <Route path="/legacy-admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="subjects" element={<AdminSubjectsPage />} />
            <Route path="classes" element={<AdminClassesPage />} />
            <Route path="curriculum" element={<AdminCurriculumPage />} />
            <Route path="term-forecasts" element={<AdminTermForecastsPage />} />
          </Route>
        )}

        {/* --- Teacher / Main Portal --- */}
        {isAuthenticated && (
          <Route
            path="/"
            element={<MainLayout activeTab={activeTab} setActiveTab={setActiveTab} />}
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="staffroom" element={<Inbox />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="classroom" element={<ClassroomView />} />
            <Route path="development/:studentId" element={<DevelopmentPage />} />
            <Route path="development/create/:studentId/:courseId" element={<DevelopmentPlanCreation />} />
            <Route path="resources" element={<ResourcesDashboard />} />
            <Route path="teacher/assessments" element={<AssessmentsDashboardPage />} />
            <Route path="teacher/assessments/analysis" element={<AssessmentAnalysisPage />} />
            <Route path="teacher/assessments/:id" element={<AssessmentDetailPage />} />
            <Route path="teacher/assessments/:id/edit" element={<EditAssessmentPage />} />
            <Route path="teacher/assessments/marking-dashboard" element={<GradingDashboard />} />
            <Route path="/ai-content/:resourceId" element={<AIResourceViewer />} />
            <Route path="teacher/profile" element={<TeacherProfilePage />} />
            <Route path="teacher/analytics/:classId" element={<AnalyticsPage />} />
          </Route>
        )}

        {/* --- Mobile OCR PWA (no auth shell — phone authenticates via pair token) --- */}
        <Route path="/m/ocr" element={<MobileOcrApp />} />
        <Route path="/m/ocr/pair/:pairToken" element={<MobileOcrApp />} />

        {/* --- Catch All --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
