import { prisma } from '../prisma';
import { emitToUser } from '../lib/realtime';

export type NotificationType =
  | 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'CONNECTION_DECLINED'
  | 'MEETING_PROPOSED' | 'MEETING_ACCEPTED' | 'MEETING_DECLINED';

export async function notify(userId: string, type: NotificationType, message: string, link?: string) {
  const n = await prisma.notification.create({ data: { userId, type, message, link: link ?? null } });
  emitToUser(userId, 'notification:new', n);
  return n;
}
