import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { addSupportMessage, serializeSupportConversation, serializeSupportMessage } from '@/lib/support-service';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const messageBody = typeof body.body === 'string' ? body.body : '';
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;

    const result = await addSupportMessage(auth.user, messageBody, conversationId);

    return NextResponse.json({
      success: true,
      conversation: serializeSupportConversation(result.conversation),
      message: serializeSupportMessage(result.message),
      notifications: result.notifications,
    });
  } catch (error) {
    console.error('Support message POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send support message';
    const status = message === 'Forbidden' ? 403 : message.includes('required') ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
