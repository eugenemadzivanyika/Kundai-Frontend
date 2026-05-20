import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, FileText, User, BookOpen, Zap, GraduationCap, ClipboardCheck } from 'lucide-react';
import { notificationService } from '../../services/api';
import { motion } from 'framer-motion';
import SubmissionReviewModal from './SubmissionReviewModal';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [useResultId, setUseResultId] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (intervalRef.current !== null) { window.clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    fetchNotifications();
    intervalRef.current = window.setInterval(fetchNotifications, 30_000);
    return () => { if (intervalRef.current !== null) { window.clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(1, 50);
      setNotifications(response as unknown as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleOpenReview = async (notification: Notification) => {
    const resultId = notification.data?.resultId;
    const submissionId = notification.data?.submissionId;
    const id = resultId || submissionId;
    if (!id) return;
    setSelectedId(id);
    setUseResultId(!!resultId);
    setShowReviewModal(true);
    if (!notification.read) await handleMarkAsRead(notification._id);
  };

  const handleNavigateToPlan = async (notification: Notification) => {
    if (!notification.read) await handleMarkAsRead(notification._id);
    onClose();
    onNavigate?.('/dashboard/development');
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'urgent' ? 'text-red-600'
      : priority === 'high' ? 'text-orange-500'
      : priority === 'medium' ? 'text-blue-500'
      : 'text-gray-500';

    switch (type) {
      case 'assessment_needs_review': return <ClipboardCheck className={`w-5 h-5 ${iconClass}`} />;
      case 'plan_needs_activation':   return <Zap className={`w-5 h-5 ${iconClass}`} />;
      case 'plan_completed_by_student': return <GraduationCap className={`w-5 h-5 ${iconClass}`} />;
      case 'assignment_graded':        return <CheckCircle className={`w-5 h-5 ${iconClass}`} />;
      case 'assignment_submitted':     return <FileText className={`w-5 h-5 ${iconClass}`} />;
      case 'plan_assigned':
      case 'plan_activated':           return <User className={`w-5 h-5 ${iconClass}`} />;
      case 'coverage_updated':         return <BookOpen className="w-5 h-5 text-green-500" />;
      default:                         return <Bell className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high':   return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      default:       return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const isReviewable = (type: string) =>
    type === 'assessment_needs_review' || type === 'assignment_submitted' || type === 'assignment_graded';
  const isPlanAction = (type: string) =>
    type === 'plan_needs_activation' || type === 'plan_completed_by_student';

  const handleViewCoverage = async (notification: Notification) => {
    if (!notification.read) await handleMarkAsRead(notification._id);
    onClose();
    onNavigate?.('/resources?tab=coverage');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                  } hover:bg-opacity-75 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 shrink-0 ml-2">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>

                      {/* Action buttons */}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {isReviewable(notification.type) && (notification.data?.resultId || notification.data?.submissionId) && (
                          <button
                            onClick={() => handleOpenReview(notification)}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Review Submission
                          </button>
                        )}
                        {notification.type === 'plan_needs_activation' && (
                          <button
                            onClick={() => handleNavigateToPlan(notification)}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-green-600 text-white hover:bg-green-700"
                          >
                            Review &amp; Activate
                          </button>
                        )}
                        {notification.type === 'plan_completed_by_student' && (
                          <button
                            onClick={() => handleNavigateToPlan(notification)}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            View Plan
                          </button>
                        )}
                        {notification.type === 'coverage_updated' && (
                          <button
                            onClick={() => handleViewCoverage(notification)}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-green-600 text-white hover:bg-green-700"
                          >
                            View Coverage
                          </button>
                        )}
                        {!notification.read && !isReviewable(notification.type) && !isPlanAction(notification.type) && notification.type !== 'coverage_updated' && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            Mark read
                          </button>
                        )}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={async () => {
              await notificationService.markAllAsRead();
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }}
            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        </div>
      </motion.div>

      {showReviewModal && selectedId && (
        <SubmissionReviewModal
          isOpen={showReviewModal}
          onClose={() => { setShowReviewModal(false); setSelectedId(null); }}
          resultId={useResultId ? selectedId : undefined}
          submissionId={useResultId ? undefined : selectedId}
          onReviewComplete={fetchNotifications}
        />
      )}
    </>
  );
};

export default NotificationCenter;
