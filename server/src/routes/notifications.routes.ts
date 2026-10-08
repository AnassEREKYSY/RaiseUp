import { Router } from 'express';
import { handle, notFound, userId } from '../lib/http';
import { prisma } from '../prisma';

const r = Router();

r.get('/', handle(async (req, res) => {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: userId(req) }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.notification.count({ where: { userId: userId(req), isRead: false } }),
  ]);
  res.json({ items, unread });
}));
r.patch('/read-all', handle(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: userId(req), isRead: false }, data: { isRead: true } });
  res.json({ ok: true });
}));
r.patch('/:id/read', handle(async (req, res) => {
  const { count } = await prisma.notification.updateMany({ where: { id: String(req.params.id), userId: userId(req) }, data: { isRead: true } });
  if (!count) throw notFound('Notification not found');
  res.json({ ok: true });
}));

export default r;
