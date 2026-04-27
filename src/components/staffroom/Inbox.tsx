import React, { useState, useEffect, useRef } from 'react';
import { StaffMessage, ChatMessage, ChatConversation, Student } from '../../types';
import { staffMessageService } from '../../services/staffMessageService';
import { chatService } from '../../services/chatService';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

// ── Types ──────────────────────────────────────────────────────────────────────
interface QuickReply {
  label: string;
  text: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const QUICK_REPLIES: QuickReply[] = [
  { label: 'Extension', text: 'Extension granted until Wednesday at 11:59 PM.' },
  { label: 'Office Hrs', text: 'Please come to office hours on Thursday.' },
  { label: 'Noted', text: 'I have noted your request.' },
  { label: 'Submit LMS', text: 'Please submit via the LMS portal.' },
  { label: 'Well done', text: 'Well done, keep it up.' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function mapMessage(m: any): ChatMessage {
  return {
    id: m._id || m.id || String(Date.now()),
    sender: m.sender || { _id: '', firstName: '', lastName: '' },
    content: m.content,
    timestamp: new Date(m.timestamp || m.createdAt || Date.now()),
    read: m.read ?? false,
    chatId: m.chat || m.chatId || '',
    isTeacher: m.senderRole === 'teacher',
    createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
  };
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function scoreColor(s: number): string {
  return s >= 70 ? '#0d9488' : s >= 50 ? '#d97706' : '#ef4444';
}

function scoreBg(s: number): string {
  return s >= 70 ? '#f0fdfa' : s >= 50 ? '#fffbeb' : '#fef2f2';
}

function scoreBorder(s: number): string {
  return s >= 70 ? '#5eead433' : s >= 50 ? '#fcd34d33' : '#fca5a533';
}

// ── SVG Icon Component ─────────────────────────────────────────────────────────
const Ico: React.FC<{ d: string | string[]; size?: number; color?: string }> = ({
  d,
  size = 14,
  color = 'currentColor',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {(Array.isArray(d) ? d : [d]).map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

const ICONS = {
  inbox:   ['M22 12h-6l-2 3h-4l-2-3H2','M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
  users:   ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  compose: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  plus:    ['M12 5v14','M5 12h14'],
  send:    ['M22 2L11 13','M22 2l-7 20-4-9-9-4 20-7z'],
  reply:   ['M9 14L4 9l5-5','M20 20v-7a4 4 0 0 0-4-4H4'],
  trash:   ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'],
  check2:  ['M18 6L7 17l-5-5','M22 6l-9.5 9.5'],
  zap:     ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  trending:['M22 7l-8.5 8.5-5-5L2 17','M22 7h-5','M22 7v5'],
  book:    ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  x:       ['M18 6L6 18','M6 6l12 12'],
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface InboxRowProps {
  msg: StaffMessage;
  active: boolean;
  onClick: () => void;
}

const InboxRow: React.FC<InboxRowProps> = ({ msg, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      cursor: 'pointer',
      background: active ? '#f0fdfa' : 'white',
      borderLeft: `2.5px solid ${active ? '#0d9488' : 'transparent'}`,
      borderBottom: '1px solid #f4f4f5',
      transition: 'all 0.1s',
    }}
  >
    <div
      style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900,
        background: active ? '#ccfbf1' : '#f4f4f5',
        color: active ? '#0f766e' : '#71717a',
        border: `1.5px solid ${active ? '#5eead4' : '#e4e4e7'}`,
      }}
    >
      {initials(`${msg.sender.firstName} ${msg.sender.lastName}`)}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontSize: 12, fontWeight: msg.read ? 600 : 800,
            color: active ? '#0f766e' : '#27272a',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {msg.sender.firstName} {msg.sender.lastName}
        </span>
        <span style={{ fontSize: 9, color: '#a1a1aa', fontWeight: 500, flexShrink: 0 }}>
          {formatTime(msg.createdAt)}
        </span>
      </div>
      <p
        style={{
          fontSize: 10, fontWeight: msg.read ? 500 : 700, color: '#52525b', marginTop: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {msg.subject}
      </p>
      <p
        style={{
          fontSize: 10, color: '#a1a1aa', marginTop: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {msg.body}
      </p>
    </div>
    {!msg.read && (
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d9488', flexShrink: 0, marginTop: 4 }} />
    )}
  </div>
);

interface ConvRowProps {
  conv: ChatConversation;
  active: boolean;
  onClick: () => void;
}

const ConvRow: React.FC<ConvRowProps> = ({ conv, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      cursor: 'pointer',
      background: active ? '#f0fdfa' : 'white',
      borderLeft: `2.5px solid ${active ? '#0d9488' : 'transparent'}`,
      borderBottom: '1px solid #f4f4f5',
      transition: 'all 0.1s',
    }}
  >
    <div
      style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900,
        background: active ? '#ccfbf1' : '#f4f4f5',
        color: active ? '#0f766e' : '#71717a',
        border: `1.5px solid ${active ? '#5eead4' : '#e4e4e7'}`,
      }}
    >
      {initials(conv.studentName)}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: conv.unreadCount > 0 ? 800 : 600,
            color: active ? '#0f766e' : '#27272a',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {conv.studentName}
        </span>
        {conv.lastMessage && (
          <span style={{ fontSize: 9, color: '#a1a1aa', fontWeight: 500, flexShrink: 0 }}>
            {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginTop: 1 }}>
        <p
          style={{
            fontSize: 10, color: '#71717a', fontWeight: conv.unreadCount > 0 ? 700 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {conv.lastMessage
            ? (conv.lastMessage.senderRole === 'teacher'
                ? <span style={{ color: '#a1a1aa' }}>You: </span>
                : null)
            : null}
          {conv.lastMessage?.content ?? 'No messages yet'}
        </p>
        {conv.unreadCount > 0 && (
          <span
            style={{
              minWidth: 16, height: 16, borderRadius: 8, background: '#0d9488',
              color: 'white', fontSize: 9, fontWeight: 900, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0,
            }}
          >
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>
    </div>
  </div>
);

interface BubbleProps {
  msg: ChatMessage;
}

const Bubble: React.FC<BubbleProps> = ({ msg }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: msg.isTeacher ? 'flex-end' : 'flex-start',
      marginBottom: 6,
    }}
  >
    <div style={{ maxWidth: '70%' }}>
      <div
        style={{
          padding: '8px 12px', fontSize: 12, lineHeight: 1.6,
          borderRadius: msg.isTeacher ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
          background: msg.isTeacher ? '#0f766e' : '#f4f4f5',
          color: msg.isTeacher ? 'white' : '#27272a',
        }}
      >
        {msg.content}
      </div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 4, marginTop: 2,
          justifyContent: msg.isTeacher ? 'flex-end' : 'flex-start',
        }}
      >
        <span style={{ fontSize: 9, color: '#a1a1aa' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {msg.isTeacher && <Ico d={ICONS.check2} size={10} color="#0d9488" />}
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const Inbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'chat'>('inbox');

  // ── Inbox state ──
  const [inboxMessages, setInboxMessages] = useState<StaffMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<StaffMessage | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // ── Compose state (NEW) ──
  const [composing, setComposing] = useState(false);
  const [compTo, setCompTo] = useState('');
  const [compSubj, setCompSubj] = useState('');
  const [compBody, setCompBody] = useState('');
  const [sendingCompose, setSendingCompose] = useState(false);
  const [staffList, setStaffList] = useState<Array<{ _id: string; firstName: string; lastName: string; role: string }>>([]);

  // ── Chat state ──
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // ── New Chat picker state (NEW) ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // ── Quick replies state (NEW) ──
  const [showQuick, setShowQuick] = useState(false);

  // ── Online presence state ──
  const [onlineStudents, setOnlineStudents] = useState<Set<string>>(new Set());

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authService.getCurrentUser();

  // ── Tab style helper ──
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: active ? '#0f766e' : '#a1a1aa',
    background: 'none', border: 'none',
    borderBottom: `2.5px solid ${active ? '#0d9488' : 'transparent'}`,
    cursor: 'pointer', transition: 'all 0.12s',
  });

  // ── Inbox effects ──
  useEffect(() => {
    if (activeTab === 'inbox') {
      loadInbox();
      if (staffList.length === 0) loadStaff();
    }
  }, [activeTab]);

  async function loadStaff() {
    try {
      const data = await staffMessageService.getStaff();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  }

  async function loadInbox() {
    setLoadingInbox(true);
    try {
      const data = await staffMessageService.getInbox();
      setInboxMessages(data);
      if (data.length > 0 && !selectedMsg) setSelectedMsg(data[0]);
    } catch (err) {
      console.error('Failed to load inbox:', err);
    } finally {
      setLoadingInbox(false);
    }
  }

  async function handleSelectMessage(msg: StaffMessage) {
    setSelectedMsg(msg);
    setComposing(false);
    setReplyOpen(false);
    setReplyBody('');
    if (!msg.read) {
      try {
        await staffMessageService.markAsRead(msg._id);
        setInboxMessages(prev => prev.map(m => m._id === msg._id ? { ...m, read: true } : m));
      } catch { /* ignore */ }
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || !selectedMsg || sendingReply) return;
    setSendingReply(true);
    try {
      await staffMessageService.send(
        selectedMsg.sender._id,
        `Re: ${selectedMsg.subject}`,
        replyBody.trim()
      );
      setReplyBody('');
      setReplyOpen(false);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  }

  async function handleDelete(msgId: string) {
    try {
      await staffMessageService.delete(msgId);
      const remaining = inboxMessages.filter(m => m._id !== msgId);
      setInboxMessages(remaining);
      setSelectedMsg(remaining.length > 0 ? remaining[0] : null);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }

  /**
   * NEW: Compose & send a new staff message.
   * Requires backend: POST /api/staff-messages with { recipientId, subject, body }
   * staffMessageService.send() already supports this signature — but you will need
   * to look up the recipient's _id from a staff directory endpoint:
   *   GET /api/staff  →  returns { _id, firstName, lastName, role }[]
   * The <select> below should be populated from that endpoint.
   */
  async function handleCompose(e: React.FormEvent) {
    e.preventDefault();
    if (!compTo || !compSubj.trim() || !compBody.trim() || sendingCompose) return;
    setSendingCompose(true);
    try {
      await staffMessageService.send(compTo, compSubj.trim(), compBody.trim());
      setComposing(false);
      setCompTo('');
      setCompSubj('');
      setCompBody('');
    } catch (err) {
      console.error('Failed to send composed message:', err);
    } finally {
      setSendingCompose(false);
    }
  }

  // ── Chat effects ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (activeTab !== 'chat') return;
    loadConversations();
    loadAllStudents();

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('presence_update', ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineStudents(prev => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeTab]);

  useEffect(() => {
    if (!selectedStudentId || !socketRef.current || !currentUser) return;
    const chatId = `chat_${currentUser._id}_${selectedStudentId}`;
    socketRef.current.emit('join_chat', { chatId });

    const handleReceive = (data: any) => {
      if (data.senderRole === 'teacher') return;
      setChatMessages(prev => [...prev, mapMessage(data)]);
      setConversations(prev =>
        prev.map(c =>
          c.studentId === selectedStudentId
            ? { ...c, lastMessage: { content: data.content, timestamp: new Date(data.timestamp || Date.now()), senderRole: data.senderRole || 'student' } }
            : c
        )
      );
    };

    socketRef.current.on('receive_message', handleReceive);
    return () => { socketRef.current?.off('receive_message', handleReceive); };
  }, [selectedStudentId, currentUser]);

  async function loadConversations() {
    setLoadingConversations(true);
    try {
      setConversations(await chatService.getConversations());
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }

  /**
   * NEW: Load all students so the "New Chat" picker can show students without
   * an existing conversation.
   * Requires backend: GET /api/students  →  Student[]
   * (studentService.getStudents() or similar)
   */
  async function loadAllStudents() {
    try {
      const students = await studentService.getStudents();
      setAllStudents(students);
    } catch (err) {
      console.error('Failed to load students list:', err);
    }
  }

  async function handleSelectStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setSelectedStudentProfile(null);
    setLoadingMessages(true);
    setChatMessages([]);
    setShowQuick(false);
    setPickerOpen(false);

    const [rawMessages] = await Promise.allSettled([
      chatService.getMessages(studentId),
      studentService.getStudent(studentId).then(p => setSelectedStudentProfile(p)).catch(() => {}),
    ]);

    if (rawMessages.status === 'fulfilled') {
      setChatMessages((rawMessages.value as any[]).map(mapMessage));
    }

    try {
      await chatService.markAsRead(studentId);
      setConversations(prev =>
        prev.map(c => (c.studentId === studentId ? { ...c, unreadCount: 0 } : c))
      );
    } catch { /* non-critical */ }

    setLoadingMessages(false);
  }

  /**
   * NEW: Start a fresh chat with a student who has no existing conversation.
   * Requires backend: POST /api/chats  →  { studentId }  →  ChatConversation
   * (chatService.startConversation(studentId) — new method needed)
   */
  async function handleStartNewChat(student: Student) {
    const exists = conversations.find(c => c.studentId === student.id);
    if (!exists) {
      try {
        const newConv = await chatService.startConversation(student.id);
        setConversations(prev => [newConv, ...prev]);
      } catch (err) {
        console.error('Failed to start conversation:', err);
        return;
      }
    }
    handleSelectStudent(student.id);
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudentId || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setShowQuick(false);
    try {
      const saved = await chatService.sendMessage(selectedStudentId, content);
      setChatMessages(prev => [...prev, mapMessage({ ...(saved as any), senderRole: 'teacher' })]);
      setConversations(prev =>
        prev.map(c =>
          c.studentId === selectedStudentId
            ? { ...c, lastMessage: { content, timestamp: new Date(), senderRole: 'teacher' } }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  }

  function handleQuickReply(text: string) {
    setNewMessage(text);
    setShowQuick(false);
  }

  const selectedConv = conversations.find(c => c.studentId === selectedStudentId);
  const unreadInboxCount = inboxMessages.filter(m => !m.read).length;
  const totalUnreadChat = conversations.reduce((a, c) => a + c.unreadCount, 0);

  // Students not yet in a conversation (for picker) — compare by custom school ID
  const newChatStudents = allStudents.filter(
    s => !conversations.find(c => c.studentId === s.id)
  );

  return (
    <div
      style={{
        height: 'calc(100vh - 180px)',
        display: 'flex',
        background: 'white',
        borderRadius: 12,
        border: '1.5px solid #e4e4e7',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        style={{
          width: 300, flexShrink: 0, borderRight: '1px solid #f4f4f5',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: 'flex', borderBottom: '1px solid #f4f4f5',
            flexShrink: 0, background: '#fafafa',
          }}
        >
          <button style={tabStyle(activeTab === 'inbox')} onClick={() => setActiveTab('inbox')}>
            <Ico d={ICONS.inbox} size={13} color={activeTab === 'inbox' ? '#0d9488' : '#a1a1aa'} />
            Inbox
            {unreadInboxCount > 0 && (
              <span
                style={{
                  minWidth: 16, height: 16, borderRadius: 8, background: '#ef4444',
                  color: 'white', fontSize: 9, fontWeight: 900, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}
              >
                {unreadInboxCount}
              </span>
            )}
          </button>
          <button style={tabStyle(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
            <Ico d={ICONS.users} size={13} color={activeTab === 'chat' ? '#0d9488' : '#a1a1aa'} />
            Students
            {totalUnreadChat > 0 && (
              <span
                style={{
                  minWidth: 16, height: 16, borderRadius: 8, background: '#0d9488',
                  color: 'white', fontSize: 9, fontWeight: 900, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}
              >
                {totalUnreadChat}
              </span>
            )}
          </button>
        </div>

        {/* Action bar — Compose / New Chat buttons (NEW) */}
        <div
          style={{
            padding: '8px 10px', borderBottom: '1px solid #f4f4f5', flexShrink: 0,
          }}
        >
          {activeTab === 'inbox' ? (
            <button
              onClick={() => { setComposing(true); setSelectedMsg(null); setReplyOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '7px', borderRadius: 8,
                border: `1.5px solid ${composing ? '#0d9488' : '#5eead4'}`,
                background: composing ? '#0d9488' : '#f0fdfa',
                color: composing ? 'white' : '#0f766e',
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.05em', cursor: 'pointer',
              }}
            >
              <Ico d={ICONS.compose} size={13} color={composing ? 'white' : '#0d9488'} />
              Compose
            </button>
          ) : (
            <button
              onClick={() => setPickerOpen(p => !p)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '7px', borderRadius: 8,
                border: `1.5px solid ${pickerOpen ? '#0d9488' : '#5eead4'}`,
                background: pickerOpen ? '#0d9488' : '#f0fdfa',
                color: pickerOpen ? 'white' : '#0f766e',
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.05em', cursor: 'pointer',
              }}
            >
              <Ico d={ICONS.plus} size={13} color={pickerOpen ? 'white' : '#0d9488'} />
              New Chat
            </button>
          )}
        </div>

        {/* Student picker dropdown (NEW) */}
        {activeTab === 'chat' && pickerOpen && (
          <div
            style={{
              borderBottom: '1px solid #f4f4f5', flexShrink: 0,
              maxHeight: 200, overflowY: 'auto', background: '#fafafa',
            }}
          >
            {newChatStudents.length === 0 ? (
              <div style={{ padding: '12px', fontSize: 11, color: '#a1a1aa', fontStyle: 'italic', textAlign: 'center' }}>
                All students have active chats.
              </div>
            ) : (
              newChatStudents.map(s => (
                <div
                  key={s._id}
                  onClick={() => handleStartNewChat(s)}
                  style={{
                    padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 9,
                    cursor: 'pointer', borderBottom: '1px solid #f4f4f5',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0fdfa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: 7, background: '#f4f4f5',
                      border: '1px solid #e4e4e7', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#71717a', flexShrink: 0,
                    }}
                  >
                    {initials(`${s.firstName} ${s.lastName}`)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#27272a' }}>
                      {s.firstName} {s.lastName}
                    </div>
                    <div style={{ fontSize: 9, color: '#a1a1aa' }}>
                      OVR {s.overall}
                    </div>
                  </div>
                  <Ico d={ICONS.plus} size={12} color="#0d9488" />
                </div>
              ))
            )}
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'inbox' ? (
            loadingInbox ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>
                Loading…
              </div>
            ) : inboxMessages.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>
                Your inbox is empty.
              </div>
            ) : (
              inboxMessages.map(msg => (
                <InboxRow
                  key={msg._id}
                  msg={msg}
                  active={!composing && selectedMsg?._id === msg._id}
                  onClick={() => handleSelectMessage(msg)}
                />
              ))
            )
          ) : loadingConversations ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>
              Loading conversations…
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>
              No student conversations yet.
            </div>
          ) : (
            conversations.map(conv => (
              <ConvRow
                key={conv.studentId}
                conv={conv}
                active={selectedStudentId === conv.studentId}
                onClick={() => handleSelectStudent(conv.studentId)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ─── COMPOSE panel (NEW) ─── */}
        {activeTab === 'inbox' && composing && (
          <form
            onSubmit={handleCompose}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '12px 18px', borderBottom: '1px solid #f4f4f5',
                background: '#fafafa', flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#18181b' }}>New Message</div>
            </div>
            <div
              style={{
                flex: 1, overflowY: 'auto', padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}
            >
              {/* To */}
              <div>
                <label
                  style={{
                    fontSize: 10, fontWeight: 800, color: '#a1a1aa',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'block', marginBottom: 5,
                  }}
                >
                  To
                </label>
                {/*
                  NOTE: populate this <select> from GET /api/staff
                  compTo should store the recipient's _id (string)
                */}
                <select
                  value={compTo}
                  onChange={e => setCompTo(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', border: '1.5px solid #e4e4e7',
                    borderRadius: 9, fontSize: 12,
                    color: compTo ? '#18181b' : '#a1a1aa',
                    background: '#fafafa', fontFamily: 'inherit',
                  }}
                >
                  <option value="">Select recipient…</option>
                  {staffList.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
              {/* Subject */}
              <div>
                <label
                  style={{
                    fontSize: 10, fontWeight: 800, color: '#a1a1aa',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'block', marginBottom: 5,
                  }}
                >
                  Subject
                </label>
                <input
                  value={compSubj}
                  onChange={e => setCompSubj(e.target.value)}
                  placeholder="Enter subject…"
                  style={{
                    width: '100%', padding: '8px 12px', border: '1.5px solid #e4e4e7',
                    borderRadius: 9, fontSize: 12, color: '#18181b', background: '#fafafa',
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#5eead4')}
                  onBlur={e => (e.target.style.borderColor = '#e4e4e7')}
                />
              </div>
              {/* Body */}
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 10, fontWeight: 800, color: '#a1a1aa',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'block', marginBottom: 5,
                  }}
                >
                  Message
                </label>
                <textarea
                  value={compBody}
                  onChange={e => setCompBody(e.target.value)}
                  placeholder="Write your message…"
                  rows={8}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1.5px solid #e4e4e7',
                    borderRadius: 9, fontSize: 12, color: '#18181b', background: '#fafafa',
                    resize: 'vertical', lineHeight: 1.7, outline: 'none', fontFamily: 'inherit',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#5eead4')}
                  onBlur={e => (e.target.style.borderColor = '#e4e4e7')}
                />
              </div>
            </div>
            <div
              style={{
                borderTop: '1px solid #f4f4f5', padding: '10px 18px',
                display: 'flex', gap: 8, flexShrink: 0,
              }}
            >
              <button
                type="submit"
                disabled={!compTo || !compSubj.trim() || !compBody.trim() || sendingCompose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: '#0d9488',
                  color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px',
                  fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                  opacity: (!compTo || !compSubj.trim() || !compBody.trim()) ? 0.45 : 1,
                  cursor: (!compTo || !compSubj.trim() || !compBody.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                <Ico d={ICONS.send} size={12} color="white" />
                {sendingCompose ? 'Sending…' : 'Send'}
              </button>
              <button
                type="button"
                onClick={() => { setComposing(false); setCompTo(''); setCompSubj(''); setCompBody(''); }}
                style={{
                  padding: '8px 14px', border: '1.5px solid #e4e4e7', borderRadius: 8,
                  fontSize: 11, fontWeight: 700, color: '#71717a', background: 'none', cursor: 'pointer',
                }}
              >
                Discard
              </button>
            </div>
          </form>
        )}

        {/* ─── INBOX detail ─── */}
        {activeTab === 'inbox' && !composing && selectedMsg && (
          <>
            {/* Header */}
            <div
              style={{
                padding: '12px 18px', borderBottom: '1px solid #f4f4f5',
                background: '#fafafa', flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: 10, background: '#f4f4f5',
                      border: '1.5px solid #e4e4e7', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#52525b', flexShrink: 0,
                    }}
                  >
                    {initials(`${selectedMsg.sender.firstName} ${selectedMsg.sender.lastName}`)}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#18181b' }}>
                      {selectedMsg.sender.firstName} {selectedMsg.sender.lastName}
                    </span>
                    <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 1, fontWeight: 500 }}>
                      {selectedMsg.sender.role} · {formatTime(selectedMsg.createdAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(selectedMsg._id)}
                  style={{ color: '#a1a1aa', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Ico d={ICONS.trash} size={14} />
                </button>
              </div>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#18181b', marginTop: 10 }}>
                {selectedMsg.subject}
              </h2>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px' }}>
              <p style={{ fontSize: 13, color: '#3f3f46', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {selectedMsg.body}
              </p>
            </div>

            {/* Reply */}
            <div style={{ borderTop: '1px solid #f4f4f5', flexShrink: 0 }}>
              {replyOpen ? (
                <form
                  onSubmit={handleReply}
                  style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 600 }}>
                    To: {selectedMsg.sender.firstName} {selectedMsg.sender.lastName} · Re: {selectedMsg.subject}
                  </div>
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    placeholder="Write your reply…"
                    rows={3}
                    autoFocus
                    disabled={sendingReply}
                    style={{
                      width: '100%', border: '1.5px solid #e4e4e7', borderRadius: 9,
                      padding: '10px 12px', fontSize: 12, color: '#27272a',
                      resize: 'none', lineHeight: 1.6, background: '#fafafa',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#5eead4')}
                    onBlur={e => (e.target.style.borderColor = '#e4e4e7')}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="submit"
                      disabled={!replyBody.trim() || sendingReply}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, background: '#0d9488',
                        color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px',
                        fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                        cursor: replyBody.trim() ? 'pointer' : 'not-allowed',
                        opacity: replyBody.trim() ? 1 : 0.5,
                      }}
                    >
                      <Ico d={ICONS.send} size={12} color="white" />
                      {sendingReply ? 'Sending…' : 'Send'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyOpen(false); setReplyBody(''); }}
                      style={{
                        padding: '7px 14px', border: '1.5px solid #e4e4e7', borderRadius: 8,
                        fontSize: 11, fontWeight: 700, color: '#71717a', background: 'none', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: '10px 18px' }}>
                  <button
                    onClick={() => setReplyOpen(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdfa',
                      color: '#0f766e', border: '1.5px solid #5eead4', borderRadius: 8,
                      padding: '7px 16px', fontSize: 11, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                    }}
                  >
                    <Ico d={ICONS.reply} size={13} color="#0d9488" />
                    Reply
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── INBOX empty state ─── */}
        {activeTab === 'inbox' && !composing && !selectedMsg && (
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: '#d4d4d8', gap: 8,
            }}
          >
            <Ico d={ICONS.inbox} size={36} color="#d4d4d8" />
            <span style={{ fontSize: 13, color: '#a1a1aa', fontStyle: 'italic' }}>
              Select a message to read
            </span>
          </div>
        )}

        {/* ─── CHAT detail ─── */}
        {activeTab === 'chat' && selectedStudentId && (
          <>
            {/* Student header */}
            <div
              style={{
                padding: '10px 16px', borderBottom: '1px solid #f4f4f5', background: '#fafafa',
                display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: 9, background: '#ccfbf1',
                  border: '1.5px solid #5eead4', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#0f766e', flexShrink: 0,
                }}
              >
                {selectedConv ? initials(selectedConv.studentName) : '??'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#18181b' }}>
                    {selectedConv?.studentName}
                  </span>
                  {/* Online indicator — driven by socket presence */}
                  {selectedConv?.userId && onlineStudents.has(selectedConv.userId) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ fontSize: 9, color: '#71717a', fontWeight: 600 }}>Online</span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 500 }}>Student</span>
              </div>

              {/* Context chips */}
              {selectedStudentProfile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* Overall score chip */}
                  <div
                    style={{
                      background: scoreBg(selectedStudentProfile.overall),
                      border: `1px solid ${scoreBorder(selectedStudentProfile.overall)}`,
                      borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <Ico d={ICONS.trending} size={11} color={scoreColor(selectedStudentProfile.overall)} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor(selectedStudentProfile.overall) }}>
                      OVR {selectedStudentProfile.overall}
                    </span>
                  </div>

                  {/* Active plan chip */}
                  {(selectedStudentProfile.activePlan as any) ? (
                    <div
                      style={{
                        background: '#f4f4f5', border: '1px solid #e4e4e7',
                        borderRadius: 8, padding: '5px 12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9, fontWeight: 700, color: '#71717a',
                          maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {(selectedStudentProfile.activePlan as any).title ?? 'Active Plan'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <div
                          style={{
                            flex: 1, height: 3, background: '#e4e4e7',
                            borderRadius: 99, overflow: 'hidden', width: 80,
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${(selectedStudentProfile.activePlan as any).progress ?? 0}%`,
                              background: '#0d9488', borderRadius: 99,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#0d9488' }}>
                          {(selectedStudentProfile.activePlan as any).progress ?? 0}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#fef2f2', border: '1px solid #fca5a5',
                        borderRadius: 8, padding: '5px 10px',
                      }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#991b1b' }}>No active plan</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: '#a1a1aa', padding: '32px 0', fontSize: 13 }}>
                  Loading messages…
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#a1a1aa', padding: '32px 0', fontSize: 13 }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map(msg => <Bubble key={msg.id} msg={msg} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies tray (NEW) */}
            {showQuick && (
              <div
                style={{
                  borderTop: '1px solid #f4f4f5', padding: '8px 14px',
                  display: 'flex', gap: 6, flexWrap: 'wrap',
                  background: '#fafafa', flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 9, fontWeight: 800, color: '#a1a1aa',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    alignSelf: 'center', marginRight: 4,
                  }}
                >
                  Quick
                </span>
                {QUICK_REPLIES.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(r.text)}
                    style={{
                      fontSize: 10, fontWeight: 700, color: '#0f766e', background: '#f0fdfa',
                      border: '1.5px solid #5eead4', borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              style={{
                borderTop: '1px solid #f4f4f5', padding: '9px 14px',
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              }}
            >
              {/* Quick reply toggle button (NEW) */}
              <button
                onClick={() => setShowQuick(s => !s)}
                style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: showQuick ? '#f0fdfa' : '#f4f4f5',
                  border: `1.5px solid ${showQuick ? '#5eead4' : '#e4e4e7'}`,
                  color: showQuick ? '#0d9488' : '#a1a1aa', transition: 'all 0.12s', cursor: 'pointer',
                }}
                title="Quick replies"
              >
                <Ico d={ICONS.zap} size={14} />
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat(e as any);
                  }
                }}
                placeholder="Type a message…"
                disabled={sending}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: 9,
                  border: '1.5px solid #e4e4e7', fontSize: 12, color: '#18181b',
                  background: '#fafafa', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = '#5eead4')}
                onBlur={e => (e.target.style.borderColor = '#e4e4e7')}
              />
              <button
                onClick={handleSendChat as any}
                disabled={!newMessage.trim() || sending}
                style={{
                  width: 34, height: 34, borderRadius: 9, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: newMessage.trim() ? '#0d9488' : '#f4f4f5',
                  border: 'none', color: newMessage.trim() ? 'white' : '#a1a1aa',
                  transition: 'all 0.15s', cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <Ico d={ICONS.send} size={14} color={newMessage.trim() ? 'white' : '#a1a1aa'} />
              </button>
            </div>
          </>
        )}

        {/* ─── CHAT empty state ─── */}
        {activeTab === 'chat' && !selectedStudentId && (
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: '#d4d4d8', gap: 8,
            }}
          >
            <Ico d={ICONS.users} size={36} color="#d4d4d8" />
            <span style={{ fontSize: 13, color: '#a1a1aa', fontStyle: 'italic' }}>
              Select a student to chat
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;