import React from 'react';
import { ClassGroup } from '../../types';

interface AssessmentSummary {
  name: string;
  dueDate: string | Date;
}

interface PerformanceEntry {
  studentId?: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  score?: number;
  percentage?: number;
  student?: {
    firstName?: string;
    lastName?: string;
    classGroup?: { name: string };
    user?: { firstName: string; lastName: string };
  };
}

interface PerformancePanelProps {
  loading: boolean;
  assessment: AssessmentSummary | null;
  data: PerformanceEntry[];
  classGroup?: ClassGroup | null;
  form?: number | null;
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({
  loading,
  assessment,
  data,
  classGroup,
  form,
}) => {
  const getStudentName = (item: PerformanceEntry) => {
    if (item.student?.user?.firstName) {
      return `${item.student.user.firstName} ${item.student.user.lastName}`;
    }
    if (item.student?.firstName) {
      return `${item.student.firstName} ${item.student.lastName ?? ''}`;
    }
    if (item.firstName) {
      return `${item.firstName} ${item.lastName ?? ''}`;
    }
    if (item.name && item.name.trim().length > 0) {
      return item.name;
    }
    return 'Unknown Student';
  };

  // Derive a human-readable scope label (e.g. "Form 1A" or "Form 2")
  const scopeLabel = classGroup
    ? classGroup.name
    : form
    ? `Form ${form}`
    : null;

  return (
    <div className="w-1/2 bg-gray-50 p-4 rounded-lg shadow h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight">Performance</h2>
        {scopeLabel && (
          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wide">
            {scopeLabel}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          Syncing assessment data...
        </div>
      ) : assessment ? (
        <>
          <div className="mb-3">
            <p className="text-[10px] font-black text-blue-600 uppercase">
              Latest: {assessment.name}
            </p>
            <p className="text-[9px] text-gray-400">
              Due: {new Date(assessment.dueDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {data.length > 0 ? (
              data.map((item, index) => (
                <div
                  key={`${item.studentId || item._id || index}-${index}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex flex-col min-w-0 mr-2">
                    <p className="text-sm font-medium truncate">{getStudentName(item)}</p>
                    {item?.student?.classGroup?.name && (
                      <p className="text-[9px] text-gray-400">
                        {item.student.classGroup.name}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold shrink-0">
                    {item.score ?? item.percentage ?? 0}%
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                No submissions yet
              </div>
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
