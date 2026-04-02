import React from 'react';

interface PerformancePanelProps {
  loading: boolean;
  assessment: any;
  data: any[];
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({ loading, assessment, data }) => {
  return (
    <div className="w-1/2 bg-gray-50 p-4 rounded-lg shadow h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 uppercase tracking-tight">Performance</h2>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          Syncing assessment data...
        </div>
      ) : assessment ? (
        <>
          <div className="mb-3">
            <p className="text-[10px] font-black text-blue-600 uppercase">Latest: {assessment.name}</p>
            <p className="text-[9px] text-gray-400">Due: {new Date(assessment.dueDate).toLocaleDateString()}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {data.length > 0 ? (
              data.map((student) => (
                <div key={student.studentId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm font-medium truncate mr-2">{student.name}</p>
                  <span className="text-sm font-bold">{student.score}%</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">No submissions yet</div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs italic">
          No assessments found for this course
        </div>
      )}
    </div>
  );
};

export default PerformancePanel;
