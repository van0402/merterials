import { Role, type User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createSupportMessageNotifications, serializeNotification } from '@/lib/notification-service';

export type SupportUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;

export function serializeSupportMessage(message: any) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    body: message.body,
    readAt: message.readAt?.toISOString?.() ?? null,
    createdAt: message.createdAt.toISOString(),
    sender: message.sender ? {
      id: message.sender.id,
      name: message.sender.name,
      email: message.sender.email,
      role: message.sender.role,
    } : undefined,
  };
}

export function serializeSupportConversation(conversation: any) {
  return {
    id: conversation.id,
    requesterId: conversation.requesterId,
    requesterRole: conversation.requesterRole,
    subject: conversation.subject,
    status: conversation.status,
    assignedAdminId: conversation.assignedAdminId,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    requester: conversation.requester ? {
      id: conversation.requester.id,
      name: conversation.requester.name,
      email: conversation.requester.email,
      role: conversation.requester.role,
    } : undefined,
    messages: conversation.messages?.map(serializeSupportMessage) ?? undefined,
  };
}

export async function getOrCreateOpenSupportConversation(user: SupportUser) {
  const existing = await prisma.supportConversation.findFirst({
    where: {
      requesterId: user.id,
      status: { in: ['OPEN', 'PENDING'] },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  if (existing) return existing;

  return prisma.supportConversation.create({
    data: {
      requesterId: user.id,
      requesterRole: user.role,
      subject: `Hỗ trợ từ ${user.name || user.email}`,
      status: 'OPEN',
      lastMessageAt: new Date(),
    },
  });
}

export async function listSupportConversations(user: SupportUser) {
  return prisma.supportConversation.findMany({
    where: user.role === Role.ADMIN ? {} : { requesterId: user.id },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });
}

export async function getSupportConversationWithMessages(user: SupportUser, conversationId: string) {
  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  if (!conversation) return null;
  if (user.role !== Role.ADMIN && conversation.requesterId !== user.id) return null;
  return conversation;
}

export async function addSupportMessage(user: SupportUser, body: string, conversationId?: string) {
  const cleanBody = body.trim();
  if (!cleanBody) throw new Error('Message body required');

  let conversation = conversationId
    ? await prisma.supportConversation.findUnique({ where: { id: conversationId } })
    : null;

  if (!conversation) {
    if (user.role === Role.ADMIN) throw new Error('Conversation required for admin replies');
    conversation = await getOrCreateOpenSupportConversation(user);
  }

  if (user.role !== Role.ADMIN && conversation.requesterId !== user.id) {
    throw new Error('Forbidden');
  }

  const now = new Date();
  const message = await prisma.supportMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: user.role,
      body: cleanBody,
    },
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });

  const updatedConversation = await prisma.supportConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: now,
      status: conversation.status === 'CLOSED' ? 'OPEN' : conversation.status,
      ...(user.role === Role.ADMIN && !conversation.assignedAdminId ? { assignedAdminId: user.id } : {}),
    },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  const notifications = await createSupportMessageNotifications({
    conversationId: updatedConversation.id,
    requesterId: updatedConversation.requesterId,
    requesterName: updatedConversation.requester?.name,
    senderId: user.id,
    senderRole: user.role,
    body: cleanBody,
  });

  return { conversation: updatedConversation, message, notifications: notifications.map(serializeNotification) };
}
