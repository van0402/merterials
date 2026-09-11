import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  serializeNotification,
} from '@/lib/notification-service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ('response' in auth) return auth.response;

    const [notifications, unreadCount] = await Promise.all([
      listNotifications(auth.user.id),
      getUnreadNotificationCount(auth.user.id),
    ]);

    return NextResponse.json({
      success: true,
      notifications: notifications.map(serializeNotification),
      unreadCount,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ('response' in auth) return auth.response;

    const body = await request.json();
    if (body.all === true) {
      await markAllNotificationsRead(auth.user.id);
    } else if (typeof body.id === 'string') {
      await markNotificationRead(auth.user.id, body.id);
    } else {
      return NextResponse.json({ success: false, error: 'Notification id required' }, { status: 400 });
    }

    const unreadCount = await getUnreadNotificationCount(auth.user.id);
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update notifications' }, { status: 500 });
  }
}
