import React, { useEffect } from 'react';
import styled from 'styled-components';
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

const typeBadgeBg: Record<string, string> = {
  check_in: 'bg-emerald-100',
  check_out: 'bg-slate-100',
  late: 'bg-amber-100',
  award: 'bg-purple-100',
  announcement: 'bg-blue-100',
};

const TypeBadge = styled.span`
  display: inline-block;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  color: #000000 !important;
`;

const NotifCard = styled.div<{ $unread: boolean }>`
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  color: #ffffff;
  background: ${({ $unread }) => ($unread ? '#0052cc' : '#1e293b')};
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ $unread }) => ($unread ? '#003d99' : '#334155')};
  }

  &:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: 2px;
  }
`;

const NotifTitle = styled.p`
  margin: 0.25rem 0 0;
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.35;
  color: #ffffff !important;
`;

const NotifBody = styled.p`
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #ffffff !important;
  opacity: 0.95;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotifMeta = styled.span`
  font-size: 0.625rem;
  line-height: 1.2;
  color: #ffffff !important;
  opacity: 0.8;
  white-space: nowrap;
`;

const NotifStudent = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.625rem;
  color: #ffffff !important;
  opacity: 0.8;
`;

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
        className="notification-drawer fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[201] flex flex-col"
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
        <ul className="flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <li className="p-8 text-center text-sm text-gray-400">No notifications yet.</li>
          ) : (
            items.map((n) => {
              const unread = !n.readBy.includes(uid);
              return (
                <li key={n.id} className="px-3 py-1.5">
                  <NotifCard
                    className="notification-card-message"
                    role="button"
                    tabIndex={0}
                    $unread={unread}
                    onClick={() => {
                      if (unread) markNotificationRead(n.id, uid);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (unread) markNotificationRead(n.id, uid);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <TypeBadge
                        className={`notification-type-badge ${
                          typeBadgeBg[n.type] || typeBadgeBg.announcement
                        }`}
                      >
                        {n.type.replace('_', ' ')}
                      </TypeBadge>
                      <NotifMeta>{timeAgo(n.createdAt)}</NotifMeta>
                    </div>
                    <NotifTitle>{n.title}</NotifTitle>
                    <NotifBody>{n.body}</NotifBody>
                    {n.studentName ? <NotifStudent>{n.studentName}</NotifStudent> : null}
                  </NotifCard>
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
