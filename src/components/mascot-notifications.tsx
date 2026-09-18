'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { Bell, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function MascotNotifications() {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shaking, setShaking] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;

    fetch('/api/notifications', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      });

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, { path: '/socket.io', withCredentials: true });
    socketRef.current = socket;
    socket.on('notification:new', ({ notification }: { notification: NotificationItem }) => {
      setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
      if (!notification.readAt) {
        setUnreadCount((count) => count + 1);
        setShaking(true);
        setTimeout(() => setShaking(false), 1300);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);
  };

  const handleClick = async (notification: NotificationItem) => {
    await markRead(notification.id);
    setOpen(false);
    if (notification.linkUrl) router.push(notification.linkUrl);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      {open && (
        <div className="absolute bottom-full right-0 mb-3 w-96 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border bg-white shadow-2xl shadow-slate-950/20">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <p className="font-bold">Thông báo</p>
              <p className="text-xs text-muted-foreground">Cập nhật mới nhất dành cho bạn</p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllRead}>
                  <CheckCheck className="mr-1 h-3.5 w-3.5" /> Đánh dấu đã đọc
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Chưa có thông báo nào
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full border-b p-4 text-left transition hover:bg-orange-50 ${n.readAt ? 'bg-white' : 'bg-orange-50/70'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-orange-600" />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-16 w-16 drop-shadow-xl transition-transform hover:scale-105"
        aria-label="Thông báo"
      >
        <div className={`relative h-full w-full ${shaking ? 'animate-mascot-shake' : ''}`}>
          <Image src="/images/mascot.png" alt="Trợ lý thông báo" fill className="object-contain" priority />
        </div>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}