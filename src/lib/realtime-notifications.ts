import Redis from 'ioredis';

export const NOTIFICATIONS_CHANNEL = 'refferq:notifications';

function serializeRealtimeNotification(notification: any) {
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

let publisher: Redis | null = null;

function getRedisUrl() {
  return process.env.REDIS_URL || null;
}

function getPublisher() {
  const redisUrl = getRedisUrl();
  if (!redisUrl) return null;
  if (!publisher) {
    publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    publisher.on('error', (error) => {
      console.error('Redis notification publisher error:', error.message);
    });
  }
  return publisher;
}

export async function publishNotification(notification: any) {
  const redis = getPublisher();
  if (!redis) return;

  const payload = {
    userId: notification.userId,
    notification: serializeRealtimeNotification(notification),
  };

  try {
    if (redis.status === 'wait') await redis.connect();
    await redis.publish(NOTIFICATIONS_CHANNEL, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to publish realtime notification:', error);
  }
}
