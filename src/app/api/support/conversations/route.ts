import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { requireUser } from '@/lib/api-auth';
import { getOrCreateOpenSupportConversation, listSupportConversations, serializeSupportConversation } from '@/lib/support-service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ('response' in auth) return auth.response;

    const conversations = await listSupportConversations(auth.user);
    return NextResponse.json({
      success: true,
      conversations: conversations.map(serializeSupportConversation),
    });
  } catch (error) {
    console.error('Support conversations GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch support conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ('response' in auth) return auth.response;

    if (auth.user.role === Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'Admins reply from an existing conversation' }, { status: 400 });
    }

    const conversation = await getOrCreateOpenSupportConversation(auth.user);
    return NextResponse.json({ success: true, conversation: serializeSupportConversation(conversation) });
  } catch (error) {
    console.error('Support conversations POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create support conversation' }, { status: 500 });
  }
}
