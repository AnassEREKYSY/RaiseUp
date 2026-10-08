import { Router } from 'express';
import { z } from 'zod';
import { handle, parse, userId } from '../lib/http';
import {
  answerMeeting, listConnections, markRead, proposeMeeting, requestConnection, respond, sendMessage, thread, unreadTotal,
} from '../services/connections.service';

const r = Router();

r.get('/', handle(async (req, res) => {
  const status = parse(z.object({ status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']).optional() }), req.query).status;
  res.json({ items: await listConnections(userId(req), status) });
}));
r.get('/unread', handle(async (req, res) => res.json({ count: await unreadTotal(userId(req)) })));

r.post('/', handle(async (req, res) => {
  const body = parse(z.object({ userId: z.string().min(1), message: z.string().trim().max(2000).optional() }), req.body);
  const { match, created } = await requestConnection(userId(req), body.userId, body.message);
  res.status(created ? 201 : 200).json({ id: match.id, status: match.status });
}));

r.patch('/:id/accept', handle(async (req, res) => res.json(await respond(userId(req), String(req.params.id), true))));
r.patch('/:id/decline', handle(async (req, res) => res.json(await respond(userId(req), String(req.params.id), false))));

r.get('/:id', handle(async (req, res) => res.json(await thread(userId(req), String(req.params.id)))));
r.post('/:id/read', handle(async (req, res) => { await markRead(userId(req), String(req.params.id)); res.json({ ok: true }); }));

r.post('/:id/messages', handle(async (req, res) => {
  const { content } = parse(z.object({ content: z.string().trim().min(1).max(4000) }), req.body);
  const { message } = await sendMessage(userId(req), String(req.params.id), content);
  res.status(201).json(message);
}));

const future = z.string().datetime({ offset: true }).refine(s => new Date(s).getTime() > Date.now(), 'must be in the future');
r.post('/:id/meetings', handle(async (req, res) => {
  const body = parse(z.object({ slots: z.array(future).min(1).max(3), note: z.string().trim().max(500).optional() }), req.body);
  res.status(201).json(await proposeMeeting(userId(req), String(req.params.id), [...new Set(body.slots)], body.note));
}));
r.patch('/:id/meetings/:messageId', handle(async (req, res) => {
  const body = parse(z.object({ action: z.enum(['accept', 'decline']), slot: z.string().optional() }), req.body);
  res.json(await answerMeeting(userId(req), String(req.params.id), String(req.params.messageId), body.action === 'accept', body.slot));
}));

export default r;
