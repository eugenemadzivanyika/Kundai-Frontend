// src/components/resources/StatCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
    icon: LucideIcon;
    value: string | number;
    label: string;
    color: string;
    isText?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, color, isText = false }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-5">
        <div className={clsx("w-12 h-12 flex items-center justify-center rounded-full", `bg-${color}-100`)}>
            <Icon size={24} className={`text-${color}-600`} />
        </div>
        <div>
            <p className={clsx("font-bold text-slate-800 line-clamp-1", isText ? 'text-lg' : 'text-2xl')}>{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
        </div>
    </div>
);

export default StatCard;