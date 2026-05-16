import React, {useMemo, useState} from 'react';

import type {Notification} from '../api';

type Props = {
  notifications: Notification[];
  pendingNotificationId: number | null;
  onMarkRead: (notificationId: number, read: boolean) => Promise<void> | void;
  onMarkAllRead?: () => Promise<void> | void;
  onSelect?: (notification: Notification) => void;
};

export function NotificationsBell({
  notifications,
  pendingNotificationId,
  onMarkRead,
  onMarkAllRead,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications],
  );
  const recent = useMemo(
    () =>
      [...notifications]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 8),
    [notifications],
  );

  return (
    <div className="notif-bell">
      <button
        type="button"
        className="notif-bell-button"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}>
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 ? (
          <span className="notif-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notif-bell-panel" role="dialog" aria-label="Notifications">
          <div className="notif-bell-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && onMarkAllRead ? (
              <button
                type="button"
                className="notif-bell-markall"
                onClick={() => {
                  Promise.resolve(onMarkAllRead()).catch(() => {});
                }}>
                Mark all read
              </button>
            ) : (
              <span className="notif-bell-meta">{unreadCount} unread</span>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="notif-bell-empty">You're all caught up.</p>
          ) : (
            <ul className="notif-bell-list">
              {recent.map(notification => {
                const pending = pendingNotificationId === notification.id;
                return (
                  <li
                    key={notification.id}
                    className={
                      notification.read
                        ? 'notif-bell-item'
                        : 'notif-bell-item unread'
                    }>
                    <button
                      type="button"
                      className="notif-bell-item-body"
                      onClick={() => {
                        if (!notification.read) {
                          Promise.resolve(onMarkRead(notification.id, true)).catch(
                            () => {},
                          );
                        }
                        onSelect?.(notification);
                      }}>
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <time>{formatRelative(notification.createdAt)}</time>
                    </button>
                    {!notification.read ? (
                      <button
                        type="button"
                        className="notif-bell-mark"
                        disabled={pending}
                        onClick={() => {
                          Promise.resolve(onMarkRead(notification.id, true)).catch(
                            () => {},
                          );
                        }}>
                        {pending ? '...' : 'Mark read'}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return iso;
  }
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  return `${Math.round(diffSec / 86400)}d ago`;
}
