import { createServer } from 'node:http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { jwtVerify } from 'jose';
import { prisma } from './src/lib/prisma';
import { AUTH_COOKIE_NAME } from './src/lib/auth-cookie';
import { addSupportMessage, serializeSupportConversation, serializeSupportMessage } from './src/lib/support-service';

const port = Number(process.env.SOCKET_PORT || 3001);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET!);
const redisUrl = process.env.REDIS_URL;
const NOTIFICATIONS_CHANNEL = 'refferq:notifications';

function parseCookieHeader(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader.split(';').map((part) => {
      const [name, ...valueParts] = part.trim().split('=');
      return [name, decodeURIComponent(valueParts.join('='))];
    }).filter(([name]) => Boolean(name))
  ) as Record<string, string>;
}

async function getUserFromCookie(cookieHeader?: string) {
  if (!cookieHeader) return null;
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[AUTH_COOKIE_NAME];
  if (!token) return null;

  const { payload } = await jwtVerify(token, jwtSecret);
  const userId = typeof payload.userId === 'string' ? payload.userId : null;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, status: 'ACTIVE' },
    select: { id: true, email: true, name: true, role: true },
  });
}

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: appUrl,
    credentials: true,
  },
});

if (redisUrl) {
  const subscriber = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  subscriber.on('error', (error) => {
    console.error('Redis notification subscriber error:', error.message);
  });

  subscriber.subscribe(NOTIFICATIONS_CHANNEL).then(() => {
    console.log(`> Subscribed to Redis channel ${NOTIFICATIONS_CHANNEL}`);
  }).catch((error) => {
    console.error('Failed to subscribe notification channel:', error);
  });

  subscriber.on('message', (channel, rawPayload) => {
    if (channel !== NOTIFICATIONS_CHANNEL) return;
    try {
      const payload = JSON.parse(rawPayload) as { userId?: string; notification?: unknown };
      if (!payload.userId || !payload.notification) return;
      io.to(`user:${payload.userId}`).emit('notification:new', { notification: payload.notification });
    } catch (error) {
      console.error('Invalid realtime notification payload:', error);
    }
  });
} else {
  console.warn('REDIS_URL is not set; realtime DB notifications will not be broadcast through Redis.');
}

io.use(async (socket, nextMiddleware) => {
  try {
    const user = await getUserFromCookie(socket.handshake.headers.cookie);
    if (!user) return nextMiddleware(new Error('Authentication required'));
    socket.data.user = user;
    return nextMiddleware();
  } catch {
    return nextMiddleware(new Error('Invalid session'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user as { id: string; email: string; name: string; role: string };
  socket.join(`user:${user.id}`);
  if (user.role === 'ADMIN') socket.join('admins');

  socket.on('support:join_conversation', (conversationId: string) => {
    if (typeof conversationId === 'string' && conversationId.trim()) {
      socket.join(`support:${conversationId}`);
    }
  });

  socket.on('support:send_message', async (payload, callback) => {
    try {
      const body = typeof payload?.body === 'string' ? payload.body : '';
      const conversationId = typeof payload?.conversationId === 'string' ? payload.conversationId : undefined;
      const result = await addSupportMessage(user as any, body, conversationId);
      const message = serializeSupportMessage(result.message);
      const conversation = serializeSupportConversation(result.conversation);

      io.to(`support:${result.conversation.id}`).emit('support:message', { message, conversation });
      io.to(`user:${result.conversation.requesterId}`).emit('support:message', { message, conversation });
      io.to('admins').emit('support:conversation_updated', { conversation, message });

      callback?.({ success: true, message, conversation, notifications: result.notifications });
    } catch (error) {
      callback?.({ success: false, error: error instanceof Error ? error.message : 'Failed to send message' });
    }
  });

  socket.on('support:admin_reply', async (payload, callback) => {
    try {
      if (user.role !== 'ADMIN') throw new Error('Admin access required');
      const body = typeof payload?.body === 'string' ? payload.body : '';
      const conversationId = typeof payload?.conversationId === 'string' ? payload.conversationId : undefined;
      if (!conversationId) throw new Error('Conversation required');

      const result = await addSupportMessage(user as any, body, conversationId);
      const message = serializeSupportMessage(result.message);
      const conversation = serializeSupportConversation(result.conversation);

      io.to(`support:${result.conversation.id}`).emit('support:message', { message, conversation });
      io.to(`user:${result.conversation.requesterId}`).emit('support:message', { message, conversation });
      io.to('admins').emit('support:conversation_updated', { conversation, message });

      callback?.({ success: true, message, conversation, notifications: result.notifications });
    } catch (error) {
      callback?.({ success: false, error: error instanceof Error ? error.message : 'Failed to send admin reply' });
    }
  });
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`> Support socket server ready on http://0.0.0.0:${port}`);
});
