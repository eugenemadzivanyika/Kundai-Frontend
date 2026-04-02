import React from 'react';
import { CalendarEvent } from '../../types/calendar';

interface CalendarWidgetProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  className?: string;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  events, 
  onDateSelect, 
  className = "" 
}) => {
  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDaysOfWeek();

  return (
    <div className={`bg-gray-50 p-1.5 rounded-lg shadow flex flex-col overflow-hidden h-full ${className}`}>
      
      {/* Mini Header */}
      <div className="flex justify-between items-center mb-1 flex-shrink-0">
        <h2 className="text-[9px] font-black uppercase tracking-tighter text-gray-400">
          {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </h2>
        <button 
          onClick={() => onDateSelect(new Date())}
          className="text-[7px] bg-black text-white px-1.5 py-0.5 rounded-full leading-none"
        >
          +
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 divide-y divide-gray-100">

        {/* Row 1: Day Initials */}
        <div className="flex flex-shrink-0">
          {days.map((day, i) => (
            <div 
              key={`name-${i}`} 
              className={`
                text-center text-[8px] font-bold text-gray-400 pb-0.5
                ${i === 0 ? 'flex-[2]' : 'flex-1'}
              `}
            >
              {day.toLocaleDateString('en-US', { weekday: 'short' })[0]}
            </div>
          ))}
        </div>

        {/* Row 2: Date Numbers */}
        <div className="flex flex-1 min-h-0">
          {days.map((day, i) => {
            const isActive = i === 0;
            
            // FIXED: Using 'e.start' instead of 'e.date' to match CalendarEvent type
            const dayEvents = events.filter(e => {
              if (!e.start) return false;
              const evDate = new Date(e.start);
              return evDate.toDateString() === day.toDateString();
            });

            return (
              <div 
                key={`num-${i}`}
                onClick={() => onDateSelect(day)}
                className={`
                  flex flex-col items-center justify-center cursor-pointer transition-all min-h-0
                  ${isActive 
                    ? 'bg-blue-600 text-white rounded-md shadow-sm z-10 flex-[2]' 
                    : 'flex-1 hover:bg-gray-200 rounded-sm text-gray-600'}
                `}
              >
                <span className={`${isActive ? 'font-black text-xs' : 'font-bold text-[10px]'} leading-none`}>
                  {day.getDate()}
                </span>
                
                {/* Indicator dot if events exist */}
                {dayEvents.length > 0 && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${isActive ? 'bg-white' : 'bg-blue-400'}`} />
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default CalendarWidget;