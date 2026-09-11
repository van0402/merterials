import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getSupportConversationWithMessages, serializeSupportConversation } from '@/lib/support-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireUser(request);
    if ('response' in auth) return auth.response;

    const { id } = await context.params;
    const conversation = await getSupportConversationWithMessages(auth.user, id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, conversation: serializeSupportConversation(conversation) });
  } catch (error) {
    console.error('Support conversation GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch support conversation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireUser(request);
    if ('response' in auth) return auth.response;
    if (auth.user.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : undefined;
    if (!status || !['OPEN', 'PENDING', 'CLOSED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const conversation = await prisma.supportConversation.update({
      where: { id },
      data: { status },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, conversation: serializeSupportConversation(conversation) });
  } catch (error) {
    console.error('Support conversation PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update support conversation' }, { status: 500 });
  }
}
