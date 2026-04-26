import React, { useState, useEffect, useRef } from 'react';
import { StaffMessage, ChatMessage, ChatConversation, Student } from '../../types';
import { Inbox as InboxIcon, Users, Send, Trash2, CornerUpLeft, TrendingUp, BookOpen } from 'lucide-react';
import { staffMessageService } from '../../services/staffMessageService';
import { chatService } from '../../services/chatService';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

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

const Inbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inbox');

  // Inbox state
  const [inboxMessages, setInboxMessages] = useState<StaffMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<StaffMessage | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Student chat state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authService.getCurrentUser();

  // --- Inbox effects ---
  useEffect(() => {
    if (activeTab === 'inbox') loadInbox();
  }, [activeTab]);

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
    setReplyOpen(false);
    setReplyBody('');
    if (!msg.read) {
      try {
        await staffMessageService.markAsRead(msg._id);
        setInboxMessages(prev =>
          prev.map(m => (m._id === msg._id ? { ...m, read: true } : m))
        );
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

  // --- Chat effects ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (activeTab !== 'chat') return;

    loadConversations();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

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

  async function handleSelectStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setSelectedStudentProfile(null);
    setLoadingMessages(true);
    setChatMessages([]);

    // Fetch messages and student profile in parallel
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

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudentId || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
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

  const selectedConv = conversations.find(c => c.studentId === selectedStudentId);
  const unreadCount = inboxMessages.filter(m => !m.read).length;

  return (
    <div className="flex h-[calc(100vh-180px)]">
      {/* Left panel */}
      <div className="w-2/5 bg-white border-r flex flex-col">
        {/* Tab bar */}
        <div className="flex border-b flex-shrink-0">
          <button
            className={`flex-1 py-3 flex justify-center items-center text-sm font-medium transition-colors relative ${
              activeTab === 'inbox' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('inbox')}
          >
            <InboxIcon size={16} className="mr-2" />
            INBOX
            {unreadCount > 0 && activeTab !== 'inbox' && (
              <span className="absolute top-1.5 right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            className={`flex-1 py-3 flex justify-center items-center text-sm font-medium transition-colors ${
              activeTab === 'chat' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('chat')}
          >
            <Users size={16} className="mr-2" />
            STUDENT CHAT
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y">
          {activeTab === 'inbox' ? (
            loadingInbox ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : inboxMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Your inbox is empty.</div>
            ) : (
              inboxMessages.map(msg => (
                <div
                  key={msg._id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedMsg?._id === msg._id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectMessage(msg)}
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-white font-semibold text-xs">
                      {`${msg.sender.firstName[0]}${msg.sender.lastName[0]}`.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!msg.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {msg.sender.firstName} {msg.sender.lastName}
                      </p>
                      <p className={`text-sm truncate ${!msg.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{msg.body}</p>
                    </div>
                    <div className="ml-2 flex flex-col items-end flex-shrink-0 gap-1">
                      <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                      {!msg.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : loadingConversations ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No student conversations yet.</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.studentId}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedStudentId === conv.studentId ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectStudent(conv.studentId)}
              >
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-white font-semibold text-xs">
                    {conv.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${conv.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                      {conv.studentName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {conv.lastMessage
                        ? (conv.lastMessage.senderRole === 'teacher' ? 'You: ' : '') + conv.lastMessage.content
                        : 'No messages yet'}
                    </p>
                  </div>
                  <div className="ml-2 flex flex-col items-end gap-1 flex-shrink-0">
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-3/5 bg-white flex flex-col">
        {activeTab === 'inbox' ? (
          selectedMsg ? (
            <>
              {/* Message header */}
              <div className="p-5 border-b flex-shrink-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-11 h-11 bg-gray-700 rounded-full flex items-center justify-center mr-3 text-white font-semibold text-sm">
                      {`${selectedMsg.sender.firstName[0]}${selectedMsg.sender.lastName[0]}`.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedMsg.sender.firstName} {selectedMsg.sender.lastName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{selectedMsg.sender.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(selectedMsg.createdAt).toLocaleString([], {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(selectedMsg._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{selectedMsg.subject}</h2>
              </div>

              {/* Message body */}
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedMsg.body}</p>
              </div>

              {/* Reply area */}
              <div className="border-t flex-shrink-0">
                {replyOpen ? (
                  <form onSubmit={handleReply} className="p-4 space-y-3">
                    <div className="text-xs text-gray-500 font-medium">
                      To: {selectedMsg.sender.firstName} {selectedMsg.sender.lastName}
                      &nbsp;·&nbsp; Subject: Re: {selectedMsg.subject}
                    </div>
                    <textarea
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder="Write your reply..."
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      disabled={sendingReply}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!replyBody.trim() || sendingReply}
                        className="bg-blue-500 text-white px-5 py-1.5 rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send size={14} />
                        {sendingReply ? 'Sending...' : 'Send'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReplyOpen(false); setReplyBody(''); }}
                        className="px-5 py-1.5 rounded-md text-sm border hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 flex gap-3">
                    <button
                      onClick={() => setReplyOpen(true)}
                      className="bg-blue-500 text-white rounded-md py-2 px-6 hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
                    >
                      <CornerUpLeft size={15} />
                      Reply
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <InboxIcon size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Select a message to read</p>
            </div>
          )
        ) : selectedStudentId ? (
          <>
            <div className="px-4 py-3 border-b flex items-center flex-shrink-0 gap-3">
              {/* Avatar + name */}
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                {selectedConv?.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 leading-tight">{selectedConv?.studentName}</h3>
                <p className="text-xs text-gray-500">Student</p>
              </div>

              {/* Overall + plan — right side */}
              {selectedStudentProfile && (
                <div className="ml-auto flex items-center gap-3 flex-shrink-0">
                  {/* Overall score */}
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} className={
                      selectedStudentProfile.overall >= 70 ? 'text-green-500' :
                      selectedStudentProfile.overall >= 50 ? 'text-yellow-500' : 'text-red-400'
                    } />
                    <span className={`text-sm font-bold ${
                      selectedStudentProfile.overall >= 70 ? 'text-green-600' :
                      selectedStudentProfile.overall >= 50 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {selectedStudentProfile.overall}%
                    </span>
                    <span className="text-xs text-gray-400">overall</span>
                  </div>

                  {/* Divider */}
                  <div className="h-8 w-px bg-gray-200" />

                  {/* Active plan */}
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-400" />
                    {selectedStudentProfile.activePlan ? (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-700 leading-tight">
                          {(selectedStudentProfile.activePlan as any).plan?.name ?? 'Active Plan'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(selectedStudentProfile.activePlan as any).currentProgress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {(selectedStudentProfile.activePlan as any).currentProgress ?? 0}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No active plan</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMessages ? (
                <div className="text-center text-gray-400 py-8 text-sm">Loading messages...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">No messages yet. Start the conversation!</div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isTeacher ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      msg.isTeacher
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.isTeacher ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-4 border-t flex items-center space-x-2 flex-shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-gray-50"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Users size={48} className="mb-3 opacity-30" />
            <p className="text-sm">Select a student to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
