import { MatchStatus } from '@prisma/client';
import { HttpError, forbidden, notFound } from '../lib/http';
import { emitToUser } from '../lib/realtime';
import { prisma } from '../prisma';
import { notify } from './notify';
import { publicUser } from './presenters';

const counterpartOf = (m: { startupId: string; investorId: string }, me: string) => (m.startupId === me ? m.investorId : m.startupId);

/** Participant check shared by every conversation endpoint. */
export async function loadForParticipant(matchId: string, me: string) {
  const m = await prisma.match.findUnique({ where: { id: matchId } });
  if (!m) throw notFound('Conversation not found');
  if (m.startupId !== me && m.investorId !== me) throw forbidden('Not part of this conversation');
  return m;
}

async function profileSummary(userIds: string[]) {
  const [startups, investors] = await Promise.all([
    prisma.startupProfile.findMany({ where: { userId: { in: userIds } }, select: { id: true, userId: true, companyName: true, industry: true, stage: true } }),
    prisma.investorProfile.findMany({ where: { userId: { in: userIds } }, select: { id: true, userId: true, companyName: true, investorType: true } }),
  ]);
  const map = new Map<string, any>();
  for (const s of startups) map.set(s.userId, { type: 'STARTUP', profileId: s.id, title: s.companyName, industry: s.industry, stage: s.stage });
  for (const i of investors) map.set(i.userId, { type: 'INVESTOR', profileId: i.id, title: i.companyName, investorType: i.investorType });
  return map;
}

export async function requestConnection(me: string, targetUserId: string, intro?: string) {
  if (me === targetUserId) throw new HttpError(400, 'You cannot connect with yourself');
  const [meUser, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: me } }),
    prisma.user.findUnique({ where: { id: targetUserId } }),
  ]);
  if (!meUser || !target) throw notFound('User not found');
  const roles = new Set([meUser.role, target.role]);
  if (!(roles.has('STARTUP') && roles.has('INVESTOR'))) throw new HttpError(400, 'Connections are between a startup and an investor');

  const startupId = meUser.role === 'STARTUP' ? me : targetUserId;
  const investorId = meUser.role === 'INVESTOR' ? me : targetUserId;
  const existing = await prisma.match.findFirst({ where: { startupId, investorId }, orderBy: { createdAt: 'desc' } });
  if (existing && existing.status !== MatchStatus.REJECTED) return { match: existing, created: false };

  const now = new Date();
  const match = existing
    ? await prisma.match.update({ where: { id: existing.id }, data: { status: MatchStatus.PENDING, requestedById: me, respondedAt: null, createdAt: now } })
    : await prisma.match.create({ data: { startupId, investorId, requestedById: me, status: MatchStatus.PENDING } });

  if (intro?.trim()) {
    await prisma.message.create({ data: { matchId: match.id, senderId: me, content: intro.trim().slice(0, 2000) } });
    await prisma.match.update({ where: { id: match.id }, data: { lastMessageAt: now } });
  }
  await prisma.matchRead.upsert({ where: { matchId_userId: { matchId: match.id, userId: me } }, create: { matchId: match.id, userId: me }, update: { readAt: now } });
  await notify(targetUserId, 'CONNECTION_REQUEST', `${meUser.fullName} wants to connect`, `/inbox/${match.id}`);
  emitToUser(targetUserId, 'connection:update', { id: match.id });
  return { match, created: true };
}

export async function respond(me: string, matchId: string, accept: boolean) {
  const m = await loadForParticipant(matchId, me);
  if (m.status !== MatchStatus.PENDING) throw new HttpError(409, 'This request was already answered');
  // Legacy rows have no requester: either participant may answer them.
  if (m.requestedById === me) throw forbidden('Waiting for the other side to answer');
  const updated = await prisma.match.update({
    where: { id: m.id },
    data: { status: accept ? MatchStatus.ACCEPTED : MatchStatus.REJECTED, respondedAt: new Date() },
  });
  const other = counterpartOf(m, me);
  const meUser = await prisma.user.findUnique({ where: { id: me }, select: { fullName: true } });
  await notify(other,
    accept ? 'CONNECTION_ACCEPTED' : 'CONNECTION_DECLINED',
    accept ? `${meUser?.fullName ?? 'Someone'} accepted your request` : `${meUser?.fullName ?? 'Someone'} declined your request`,
    `/inbox/${m.id}`);
  emitToUser(other, 'connection:update', { id: m.id });
  emitToUser(me, 'connection:update', { id: m.id });
  return updated;
}

/** Conversations of the user with counterpart, last message and unread count. */
export async function listConnections(me: string, status?: MatchStatus) {
  const rows = await prisma.match.findMany({
    where: { OR: [{ startupId: me }, { investorId: me }], ...(status ? { status } : { status: { not: MatchStatus.REJECTED } }) },
    include: {
      startup: true, investor: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      reads: { where: { userId: me } },
    },
    orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  });
  const others = rows.map(m => counterpartOf(m, me));
  const profiles = await profileSummary(others);

  const unread = await Promise.all(rows.map(m => prisma.message.count({
    where: { matchId: m.id, senderId: { not: me }, createdAt: { gt: m.reads[0]?.readAt ?? new Date(0) } },
  })));

  return rows.map((m, i) => {
    const otherUser = m.startupId === me ? m.investor : m.startup;
    const last = m.messages[0];
    return {
      id: m.id,
      status: m.status,
      direction: m.requestedById ? (m.requestedById === me ? 'outgoing' : 'incoming') : 'unknown',
      createdAt: m.createdAt,
      lastMessageAt: m.lastMessageAt ?? last?.createdAt ?? m.createdAt,
      counterpart: { ...publicUser(otherUser), profile: profiles.get(otherUser.id) ?? null },
      lastMessage: last ? { content: last.kind === 'MEETING' ? 'Meeting request' : last.content, senderId: last.senderId, createdAt: last.createdAt } : null,
      unread: unread[i],
    };
  });
}

export async function unreadTotal(me: string) {
  const list = await listConnections(me);
  return list.reduce((n, c) => n + c.unread, 0);
}

export async function markRead(me: string, matchId: string) {
  await loadForParticipant(matchId, me);
  const now = new Date();
  await prisma.matchRead.upsert({ where: { matchId_userId: { matchId, userId: me } }, create: { matchId, userId: me, readAt: now }, update: { readAt: now } });
}

const presentMessage = (m: any) => ({
  id: m.id, matchId: m.matchId, senderId: m.senderId, content: m.content, kind: m.kind, meta: m.meta ?? null, createdAt: m.createdAt,
});

export async function thread(me: string, matchId: string) {
  const m = await loadForParticipant(matchId, me);
  const [messages, startup, investor] = await Promise.all([
    prisma.message.findMany({ where: { matchId }, orderBy: { createdAt: 'asc' }, take: 500 }),
    prisma.user.findUnique({ where: { id: m.startupId } }),
    prisma.user.findUnique({ where: { id: m.investorId } }),
  ]);
  await markRead(me, matchId);
  const other = m.startupId === me ? investor : startup;
  const profiles = await profileSummary([other!.id]);
  return {
    id: m.id,
    status: m.status,
    direction: m.requestedById ? (m.requestedById === me ? 'outgoing' : 'incoming') : 'unknown',
    createdAt: m.createdAt,
    counterpart: { ...publicUser(other), profile: profiles.get(other!.id) ?? null },
    messages: messages.map(presentMessage),
  };
}

async function post(me: string, matchId: string, data: { content: string; kind?: string; meta?: any }) {
  const m = await loadForParticipant(matchId, me);
  if (m.status !== MatchStatus.ACCEPTED) throw new HttpError(409, 'You can write once the request is accepted');
  const msg = await prisma.message.create({ data: { matchId, senderId: me, content: data.content, kind: data.kind ?? 'TEXT', meta: data.meta } });
  const now = msg.createdAt;
  await prisma.match.update({ where: { id: matchId }, data: { lastMessageAt: now } });
  await prisma.matchRead.upsert({ where: { matchId_userId: { matchId, userId: me } }, create: { matchId, userId: me, readAt: now }, update: { readAt: now } });
  const payload = presentMessage(msg);
  emitToUser(counterpartOf(m, me), 'message:new', payload);
  emitToUser(me, 'message:new', payload);
  return { match: m, message: payload };
}

export const sendMessage = (me: string, matchId: string, content: string) => post(me, matchId, { content });

export async function proposeMeeting(me: string, matchId: string, slots: string[], note?: string) {
  const r = await post(me, matchId, {
    content: note?.trim() || 'Meeting request',
    kind: 'MEETING',
    meta: { slots, note: note?.trim() || null, status: 'PROPOSED', acceptedSlot: null },
  });
  const meUser = await prisma.user.findUnique({ where: { id: me }, select: { fullName: true } });
  await notify(counterpartOf(r.match, me), 'MEETING_PROPOSED', `${meUser?.fullName ?? 'Someone'} proposed a meeting`, `/inbox/${matchId}`);
  return r.message;
}

export async function answerMeeting(me: string, matchId: string, messageId: string, accept: boolean, slot?: string) {
  const m = await loadForParticipant(matchId, me);
  const msg = await prisma.message.findFirst({ where: { id: messageId, matchId, kind: 'MEETING' } });
  if (!msg) throw notFound('Meeting request not found');
  if (msg.senderId === me) throw forbidden('The other side answers this request');
  const meta = (msg.meta ?? {}) as any;
  if (meta.status !== 'PROPOSED') throw new HttpError(409, 'This meeting was already answered');
  if (accept && (!slot || !meta.slots?.includes(slot))) throw new HttpError(400, 'Pick one of the proposed times');
  const updated = await prisma.message.update({
    where: { id: msg.id },
    data: { meta: { ...meta, status: accept ? 'ACCEPTED' : 'DECLINED', acceptedSlot: accept ? slot : null } },
  });
  const payload = presentMessage(updated);
  const other = counterpartOf(m, me);
  emitToUser(other, 'message:update', payload);
  emitToUser(me, 'message:update', payload);
  const meUser = await prisma.user.findUnique({ where: { id: me }, select: { fullName: true } });
  await notify(other, accept ? 'MEETING_ACCEPTED' : 'MEETING_DECLINED',
    accept ? `${meUser?.fullName ?? 'Someone'} confirmed the meeting` : `${meUser?.fullName ?? 'Someone'} declined the meeting`, `/inbox/${matchId}`);
  return payload;
}
