import React from 'react';
import { students } from '../../data/mockData';

const StaffRoom: React.FC = () => {
  return (
    <div className="w-1/2 bg-gray-50 p-4 rounded-lg shadow h-full overflow-hidden">
      <h2 className="text-xl font-bold mb-4 uppercase tracking-tight">Staff Room</h2>
      <div className="space-y-4 overflow-y-auto h-[calc(100%-40px)] pr-2 custom-scrollbar">
        {students.slice(0, 5).map((student, index) => (
          <div key={index} className="flex items-center pb-2 border-b border-gray-100 last:border-0">
            <div className="w-9 h-9 bg-black rounded-full flex-shrink-0 flex items-center justify-center mr-3 shadow-sm">
              <span className="text-white text-xs font-bold">{student.firstName[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs truncate">{student.firstName} {student.lastName}</p>
              <p className="text-[10px] text-gray-500 truncate italic">"Sir, I have a question about..."</p>
            </div>
            <div className="ml-2 text-[9px] text-gray-400 whitespace-nowrap">
              {['10:25', '09:55', '08:17', '07:48', 'Yesterday'][index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffRoom;
