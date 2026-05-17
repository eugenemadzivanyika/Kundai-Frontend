import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import { ChatConversation } from '../../types';

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short' });
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const StaffRoom: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatService.getConversations()
      .then(data => setConversations(data))
      .catch(err => console.error('StaffRoom: failed to load conversations', err))
      .finally(() => setLoading(false));
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="w-1/2 bg-gray-50 p-4 rounded-lg shadow h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-tight text-gray-800">Staff Room</h2>
        {totalUnread > 0 && (
          <span className="bg-teal-600 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar min-h-0">
        {loading ? (
          <p className="text-[10px] text-gray-400 italic text-center pt-4">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="text-[10px] text-gray-400 italic text-center pt-4">No student messages yet.</p>
        ) : (
          conversations.slice(0, 6).map(conv => (
            <button
              key={conv.studentId}
              onClick={() => navigate('/staffroom', { state: { chatStudentId: conv.studentId } })}
              className="w-full flex items-center pb-2 border-b border-gray-100 last:border-0 hover:bg-white rounded px-1 transition-colors text-left"
            >
              <div className="w-9 h-9 bg-black rounded-full flex-shrink-0 flex items-center justify-center mr-3 shadow-sm">
                <span className="text-white text-xs font-bold">{initials(conv.studentName)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-extrabold text-gray-900' : 'font-bold text-gray-700'}`}>
                  {conv.studentName}
                </p>
                <p className="text-[10px] text-gray-500 truncate italic">
                  {conv.lastMessage
                    ? conv.lastMessage.content
                    : 'No messages yet'}
                </p>
              </div>
              <div className="ml-2 flex flex-col items-end gap-1 flex-shrink-0">
                {conv.lastMessage && (
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">
                    {formatTime(conv.lastMessage.timestamp)}
                  </span>
                )}
                {conv.unreadCount > 0 && (
                  <span className="bg-teal-600 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[16px] text-center leading-none">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {conversations.length > 0 && (
        <button
          onClick={() => navigate('/staffroom')}
          className="mt-2 text-[9px] font-bold text-teal-600 uppercase tracking-wide hover:text-teal-800 transition-colors self-end"
        >
          View all →
        </button>
      )}
    </div>
  );
};

export default StaffRoom;
