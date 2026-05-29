import React, { useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import type { AppNotification } from '../../types/notifications';
import { markNotificationRead } from '../../services/notificationFeedService';

type Props = {
  open: boolean;
  onClose: () => void;
  items: AppNotification[];
  uid: string;
  hubFilterLabel?: string;
};

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleDateString();
}

const typeColors: Record<string, string> = {
  check_in: 'bg-emerald-100 text-emerald-800',
  check_out: 'bg-slate-100 text-slate-700',
  late: 'bg-amber-100 text-amber-800',
  award: 'bg-purple-100 text-purple-800',
  announcement: 'bg-blue-100 text-blue-800',
};

export const NotificationPanel: React.FC<Props> = ({
  open,
  onClose,
  items,
  uid,
  hubFilterLabel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-[200] cursor-pointer"
        role="presentation"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[201] flex flex-col"
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#0052CC]" />
            <h2 className="font-bold text-gray-900">Notifications</h2>
          </div>
          <button
            type="button"
            data-ui="icon"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {hubFilterLabel && (
          <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-50">{hubFilterLabel}</p>
        )}
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {items.length === 0 ? (
            <li className="p-8 text-center text-sm text-gray-400">No notifications yet.</li>
          ) : (
            items.map((n) => {
              const unread = !n.readBy.includes(uid);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      unread ? 'bg-[#EEF4FF]/50' : ''
                    }`}
                    onClick={() => {
                      if (unread) markNotificationRead(n.id, uid);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          typeColors[n.type] || typeColors.announcement
                        }`}
                      >
                        {n.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mt-1">{n.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                    {n.studentName && (
                      <p className="text-[10px] text-gray-400 mt-1">{n.studentName}</p>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </>
  );
};

export default NotificationPanel;
