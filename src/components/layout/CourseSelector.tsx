// src/components/layout/CourseSelector.tsx
import React, { useState } from 'react';
import { ChevronDown, X, User } from 'lucide-react';

interface CourseSelectorProps {
  userName: string;
  courses: any[];
  selectedCourse: any;
  onSelect: (course: any) => void;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({ userName, courses, selectedCourse, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="relative bg-[#ececed] p-1 flex items-center shadow-sm rounded-l-lg pr-12"
           style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0% 100%)' }}>
        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shrink-0">
          <User size={20} />
        </div>
        <div className="ml-3 min-w-[120px]">
          <h2 className="text-sm font-black truncate uppercase tracking-tight">Mr. {userName}</h2>
          <button onClick={() => setIsOpen(true)} className="flex items-center text-[10px] font-bold text-blue-600 hover:underline">
            {selectedCourse?.name || 'Select Course'} <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-sm uppercase">Your Courses</h3>
              <button onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-2 space-y-1 max-h-60 overflow-y-auto">

              {courses.map(c => {
                const courseIdentifier = c.code;

                return (
                  <button 
                    key={c._id || c.id} 
                    onClick={() => { 
                      onSelect({ 
                        ...c, 
                        id: courseIdentifier 
                      }); 
                      setIsOpen(false); 
                    }}
                    className={`w-full text-left p-3 rounded-lg text-sm font-bold transition-colors ${
                      selectedCourse?.id === courseIdentifier 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center text-inherit">
                      <span>{c.name}</span>
                      <span className="text-[10px] opacity-70 truncate ml-4">
                        {c.code}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseSelector;