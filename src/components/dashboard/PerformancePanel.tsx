import React from 'react';

interface PerformancePanelProps {
  loading: boolean;
  assessment: any;
  data: any[];
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({ loading, assessment, data }) => {
  // Surgical helper with debugging
const getStudentName = (item: any) => {
  // Check for nested populated user object first
  if (item?.student?.user?.firstName) {
    return `${item.student.user.firstName} ${item.student.user.lastName}`;
  }
  // Check for populated student object
  if (item?.student?.firstName) {
    return `${item.student.firstName} ${item.student.lastName}`;
  }
  // Check for direct firstName on the item
  if (item?.firstName) {
    return `${item.firstName} ${item.lastName}`;
  }
  
  // FIXED: Check if 'name' exists and is not just whitespace
  if (item?.name && item.name.trim().length > 0) {
    return item.name;
  }

  return "Unknown Student";
};

  // LOG 3: Check the entire data array on render
  if (!loading && data) {
    console.log("🚀 [PerformancePanel] Full data array received:", data);
  }

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
              data.map((item, index) => (
                <div 
                  key={`${item.studentId || item._id || index}-${index}`} 
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium truncate mr-2">
                    {getStudentName(item)}
                  </p>
                  <span className="text-sm font-bold">{item.score || item.percentage || 0}%</span>
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