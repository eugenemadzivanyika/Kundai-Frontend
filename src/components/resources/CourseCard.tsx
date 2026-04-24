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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  onClick: () => void;
  onUploadClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, onUploadClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 flex flex-col cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all overflow-hidden"
    >
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate leading-tight">{course.name}</h3>
            <p className="text-[10px] text-slate-400 truncate">{course.code || 'No code'}</p>
          </div>
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              onBlur={() => setTimeout(() => setMenuOpen(false), 100)}
              className="p-0.5 rounded hover:bg-slate-100"
            >
              <MoreVertical size={13} className="text-slate-400" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-slate-200 z-50"
                >
                  <button onClick={(e) => { e.stopPropagation(); onClick(); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Eye size={12} /> View Resources
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onUploadClick(); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <UploadCloud size={12} /> Upload File
                  </button>
                  <button onClick={(e) => e.stopPropagation()}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Settings size={12} /> Settings
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Folder size={11} className="text-blue-400 flex-shrink-0" />
          <span>{course.resourceCount} resources</span>
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-100 px-2.5 py-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <FileText size={10} className="text-blue-400" />{course.documents}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <FileImage size={10} className="text-green-400" />{course.images}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <FileVideo size={10} className="text-purple-400" />{course.videos}
        </span>
        <span className="text-[10px] text-slate-400">+{course.others}</span>
      </div>
    </motion.div>
  );
};

export default CourseCard;