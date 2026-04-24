// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Mail, Calendar, LogOut, Bell, ClipboardList } from 'lucide-react';
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

  const [courses, setCourses] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

useEffect(() => {
  const loadData = async () => {
    try {
      const [teachingCourses, count] = await Promise.all([
        courseService.getTeachingCourses(),
        notificationService.getUnreadCount()
      ]);
      const sanitizedCourses = teachingCourses.map((c: any) => ({
        ...c,
        id: c.code || c._id, // If code exists (MATH-ZIM-B), use it as the primary ID
      }));

      setCourses(sanitizedCourses);
      setUnreadCount(count);

      // Only auto-select if nothing is selected yet
      if (sanitizedCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(sanitizedCourses[0]);
      }
    } catch (err) { 
      console.error("Header Data Load Error:", err); 
    }
  };
  loadData();
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

        <div className="flex gap-2">
          <button onClick={() => setShowNotifications(true)} className="relative bg-[#ececed] p-2.5 rounded-lg shadow-sm hover:bg-gray-200">
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{unreadCount}</span>}
          </button>
          <button onClick={() => { authService.logout(); navigate('/login'); }} className="bg-[#ececed] p-2.5 rounded-lg shadow-sm hover:bg-red-50 text-gray-600 hover:text-red-600">
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
      </nav>

      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </header>
  );
};

export default Header;