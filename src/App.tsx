import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import SysAdminLayout from './components/layout/SysAdminLayout';
import StudentDashboard from './components/student/StudentDashboard';
import NotFound from './components/pages/NotFound';
import DevelopmentPage from './pages/DevelopmentPage';
import DevelopmentPlanCreation from './components/classroom/DevelopmentPlanCreation';
import AdminDashboardPage from './components/admin/pages/AdminDashboardPage';
import AdminUsersPage from './components/admin/pages/AdminUsersPage';
import AdminSubjectsPage from './components/admin/pages/AdminSubjectsPage';
import AdminClassesPage from './components/admin/pages/AdminClassesPage';
import AdminCurriculumPage from './components/admin/pages/AdminCurriculumPage';
import AdminTermForecastsPage from './components/admin/pages/AdminTermForecastsPage';
import AIResourceViewer from './components/classroom/AIResourceViewer';
import AssessmentsDashboardPage from './pages/AssessmentsDashboardPage';
import AssessmentDetailPage from './pages/AssessmentDetailPage';
import AssessmentAnalysisPage from './pages/AssessmentAnalysisPage';
import EditAssessmentPage from './pages/EditAssessmentPage';
import SysAdminDashboardPage from './components/sysadmin/pages/SysAdminDashboardPage';
import SysAdminSchoolsPage from './components/sysadmin/pages/SysAdminSchoolsPage';
import SysAdminPackagesPage from './components/sysadmin/pages/SysAdminPackagesPage';
import SysAdminSubscriptionsPage from './components/sysadmin/pages/SysAdminSubscriptionsPage';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

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

        {/* --- Sys Admin Portal --- */}
        {isAuthenticated && (
          <Route path="/sys-admin" element={<SysAdminLayout />}>
            <Route index element={<SysAdminDashboardPage />} />
            <Route path="schools" element={<SysAdminSchoolsPage />} />
            <Route path="packages" element={<SysAdminPackagesPage />} />
            <Route path="subscriptions" element={<SysAdminSubscriptionsPage />} />
          </Route>
        )}

        {/* --- School Admin Portal (own layout, own navigation) --- */}
        {isAuthenticated && (
          <Route path="/admin" element={<AdminLayout />}>
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
          </Route>
        )}

        {/* --- Catch All --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
