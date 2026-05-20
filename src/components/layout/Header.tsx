// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Mail, Calendar, LogOut, Bell, ClipboardList, BarChart2 } from 'lucide-react';
import { authService, notificationService, courseService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from '../teacher/NotificationCenter';
import HeaderSummary from './HeaderSummary';
import CourseSelector from './CourseSelector';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCourse, setSelectedCourse } = useAuth();
  const currentUser = authService.getCurrentUser();

  const [courses, setCourses] = useState<{ id: string; _id: string; code: string; name: string; classGroups?: unknown[] }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

useEffect(() => {
  const loadData = async () => {
    const user = authService.getCurrentUser();
    try {
      const [teachingCourses, count] = await Promise.all([
        user?.role === 'teacher' ? courseService.getTeachingCourses() : Promise.resolve([]),
        notificationService.getUnreadCount()
      ]);
      const sanitizedCourses = teachingCourses.map(c => ({
        ...c,
        id: c.code || c._id,
      }));

      setCourses(sanitizedCourses);
      setUnreadCount(count);

      if (sanitizedCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(sanitizedCourses[0] as Parameters<typeof setSelectedCourse>[0]);
      }
    } catch (err) {
      console.error("Header Data Load Error:", err);
    }
  };
  loadData();

  const interval = setInterval(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch { /* silent */ }
  }, 30_000);

  return () => clearInterval(interval);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const activeTab = location.pathname.split('/')[1] || 'dashboard';

  return (
    <header className="w-full mb-4">
      <div className="flex justify-between items-start">
        {activeTab === 'classroom' ? (
          <HeaderSummary courseId={selectedCourse?.id} />
        ) : (
          <CourseSelector 
            userName={currentUser?.lastName || 'Teacher'} 
            courses={courses} 
            selectedCourse={selectedCourse} 
            onSelect={setSelectedCourse} 
          />
        )}


   <div className="flex gap-2 items-center">
     <button onClick={() => setShowNotifications(true)} className="relative bg-[#ececed] p-2.5 rounded-lg shadow-sm hover:bg-gray-200">
       <Bell size={18} />
       {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{unreadCount}</span>}
     </button>

<button onClick={() => authService.logout()} className="bg-[#ececed] p-2.5 rounded-lg shadow-sm hover:bg-red-50 text-gray-600 hover:text-red-600">
       <LogOut size={18} />
     </button>
   </div>

      </div>

      <nav className="flex gap-1 mt-3">
        {[
          { name: 'Home',        path: 'dashboard',           icon: <Home size={14} /> },
          { name: 'Classroom',   path: 'classroom',            icon: <LayoutGrid size={14} /> },
          { name: 'Assessments', path: 'teacher/assessments',  icon: <ClipboardList size={14} /> },
          { name: 'Staffroom',   path: 'staffroom',            icon: <Mail size={14} /> },
          { name: 'Calendar',    path: 'calendar',             icon: <Calendar size={14} /> },
        ].map((link) => {
          const isActive = location.pathname.startsWith(`/${link.path}`);
          return (
            <button key={link.path} onClick={() => navigate(`/${link.path}`)}
              className={`flex items-center gap-2 py-2 px-5 rounded-md text-[11px] font-black uppercase transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-[#ececed] text-gray-500 hover:bg-gray-200'}`}>
              {link.icon} {link.name}
            </button>
          );
        })}
        {(() => {
          const defaultClassId = selectedCourse?.classGroups?.[0]?._id;
          if (!defaultClassId) return null;
          const isActive = location.pathname.startsWith('/teacher/analytics');
          return (
            <button
              onClick={() => navigate(`/teacher/analytics/${defaultClassId}`)}
              className={`flex items-center gap-2 py-2 px-5 rounded-md text-[11px] font-black uppercase transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-[#ececed] text-gray-500 hover:bg-gray-200'}`}
            >
              <BarChart2 size={14} /> Analytics
            </button>
          );
        })()}
      </nav>

      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} onNavigate={(path) => { setShowNotifications(false); navigate(path); }} />
    </header>
  );
};

export default Header;