import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../../types';
import { chatService } from '../../services/api';
import { Send, MessageCircle, BookOpen, User, ChevronRight } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

interface StudentMessagesProps {
  studentId: string;
}

interface Conversation {
  teacherId: string;
  teacherName: string;
  courses: Array<{ code: string; name: string }>;
  chatId: string;
  lastMessage: { content: string; timestamp: string; senderRole: string } | null;
  unreadCount: number;
}

interface RawMessage {
  _id?: string;
  id?: string;
  sender?: { _id: string; firstName: string; lastName: string; avatar?: string };
  content: string;
  timestamp?: string | Date;
  createdAt?: string | Date;
  read?: boolean;
  chat?: string;
  chatId?: string;
  senderRole?: string;
}

function mapMessage(m: RawMessage): ChatMessage {
  return {
    id: m._id || m.id || String(Date.now()),
    sender: m.sender || { _id: '', firstName: '', lastName: '' },
    content: m.content,
    timestamp: new Date((m.timestamp || m.createdAt || Date.now()) as string | number | Date),
    read: m.read ?? false,
    chatId: m.chat || m.chatId || '',
    isTeacher: m.senderRole === 'teacher',
    createdAt: m.createdAt ? new Date(m.createdAt as string | number | Date) : undefined,
  };
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isThisYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', ...(isThisYear ? {} : { year: 'numeric' }) });
}

const TEACHER_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

const StudentMessages: React.FC<StudentMessagesProps> = ({ studentId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation list
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatService.getStudentConversations();
        setConversations(data);
        if (data.length > 0) setActiveConv(data[0]);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoadingConvs(false);
      }
    };
    loadConversations();
  }, [studentId]);

  // Load messages and connect socket when active conversation changes
  useEffect(() => {
    if (!activeConv) return;

    setLoadingMessages(true);
    setMessages([]);

    // Disconnect previous socket room
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    let socket: Socket;
    let cancelled = false;

    const init = async () => {
      try {
        const { messages: raw, chatId } = await chatService.getStudentThreadByTeacher(activeConv.teacherId);
        if (cancelled) return;
        setMessages(raw.map(mapMessage));

        // Update unread count in sidebar to 0 after opening
        setConversations(prev =>
          prev.map(c => c.teacherId === activeConv.teacherId ? { ...c, unreadCount: 0 } : c)
        );

        socket = io(SOCKET_URL);
        socketRef.current = socket;
        socket.emit('join_chat', { chatId });

        socket.on('receive_message', (data: RawMessage) => {
          if (cancelled) return;
          if (data.senderRole === 'student') return;
          setMessages(prev => {
            if (prev.some(m => m.id === (data._id || data.id))) return prev;
            return [...prev, mapMessage(data)];
          });
        });
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [activeConv?.teacherId]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !activeConv) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const saved = await chatService.sendStudentMessageToTeacher(activeConv.teacherId, content);
      setMessages(prev => {
        if (prev.some(m => m.id === (saved._id || saved.id))) return prev;
        return [...prev, mapMessage({ ...saved, senderRole: 'student' })];
      });
      // Update sidebar last message
      setConversations(prev =>
        prev.map(c =>
          c.teacherId === activeConv.teacherId
            ? { ...c, lastMessage: { content, timestamp: new Date().toISOString(), senderRole: 'student' } }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [newMessage, sending, activeConv]);

  if (loadingConvs) {
    return (
      <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="w-72 border-r border-slate-200 p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-2.5 w-32 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 p-6 space-y-4 animate-pulse">
          <div className="h-6 w-44 rounded bg-slate-200" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className="w-2/3 h-12 bg-slate-100 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-white rounded-xl border border-slate-200">
        <div className="text-center p-8">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No conversations yet</p>
          <p className="text-sm text-slate-500 mt-1">You'll be able to message your teachers once enrolled in a course.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="w-72 shrink-0 flex flex-col border-r border-slate-200 bg-slate-50/50">
        <div className="px-4 py-3 border-b border-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Messages</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {conversations.map((conv, idx) => {
            const isActive = activeConv?.teacherId === conv.teacherId;
            const color = TEACHER_COLORS[idx % TEACHER_COLORS.length];
            return (
              <button
                key={conv.teacherId}
                type="button"
                onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                  isActive ? 'bg-blue-50 border-r-2 border-blue-600' : 'hover:bg-slate-100'
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {getInitials(conv.teacherName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                      {conv.teacherName}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(conv.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {conv.courses.map(c => c.code).join(', ')}
                  </p>
                  {conv.lastMessage && (
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
                      {conv.lastMessage.senderRole === 'student' ? 'You: ' : ''}{conv.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat Area ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Chat Header */}
          <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0">
            {(() => {
              const idx = conversations.findIndex(c => c.teacherId === activeConv.teacherId);
              const color = TEACHER_COLORS[idx % TEACHER_COLORS.length];
              return (
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {getInitials(activeConv.teacherName)}
                </div>
              );
            })()}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900 text-sm">{activeConv.teacherName}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <BookOpen className="w-3 h-3 text-slate-400" />
                {activeConv.courses.map((c, i) => (
                  <React.Fragment key={c.code}>
                    {i > 0 && <span className="text-slate-300 text-xs">·</span>}
                    <span className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-600">{c.code}</span> {c.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loadingMessages ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}>
                    <div className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48 bg-slate-100' : 'w-40 bg-blue-100'}`} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">No messages yet</p>
                <p className="text-xs text-slate-400 mt-1">Send a message to start the conversation.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isTeacher ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    msg.isTeacher
                      ? 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      : 'bg-blue-600 text-white rounded-br-sm'
                  }`}>
                    {msg.isTeacher && (
                      <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                        {msg.sender.firstName} {msg.sender.lastName}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.isTeacher ? 'text-slate-400' : 'text-blue-200'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="px-5 py-3 border-t border-slate-200 flex items-center gap-2 shrink-0 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={`Message ${activeConv.teacherName}…`}
              className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <ChevronRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMessages;
