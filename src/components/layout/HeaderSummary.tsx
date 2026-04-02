// src/components/layout/HeaderSummary.tsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { studentService } from '../../services/api';
import { Student } from '../../types';

interface HeaderSummaryProps {
  courseId?: string;
}

const HeaderSummary: React.FC<HeaderSummaryProps> = ({ courseId }) => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!courseId || courseId === 'dashboard') return;
      try {
        const students = await studentService.getStudents(courseId);
        const grades = [
          { name: 'A', count: students.filter((s: Student) => (s.overall || 0) >= 75).length, color: '#22c55e' },
          { name: 'B', count: students.filter((s: Student) => (s.overall || 0) >= 65 && (s.overall || 0) < 75).length, color: '#3b82f6' },
          { name: 'C', count: students.filter((s: Student) => (s.overall || 0) >= 55 && (s.overall || 0) < 65).length, color: '#eab308' },
          { name: 'Fail', count: students.filter((s: Student) => (s.overall || 0) < 55).length, color: '#ef4444' },
        ];
        setData(grades.filter(g => g.count > 0));
        setTotal(students.length);
      } catch (err) {
        console.error("Summary fetch error", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Poll every minute, not 30s
    return () => clearInterval(interval);
  }, [courseId]);

  return (
    <div className="bg-[#ececed] p-2 shadow-sm h-[70px] w-[280px] flex items-center justify-between rounded-md">
      <div className="relative w-[80px] h-[60px] flex items-center justify-center">
        <PieChart width={60} height={60}>
          <Pie data={data} innerRadius={18} outerRadius={28} dataKey="count" startAngle={90} endAngle={-270}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
        </PieChart>
        <span className="absolute text-[10px] font-bold">{total}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold uppercase flex-1 ml-2">
        {data.map((cat, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
            <span>{cat.name}: {cat.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeaderSummary;
