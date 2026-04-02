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
import StudentDashboard from './components/student/StudentDashboard';
import NotFound from './components/pages/NotFound';
import DevelopmentPage from './pages/DevelopmentPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminCourses from './pages/AdminCourses';
import AdminStudents from './pages/AdminStudents';
import AdminResources from './pages/AdminResources';

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

  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              (() => {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                const isAdmin = user?.role === 'admin';
                const isTeacher = user?.role === 'teacher';
                const isStudent = user?.role === 'student';
                if (isAdmin) {
                  return <Navigate to="/admin" replace />;
                }
                if (isTeacher) {
                  return <Navigate to="/dashboard" replace />;
                }
                if (isStudent) {
                  return <Navigate to="/student/dashboard" replace />;
                }
                // Default to main dashboard for users without a linked student profile
                return <Navigate to="/dashboard" replace />;
              })()
            ) : (
              <Login onLogin={() => {
                setIsAuthenticated(true);
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                const isAdmin = user?.role === 'admin';
                const isTeacher = user?.role === 'teacher';
                const isStudent = user?.role === 'student' && !!user?.studentId;
                if (isAdmin) {
                  navigate('/admin', { replace: true });
                  return;
                }
                if (isTeacher) {
                  navigate('/dashboard', { replace: true });
                  return;
                }
                if (isStudent) {
                  navigate('/student/dashboard', { replace: true });
                  return;
                }
                navigate('/dashboard', { replace: true });
              }} />
            )
          }
        />

        <Route
          path="/student/dashboard"
          element={
            isAuthenticated ? (
              <StudentDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

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
            <Route path="resources" element={<ResourcesDashboard />} />
            <Route path="grading" element={<GradingDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/courses" element={<AdminCourses />} />
            <Route path="admin/students" element={<AdminStudents />} />
            <Route path="admin/resources" element={<AdminResources />} />
          </Route>
        )}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;