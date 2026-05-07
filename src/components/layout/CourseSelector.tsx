// src/components/layout/CourseSelector.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X, User, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ClassGroup {
  _id: string;
  name: string;
  form: number;
  stream: string;
}

interface CourseSelectorProps {
  userName: string;
  courses: any[];
  selectedCourse: any;
  onSelect: (course: any) => void;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({ userName, courses, selectedCourse, onSelect }) => {
  const { selectedClassGroups, setSelectedClassGroups } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingCourse, setPendingCourse] = useState<any | null>(null);
  const [pendingClassGroups, setPendingClassGroups] = useState<string[]>([]);

  const openModal = () => {
    const activeId = selectedCourse?.id ?? null;
    setExpandedId(activeId);
    const fresh = courses.find(c => (c.code || c._id) === activeId) ?? null;
    setPendingCourse(fresh);
    setPendingClassGroups([...selectedClassGroups]);
    setIsOpen(true);
  };

  const handleSubjectClick = (course: any) => {
    const courseId = course.code || course._id;
    if (expandedId === courseId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(courseId);
    if (pendingCourse?._id !== course._id) {
      setPendingClassGroups([]);
    }
    setPendingCourse(course);
  };

  const toggleClassGroup = (id: string) => {
    setPendingClassGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    if (!pendingCourse) return;
    onSelect({ ...pendingCourse, id: pendingCourse.code || pendingCourse._id });
    setSelectedClassGroups(pendingClassGroups);
    setIsOpen(false);
  };

  const classGroupLabel = (): string | null => {
    if (!selectedCourse) return null;
    const allGroups: ClassGroup[] = selectedCourse.classGroups || [];
    if (allGroups.length === 0 || selectedClassGroups.length === 0) return null;
    const names = allGroups
      .filter(cg => selectedClassGroups.includes(cg._id))
      .map(cg => cg.stream ? `${cg.form}${cg.stream}` : cg.name);
    return names.length > 0 ? names.join(', ') : null;
  };

  const label = classGroupLabel();

  return (
    <>
      <div
        className="relative bg-[#ececed] p-1 flex items-center shadow-sm rounded-l-lg pr-12"
        style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0% 100%)' }}
      >
        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shrink-0">
          <User size={20} />
        </div>
        <div className="ml-3 min-w-[140px]">
          <h2 className="text-sm font-black truncate uppercase tracking-tight">Mr. {userName}</h2>
          <button
            onClick={openModal}
            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline max-w-[200px]"
          >
            <span className="truncate">{selectedCourse?.name || 'Select Subject'}</span>
            {label && <span className="text-gray-500 shrink-0">· {label}</span>}
            <ChevronDown size={12} className="shrink-0" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">

            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                <h3 className="font-black text-sm uppercase">Select Subject</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Click a subject to filter by class
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Accordion list */}
            <div className="p-2 space-y-1 overflow-y-auto flex-1">
              {courses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No subjects assigned yet.</p>
              )}
              {courses.map(course => {
                const courseId = course.code || course._id;
                const isExpanded = expandedId === courseId;
                const isActive = selectedCourse?.id === courseId;
                const groups: ClassGroup[] = course.classGroups || [];

                return (
                  <div key={course._id || course.id}>
                    {/* Subject row */}
                    <button
                      onClick={() => handleSubjectClick(course)}
                      className={`w-full text-left px-3 py-2.5 text-sm font-bold transition-colors flex items-center justify-between gap-2 ${
                        isExpanded
                          ? 'bg-blue-600 text-white rounded-t-lg rounded-b-none'
                          : isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 rounded-lg'
                          : 'hover:bg-gray-100 rounded-lg text-gray-800'
                      }`}
                    >
                      <span className="truncate">{course.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isExpanded
                            ? 'bg-blue-500 text-blue-100'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {groups.length} {groups.length === 1 ? 'class' : 'classes'}
                        </span>
                        {isExpanded
                          ? <ChevronDown size={14} className="text-blue-200" />
                          : <ChevronRight size={14} className="text-gray-400" />
                        }
                      </div>
                    </button>

                    {/* Inline class group checkboxes */}
                    {isExpanded && (
                      <div className="bg-blue-50 border border-blue-100 border-t-0 rounded-b-lg pb-2 pt-1 px-2 space-y-0.5">
                        <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide px-2 py-1">
                          Filter by class · leave all unchecked to see all
                        </p>
                        {groups.map((cg: ClassGroup) => {
                          const checked = pendingClassGroups.includes(cg._id);
                          return (
                            <button
                              key={cg._id}
                              onClick={() => toggleClassGroup(cg._id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-3 ${
                                checked
                                  ? 'bg-white text-blue-700 shadow-sm'
                                  : 'hover:bg-white/70 text-gray-700'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                              }`}>
                                {checked && <Check size={10} className="text-white" />}
                              </div>
                              <span>
                                {cg.stream ? `Form ${cg.form}${cg.stream}` : cg.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 shrink-0">
              {pendingCourse && (
                <p className="text-[10px] text-gray-400 text-center mb-2">
                  {pendingClassGroups.length === 0
                    ? `${pendingCourse.name} — all your classes`
                    : `${pendingCourse.name} · ${pendingClassGroups.length} class${pendingClassGroups.length > 1 ? 'es' : ''} selected`}
                </p>
              )}
              <button
                onClick={handleApply}
                disabled={!pendingCourse}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-black hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                View Dashboard
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default CourseSelector;
