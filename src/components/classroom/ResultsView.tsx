import React, { useEffect, useState } from 'react';
import { Student } from '../../types';
import { User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { assessmentService } from '../../services/api';

interface ResultsViewProps {
  student: Student;
}

const ResultsView: React.FC<ResultsViewProps> = ({ student }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        // Using the newly added service method
        const data = await assessmentService.getStudentAssessmentsAndResults(student.id);
        setResults(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    if (student.id) fetchResults();
  }, [student.id]);

  if (loading) return <div className="p-4 text-sm animate-pulse text-slate-500 italic">Syncing historical data...</div>;
  if (error) return <div className="p-4 text-sm text-red-500 font-bold">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-xl p-0 flex flex-col h-full overflow-hidden border border-slate-200">
      {/* Surgical Header */}
      <div className="flex items-center p-4 sticky top-0 bg-slate-900 text-white z-10 shadow-md">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-inner">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight leading-none">{student.firstName}</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold">Assessment Timeline</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-black leading-none text-blue-400">{student.overall}%</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Average</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
              <th className="py-3 px-2 text-left">Assessment</th>
              <th className="py-3 px-2 text-center">Score</th>
              <th className="py-3 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {results.length > 0 ? (
              results.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="font-bold text-slate-700">{item.assessmentName}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{item.assessmentType}</div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {item.status === 'graded' ? (
                      <div className="flex flex-col items-center">
                        <span className="font-black text-slate-900">{item.actualMark} / {item.maxScore}</span>
                        <span className={`text-[10px] font-bold ${item.actualMark >= (item.maxScore * 0.5) ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {Math.round((item.actualMark / item.maxScore) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300 italic">Not available</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${
                      item.status === 'graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      item.status === 'submitted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-10 text-center text-slate-400 italic">No historical data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsView;