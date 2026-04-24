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
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 flex items-center gap-2.5">
        <div className={clsx("w-7 h-7 flex items-center justify-center rounded-md flex-shrink-0", `bg-${color}-100`)}>
            <Icon size={14} className={`text-${color}-600`} />
        </div>
        <div className="min-w-0">
            <p className={clsx("font-bold text-slate-800 truncate leading-tight", isText ? 'text-xs' : 'text-sm')}>{value}</p>
            <p className="text-[10px] text-slate-400 truncate">{label}</p>
        </div>
    </div>
);

export default StatCard;