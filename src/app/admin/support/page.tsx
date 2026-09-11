'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Headphones, Loader2, Send, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  requesterId: string;
  requesterRole: string;
  subject?: string;
  status: string;
  lastMessageAt: string;
  requester?: { name: string; email: string; role: string };
  messages?: SupportMessage[];
}

export default function AdminSupportPage() {
  const { language, t } = useI18n();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  useEffect(() => {
    void loadConversations();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, { path: '/socket.io', withCredentials: true });
    socketRef.current = socket;

    socket.on('support:conversation_updated', ({ conversation, message }) => {
      setConversations((prev) => {
        const rest = prev.filter((item) => item.id !== conversation.id);
        return [conversation, ...rest].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
      setSelected((current) => current?.id === conversation.id ? { ...current, ...conversation } : current);
      if (selected?.id === conversation.id && message) {
        setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
      }
    });

    socket.on('support:message', ({ message, conversation }) => {
      setSelected((current) => current?.id === conversation.id ? { ...current, ...conversation } : current);
      if (selected?.id === conversation.id && message) {
        setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages.length]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support/conversations', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        if (!selected && data.conversations?.[0]) await openConversation(data.conversations[0]);
      }
    } catch (error) {
      console.error('Failed to load support conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conversation: SupportConversation) => {
    setSelected(conversation);
    socketRef.current?.emit('support:join_conversation', conversation.id);
    const res = await fetch(`/api/support/conversations/${conversation.id}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setSelected(data.conversation);
      setMessages(data.conversation.messages || []);
    }
  };

  const sendReply = async () => {
    const body = input.trim();
    if (!body || !selected || sending) return;
    setSending(true);
    setInput('');

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('support:admin_reply', { conversationId: selected.id, body }, (response: any) => {
        setSending(false);
        if (response?.success) {
          setSelected(response.conversation);
          setMessages((prev) => prev.some((item) => item.id === response.message.id) ? prev : [...prev, response.message]);
          setConversations((prev) => [response.conversation, ...prev.filter((item) => item.id !== response.conversation.id)]);
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
        body: JSON.stringify({ conversationId: selected.id, body }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(data.conversation);
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

  const updateStatus = async (status: string) => {
    if (!selected) return;
    const res = await fetch(`/api/support/conversations/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      setSelected(data.conversation);
      setConversations((prev) => prev.map((item) => item.id === data.conversation.id ? data.conversation : item));
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-[620px]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('adminSupportPage.title')}</h1>
        <p className="text-muted-foreground">{t('adminSupportPage.description')}</p>
      </div>

      <div className="grid min-h-[650px] gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base"><Headphones className="h-4 w-4" /> Support Inbox</CardTitle>
          </CardHeader>
          <CardContent className="h-[590px] overflow-y-auto p-0">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">{t('adminSupportPage.emptyList')}</div>
            ) : conversations.map((conversation) => {
              const last = conversation.messages?.[0];
              const active = selected?.id === conversation.id;
              return (
                <button
                  key={conversation.id}
                  onClick={() => void openConversation(conversation)}
                  className={`w-full border-b p-4 text-left transition hover:bg-orange-50 ${active ? 'bg-orange-50' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{conversation.requester?.name || t('adminSupportPage.userFallback')}</p>
                      <p className="truncate text-xs text-muted-foreground">{conversation.requester?.email}</p>
                    </div>
                    <Badge variant={conversation.status === 'OPEN' ? 'default' : 'secondary'}>{conversation.status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{last?.body || conversation.subject || t('adminSupportPage.conversationFallback')}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{new Date(conversation.lastMessageAt).toLocaleString('vi-VN')}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          {selected ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base"><UserCircle className="h-4 w-4" /> {selected.requester?.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.requester?.email} · {selected.requesterRole}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void updateStatus(selected.status === 'CLOSED' ? 'OPEN' : 'CLOSED')}>
                    {selected.status === 'CLOSED' ? t('adminSupportPage.reopen') : t('adminSupportPage.closeTicket')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                  {sortedMessages.map((message) => {
                    const admin = message.senderRole === 'ADMIN';
                    return (
                      <div key={message.id} className={`flex ${admin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${admin ? 'bg-orange-600 text-white' : 'bg-white text-slate-700'}`}>
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <p className={`mt-1 text-[10px] ${admin ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {admin ? 'Admin' : message.sender?.name || 'User'} · {new Date(message.createdAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="border-t bg-white p-4">
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendReply();
                      }
                    }}
                    placeholder={t('adminSupportPage.replyPlaceholder')}
                    className="min-h-[84px] resize-none"
                    disabled={selected.status === 'CLOSED'}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button onClick={sendReply} disabled={sending || !input.trim() || selected.status === 'CLOSED'}>
                      {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {t('adminSupportPage.sendReply')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">{t('adminSupportPage.pickConversation')}</div>
          )}
        </Card>
      </div>
    </div>
  );
}
