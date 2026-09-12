import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { publishNotification } from '@/lib/realtime-notifications';

export function serializeNotification(notification: any) {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    linkUrl: notification.linkUrl,
    entityType: notification.entityType,
    entityId: notification.entityId,
    readAt: notification.readAt?.toISOString?.() ?? null,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  };
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function upsertNotification(input: {
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  const now = new Date();
  const notification = await prisma.notification.upsert({
    where: {
      userId_type_entityType_entityId: {
        userId: input.userId,
        type: input.type,
        entityType: input.entityType ?? '',
        entityId: input.entityId ?? '',
      },
    },
    update: {
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl ?? null,
      readAt: null,
      updatedAt: now,
    },
    create: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl ?? null,
      entityType: input.entityType ?? '',
      entityId: input.entityId ?? '',
    },
  });

  await publishNotification(notification);
  return notification;
}

function truncateMessage(body: string) {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
}

export async function createSupportMessageNotifications(params: {
  conversationId: string;
  requesterId: string;
  requesterName?: string | null;
  senderId: string;
  senderRole: string;
  body: string;
}) {
  const message = truncateMessage(params.body);

  if (params.senderRole === Role.ADMIN) {
    if (params.senderId === params.requesterId) return [];
    const notification = await upsertNotification({
      userId: params.requesterId,
      type: 'SUPPORT_MESSAGE',
      title: 'Admin đã phản hồi hỗ trợ',
      message,
      linkUrl: '/affiliate',
      entityType: 'SUPPORT_CONVERSATION',
      entityId: params.conversationId,
    });
    return [notification];
  }

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN, status: 'ACTIVE', id: { not: params.senderId } },
    select: { id: true },
  });

  const title = `${params.requesterName || 'Người dùng'} gửi hỗ trợ`;
  return Promise.all(admins.map((admin) => upsertNotification({
    userId: admin.id,
    type: 'SUPPORT_MESSAGE',
    title,
    message,
    linkUrl: '/admin/support',
    entityType: 'SUPPORT_CONVERSATION',
    entityId: params.conversationId,
  })));
}
