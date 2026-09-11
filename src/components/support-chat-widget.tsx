'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { MessageCircle, Send, X, Loader2, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/components/i18n-provider';

interface SupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  body: string;
  createdAt: string;
  sender?: { name: string; email: string; role: string };
}

interface SupportConversation {
  id: string;
  status: string;
  messages?: SupportMessage[];
}

interface SupportChatWidgetProps {
  currentUserId?: string;
}

export function SupportChatWidget({ currentUserId }: SupportChatWidgetProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, { path: '/socket.io', withCredentials: true });
    socketRef.current = socket;

    socket.on('support:message', ({ message, conversation: updatedConversation }) => {
      setConversation(updatedConversation);
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      if (!open && message.senderId !== currentUserId) setUnread((count) => count + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, open]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('support-chat:open', handleOpen);
    return () => window.removeEventListener('support-chat:open', handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    setUnread(0);
    void loadConversation();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, sortedMessages.length]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const listRes = await fetch('/api/support/conversations', { credentials: 'include' });
      const listData = await listRes.json();
      const first = listData.conversations?.[0];
      if (!first) return;

      const detailRes = await fetch(`/api/support/conversations/${first.id}`, { credentials: 'include' });
      const detailData = await detailRes.json();
      if (detailData.success) {
        setConversation(detailData.conversation);
        setMessages(detailData.conversation.messages || []);
        socketRef.current?.emit('support:join_conversation', detailData.conversation.id);
      }
    } catch (error) {
      console.error('Failed to load support conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const body = input.trim();
    if (!body || sending) return;

    setSending(true);
    setInput('');

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('support:send_message', { body, conversationId: conversation?.id }, (response: any) => {
        setSending(false);
        if (response?.success) {
          setConversation(response.conversation);
          setMessages((prev) => prev.some((item) => item.id === response.message.id) ? prev : [...prev, response.message]);
          socket.emit('support:join_conversation', response.conversation.id);
        } else {
          setInput(body);
        }
      });
      return;
    }

    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body, conversationId: conversation?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setConversation(data.conversation);
        setMessages((prev) => prev.some((item) => item.id === data.message.id) ? prev : [...prev, data.message]);
      } else {
        setInput(body);
      }
    } catch {
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <Card className="mb-3 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden border-orange-200/80 bg-white shadow-2xl shadow-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-orange-600 to-amber-500 p-4 text-white">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Headphones className="h-4 w-4" /> {t('supportChatWidget.title')}
              </CardTitle>
              <p className="mt-1 text-xs text-white/80">{t('supportChatWidget.subtitle')}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 hover:text-white" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="flex-1 space-y-3 overflow-y-auto bg-orange-50/30 p-4">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('supportChatWidget.loading')}
                </div>
              ) : sortedMessages.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                  {t('supportChatWidget.greeting')}
                </div>
              ) : sortedMessages.map((message) => {
                const mine = message.senderId === currentUserId;
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? 'bg-orange-600 text-white' : 'bg-white text-slate-700'}`}>
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {mine ? t('supportChatWidget.you') : message.senderRole === 'ADMIN' ? 'Admin' : message.sender?.name || 'Support'} · {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="border-t bg-white p-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={t('supportChatWidget.inputPlaceholder')}
                className="min-h-[76px] resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary">{conversation?.status || 'NEW'}</Badge>
                <Button size="sm" onClick={sendMessage} disabled={sending || !input.trim()}>
                  {sending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
                  {t('supportChatWidget.send')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Button onClick={() => setOpen((value) => !value)} className="relative h-14 rounded-full px-5 shadow-xl shadow-orange-950/20">
        <MessageCircle className="mr-2 h-5 w-5" /> {t('supportChatWidget.floatingButton')}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
            {unread}
          </span>
        )}
      </Button>
    </div>
  );
}
