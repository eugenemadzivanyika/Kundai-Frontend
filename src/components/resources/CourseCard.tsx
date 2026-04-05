import React, { useState } from 'react';
import { 
  FileText, 
  Folder, 
  MoreVertical, 
  UploadCloud, 
  Eye, 
  Settings, 
  FileImage, 
  FileVideo, 
  FilePlus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Defined based on your original design's data requirements
interface CourseCardProps {
  course: {
    _id: string;
    name: string;
    code?: string;
    resourceCount: number;
    documents: number;
    images: number;
    videos: number;
    others: number;
  };
  onClick: () => void;      // Maps to your original onNavigate
  onUploadClick: () => void; // Maps to your original onUpload
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, onUploadClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-800 pr-4">{course.name}</h3>
          <div className="relative">
            {/* Stop propagation on the menu button so clicking it doesn't navigate */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              onBlur={() => setTimeout(() => setMenuOpen(false), 100)}
              className="p-1 rounded-full hover:bg-slate-100"
            >
              <MoreVertical size={20} className="text-slate-500" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Eye size={14} /> View Resources
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUploadClick();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <UploadCloud size={14} /> Upload File
                  </button>
                  <button 
                    onClick={(e) => e.stopPropagation()} 
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings size={14} /> Course Settings
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">{course.code || 'No code'}</p>
        <div className="flex items-center text-sm font-medium text-slate-600 gap-1">
          <Folder size={16} className="text-blue-500" />
          <span>{course.resourceCount} total resources</span>
        </div>
      </div>

      {/* The original bottom grid with detailed counts */}
      <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FileText size={14} className="text-blue-500" /> 
          Docs: <strong>{course.documents}</strong>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FileImage size={14} className="text-green-500" /> 
          Images: <strong>{course.images}</strong>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FileVideo size={14} className="text-purple-500" /> 
          Videos: <strong>{course.videos}</strong>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FilePlus size={14} className="text-slate-500" /> 
          Others: <strong>{course.others}</strong>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;