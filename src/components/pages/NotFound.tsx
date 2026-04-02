// src/components/pages/NotFound.tsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authService } from '../../services/api';

const NotFound: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
      <h1 className="text-4xl font-bold text-red-500 mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-700 mb-2">No match for <strong>{location.pathname}</strong></p>
      {
        (() => {
          const user = authService.getCurrentUser();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u = user as any;
          const isAdmin = u?.role === 'admin';
          const isTeacher = u?.role === 'teacher';
          const isStudent = u?.role === 'student' && !!u?.studentId;
          const home = user ? (isAdmin ? '/admin' : (isTeacher ? '/dashboard' : (isStudent ? '/student/dashboard' : '/dashboard'))) : '/login';
          return (
            <Link to={home} className="text-blue-500 underline mt-4">
              Go back
            </Link>
          );
        })()
      }
    </div>
  );
};

export default NotFound;
