'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { Bell, CheckCheck, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/components/i18n-provider';

interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationBellProps {
  userRole: string;
}

const SUPPORT_TOAST_TTL_MS = 10000;

export function NotificationBell({ userRole }: NotificationBellProps) {
  const { language, t, tx } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [supportToasts, setSupportToasts] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    void loadNotifications();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, { path: '/socket.io', withCredentials: true });
    socketRef.current = socket;
    socket.on('notification:new', ({ notification }: { notification: NotificationItem }) => {
      setNotifications((prev) => {
        const existing = prev.find((item) => item.id === notification.id);
        if (!notification.readAt && (!existing || existing.readAt)) {
          setUnreadCount((count) => count + 1);
        }
        return [notification, ...prev.filter((item) => item.id !== notification.id)];
      });

      if (notification.type === 'SUPPORT_MESSAGE' && !notification.readAt) {
        setSupportToasts((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)].slice(0, 3));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (supportToasts.length === 0) return;
    const timeout = window.setTimeout(() => {
      setSupportToasts((prev) => prev.slice(0, -1));
    }, SUPPORT_TOAST_TTL_MS);
    return () => window.clearTimeout(timeout);
  }, [supportToasts]);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const dismissSupportToast = (id: string) => {
    setSupportToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const markRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) setUnreadCount(data.unreadCount || 0);
      setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
      dismissSupportToast(id);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (data.success) setUnreadCount(data.unreadCount || 0);
      setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setSupportToasts([]);
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markRead(notification.id);
    setOpen(false);

    if (notification.type === 'SUPPORT_MESSAGE' && userRole !== 'ADMIN') {
      window.dispatchEvent(new CustomEvent('support-chat:open', { detail: { conversationId: notification.entityId } }));
      return;
    }

    if (notification.linkUrl) router.push(notification.linkUrl);
  };

  const formatTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t('notificationBell.time.justNow');
    if (minutes < 60) return tx(`${minutes} phút trước`, `${minutes}m ago`);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return tx(`${hours} giờ trước`, `${hours}h ago`);
    const days = Math.floor(hours / 24);
    return tx(`${days} ngày trước`, `${days}d ago`);
  };

  const getNotificationBadgeLabel = (notification: NotificationItem) => {
    if (notification.type === 'SUPPORT_MESSAGE') return t('notificationBell.badges.support');
    if (notification.type === 'PAYOUT_REQUEST') return t('notificationBell.badges.payout');
    if (notification.type.startsWith('PROGRAM_')) return t('notificationBell.badges.program');
    return t('notificationBell.badges.system');
  };

  const getNotificationTitle = (notification: NotificationItem) => {
    if (notification.type === 'PROGRAM_AVAILABLE') return t('notificationBell.titles.programAvailable');
    if (notification.type === 'PROGRAM_ASSIGNED') return t('notificationBell.titles.programAssigned');
    if (notification.type === 'PAYOUT_REQUEST') return t('notificationBell.titles.payoutRequest');
    if (notification.type === 'SUPPORT_MESSAGE') {
      if (notification.title === 'Admin đã phản hồi hỗ trợ') return t('notificationBell.titles.adminSupportReply');
      if (language === 'en') return notification.title.replace('gửi hỗ trợ', 'sent a support request').replace('Người dùng', 'User');
    }
    return notification.title;
  };

  const getNotificationMessage = (notification: NotificationItem) => {
    if (notification.type === 'PAYOUT_REQUEST' && language === 'en') {
      const match = notification.message.match(/^(.*?) vừa gửi yêu cầu rút (.*?)\. Vào tab Thanh toán để kiểm tra và xử lý\.$/);
      if (match) return `${match[1]} submitted a payout request for ${match[2]}. Open the Payouts tab to review and process it.`;
    }

    if (notification.type === 'PROGRAM_AVAILABLE' && language === 'en') {
      const match = notification.message.match(/^Chương trình "(.*?)" vừa mở cho KOC\. Hoa hồng (.*?), cookie (.*?) ngày\.$/);
      if (match) return `Program "${match[1]}" is now open to KOC creators. Commission ${match[2]}, cookie ${match[3]} days.`;
    }

    if (notification.type === 'PROGRAM_ASSIGNED' && language === 'en') {
      const match = notification.message.match(/^Bạn đã được thêm vào chương trình "(.*?)"\. Hoa hồng (.*?), cookie (.*?) ngày\.$/);
      if (match) return `You have been added to the private program "${match[1]}". Commission ${match[2]}, cookie ${match[3]} days.`;
    }

    return notification.message;
  };

  return (
    <>
      <div className="relative">
        <Button variant="outline" size="icon" className="relative rounded-2xl bg-white/75" onClick={() => setOpen((value) => !value)}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {supportToasts.length > 0 && (
          <div className="fixed left-4 right-4 top-20 z-[80] flex flex-col gap-3 sm:absolute sm:left-auto sm:right-[calc(100%+0.75rem)] sm:top-0 sm:w-[22rem]">
            {supportToasts.map((notification) => (
              <div
                key={notification.id}
                className="group relative overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-2xl shadow-slate-950/20 ring-1 ring-black/5 sm:overflow-visible sm:after:absolute sm:after:-right-2 sm:after:top-4 sm:after:h-4 sm:after:w-4 sm:after:rotate-45 sm:after:border-r sm:after:border-t sm:after:border-orange-200/80 sm:after:bg-white"
              >
                <button
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  className="relative z-10 flex w-full items-start gap-3 rounded-t-2xl bg-white p-4 text-left transition hover:bg-orange-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black tracking-tight">{t('notificationBell.toast.newMessage')}</p>
                        <p className="mt-0.5 text-xs font-medium text-orange-700">{t('notificationBell.toast.openSupportChat')}</p>
                      </div>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-600" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{getNotificationMessage(notification)}</p>
                  </div>
                </button>
                <div className="relative z-10 flex items-center justify-between rounded-b-2xl border-t bg-orange-50/60 px-4 py-2">
                  <span className="text-[11px] text-muted-foreground">{formatTime(notification.updatedAt)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => dismissSupportToast(notification.id)}
                  >
                    <X className="h-3.5 w-3.5" /> {t('common.close')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {open && (
          <>
            <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-white shadow-2xl shadow-slate-950/15">
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <p className="font-bold">{t('notificationBell.title')}</p>
                  <p className="text-xs text-muted-foreground">{t('notificationBell.description')}</p>
                </div>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead}>
                    <CheckCheck className="mr-1 h-3.5 w-3.5" /> {t('notificationBell.markRead')}
                  </Button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    {t('notificationBell.empty')}
                  </div>
                ) : notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => void handleNotificationClick(notification)}
                    className={`w-full border-b p-4 text-left transition hover:bg-orange-50 ${notification.readAt ? 'bg-white' : 'bg-orange-50/70'}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{getNotificationTitle(notification)}</p>
                          {!notification.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-orange-600" />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{getNotificationMessage(notification)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{getNotificationBadgeLabel(notification)}</Badge>
                          <span className="text-[11px] text-muted-foreground">{formatTime(notification.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label={t('notificationBell.closeAria')} />
          </>
        )}
      </div>
    </>
  );
}
