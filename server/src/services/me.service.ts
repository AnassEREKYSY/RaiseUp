import { prisma } from '../prisma';
import { investorDetail, startupDetail } from './presenters';

/** The signed-in user with their own profile (email included: it is theirs). */
export async function me(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    include: { startupProfile: { include: { projects: { orderBy: { createdAt: 'desc' } }, user: true } }, investorProfile: { include: { user: true } } },
  });
  if (!u) return null;
  const startup = u.startupProfile ? startupDetail(u.startupProfile) : null;
  const investor = u.investorProfile ? investorDetail(u.investorProfile) : null;
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    createdAt: u.createdAt,
    hasProfile: !!(startup || investor),
    startup,
    investor,
  };
}
