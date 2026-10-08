/**
 * Demo data: `npm run seed:demo` locally, or in production:
 *   docker exec raiseup-api-1 node dist/scripts/seed-demo.js
 * Creates accounts only when their email does not exist yet, and the demo activity (connections,
 * conversations, pipeline, profile views, notifications) only once. Password for all: demo-pass-123
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

const PASSWORD = 'demo-pass-123';

const startups = [
  { email: 'lena@northwind.demo', name: 'Lena Varga', company: 'Northwind Health', tagline: 'Remote follow-up for heart patients', industry: 'HEALTHCARE', stage: 'MVP', need: 400000, raised: 120000, country: 'France', team: 6, year: 2023, mrr: 9000, growth: 14, customers: 18 },
  { email: 'karim@ledgerly.demo', name: 'Karim Benali', company: 'Ledgerly', tagline: 'Bookkeeping that closes itself every month', industry: 'FINTECH', stage: 'GROWTH', need: 1500000, raised: 600000, country: 'France', team: 14, year: 2021, mrr: 62000, growth: 9, customers: 410 },
  { email: 'ines@greengrid.demo', name: 'Inès Duarte', company: 'GreenGrid', tagline: 'Battery scheduling for small solar farms', industry: 'GREEN_TECH', stage: 'MVP', need: 750000, raised: 200000, country: 'Portugal', team: 8, year: 2022, mrr: 15000, growth: 11, customers: 12 },
  { email: 'theo@tutorloop.demo', name: 'Theo Hart', company: 'TutorLoop', tagline: 'Peer tutoring for engineering students', industry: 'EDUCATION', stage: 'IDEA', need: 150000, raised: 0, country: 'Belgium', team: 3, year: 2025, mrr: 0, growth: null, customers: 0 },
  { email: 'maya@cargopilot.demo', name: 'Maya Reyes', company: 'CargoPilot', tagline: 'Load matching for regional trucking', industry: 'LOGISTICS', stage: 'GROWTH', need: 2000000, raised: 900000, country: 'Spain', team: 22, year: 2020, mrr: 88000, growth: 6, customers: 230 },
  { email: 'yusuf@visionqa.demo', name: 'Yusuf Okafor', company: 'VisionQA', tagline: 'Computer vision checks for factory lines', industry: 'AI', stage: 'MVP', need: 600000, raised: 150000, country: 'France', team: 7, year: 2023, mrr: 21000, growth: 18, customers: 9 },
  { email: 'clara@fieldsense.demo', name: 'Clara Morel', company: 'FieldSense', tagline: 'Soil sensors that pay for themselves in one season', industry: 'AGRITECH', stage: 'SCALE', need: 3000000, raised: 2200000, country: 'Morocco', team: 35, year: 2019, mrr: 140000, growth: 5, customers: 900 },
  { email: 'owen@shelfwise.demo', name: 'Owen Novak', company: 'Shelfwise', tagline: 'Inventory forecasts for independent shops', industry: 'ECOMMERCE', stage: 'MVP', need: 300000, raised: 50000, country: 'Germany', team: 4, year: 2024, mrr: 6000, growth: 21, customers: 75 },
];
const investors = [
  { email: 'anna@seedlane.demo', name: 'Anna Lindqvist', company: 'Seedlane Capital', type: 'VC', bio: 'Pre-seed and seed fund backing European B2B software. We lead or co-lead and help with the first sales hires.', industries: ['FINTECH', 'AI', 'ECOMMERCE'], stages: ['IDEA', 'MVP'], location: 'France', min: 100000, max: 800000, portfolio: 34 },
  { email: 'marco@verde.demo', name: 'Marco Costa', company: 'Verde Ventures', type: 'VC', bio: 'Climate and food systems. We like hardware with recurring revenue.', industries: ['GREEN_TECH', 'AGRITECH'], stages: ['MVP', 'GROWTH'], location: 'Europe', min: 500000, max: 3000000, portfolio: 21 },
  { email: 'sara@angel.demo', name: 'Sara Ishikawa', company: null, type: 'ANGEL', bio: 'Former health-tech founder. Small first cheques, lots of time.', industries: ['HEALTHCARE', 'EDUCATION'], stages: ['IDEA', 'MVP'], location: 'France', min: 25000, max: 150000, portfolio: 11 },
  { email: 'hugo@atlas.demo', name: 'Hugo Moreau', company: 'Atlas Growth', type: 'VC', bio: 'Series A and B for companies with proven demand.', industries: ['FINTECH', 'LOGISTICS', 'ECOMMERCE'], stages: ['GROWTH', 'SCALE'], location: 'Global', min: 1000000, max: 5000000, portfolio: 48 },
];

async function user(email: string, fullName: string, role: 'STARTUP' | 'INVESTOR', hash: string) {
  return (await prisma.user.findUnique({ where: { email } })) ?? prisma.user.create({ data: { email, fullName, role, password: hash } });
}

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const sUsers = [];
  for (const s of startups) {
    const u = await user(s.email, s.name, 'STARTUP', hash);
    sUsers.push(u);
    await prisma.startupProfile.upsert({
      where: { userId: u.id }, update: {},
      create: {
        userId: u.id, companyName: s.company, tagline: s.tagline, industry: s.industry as any, stage: s.stage as any,
        fundingNeeded: s.need, amountRaised: s.raised, country: s.country, teamSize: s.team, foundedYear: s.year,
        monthlyRevenue: s.mrr, monthlyGrowth: s.growth, customers: s.customers, website: `https://${s.company.toLowerCase().replace(/\s/g, '')}.example`,
        description: `${s.company} is building ${s.tagline.toLowerCase()}. The team ships every week and works closely with its first customers.`,
        traction: s.customers ? `${s.customers} paying customers, ${s.growth ?? 0}% month-on-month growth.` : 'Pilot with two partners starting next quarter.',
      },
    });
  }
  const iUsers = [];
  for (const i of investors) {
    const u = await user(i.email, i.name, 'INVESTOR', hash);
    iUsers.push(u);
    await prisma.investorProfile.upsert({
      where: { userId: u.id }, update: {},
      create: {
        userId: u.id, companyName: i.company, investorType: i.type, bio: i.bio, industries: i.industries as any, stagePreference: i.stages as any,
        location: i.location, minTicket: i.min, maxTicket: i.max, investmentRange: `${i.min}-${i.max}`, portfolioCount: i.portfolio,
      },
    });
  }
  await activity(sUsers, iUsers);
  console.log(`Demo accounts ready (${startups.length} startups, ${investors.length} investors). Password: ${PASSWORD}`);
}

const ago = (days: number, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3600_000);

/** Connections, conversations, a deal pipeline and profile views, so every screen has something to show. */
async function activity(s: { id: string; email: string }[], i: { id: string; email: string }[]) {
  const by = (list: { id: string; email: string }[], email: string) => list.find(u => u.email === email)!;
  const anna = by(i, 'anna@seedlane.demo'), marco = by(i, 'marco@verde.demo'), sara = by(i, 'sara@angel.demo'), hugo = by(i, 'hugo@atlas.demo');
  const yusuf = by(s, 'yusuf@visionqa.demo'), karim = by(s, 'karim@ledgerly.demo'), owen = by(s, 'owen@shelfwise.demo');
  const ines = by(s, 'ines@greengrid.demo'), lena = by(s, 'lena@northwind.demo'), maya = by(s, 'maya@cargopilot.demo'), clara = by(s, 'clara@fieldsense.demo');

  if (await prisma.match.findFirst({ where: { investorId: anna.id } })) {
    console.log('Demo activity already present, skipped.');
    return;
  }
  const profileOf = async (userId: string) => (await prisma.investorProfile.findUnique({ where: { userId } }))?.id ?? null;
  const startupProfile = async (userId: string) => (await prisma.startupProfile.findUnique({ where: { userId } }))!.id;

  type Line = [from: 'S' | 'I', text: string, daysAgo: number, hoursAgo?: number];
  async function connect(startup: { id: string }, investor: { id: string }, status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
                         requestedBy: 'S' | 'I', created: number, lines: Line[] = [], meeting?: { daysAgo: number; slots: string[]; accepted?: number }) {
    const match = await prisma.match.create({
      data: {
        startupId: startup.id, investorId: investor.id, investorProfileId: await profileOf(investor.id), status,
        requestedById: requestedBy === 'S' ? startup.id : investor.id, createdAt: ago(created),
        respondedAt: status === 'PENDING' ? null : ago(created - 1),
      },
    });
    let last: Date | null = null;
    for (const [from, content, d, h] of lines) {
      last = ago(d, h ?? 0);
      await prisma.message.create({ data: { matchId: match.id, senderId: from === 'S' ? startup.id : investor.id, content, createdAt: last } });
    }
    if (meeting) {
      last = ago(meeting.daysAgo);
      await prisma.message.create({
        data: {
          matchId: match.id, senderId: investor.id, kind: 'MEETING', content: 'Meeting request', createdAt: last,
          meta: { slots: meeting.slots, note: '30 minutes on video, I will send the link.', status: meeting.accepted !== undefined ? 'ACCEPTED' : 'PROPOSED',
                  acceptedSlot: meeting.accepted !== undefined ? meeting.slots[meeting.accepted] : null },
        },
      });
    }
    if (last) await prisma.match.update({ where: { id: match.id }, data: { lastMessageAt: last } });
    return match;
  }
  const slot = (daysAhead: number, hour: number) => { const d = new Date(); d.setDate(d.getDate() + daysAhead); d.setHours(hour, 0, 0, 0); return d.toISOString(); };

  // Anna (investor demo account) and Yusuf (startup demo account) see full conversations.
  await connect(yusuf, anna, 'ACCEPTED', 'S', 12, [
    ['S', 'Hi Anna, VisionQA catches defects on factory lines with off-the-shelf cameras. We are raising €600k to deploy at three new plants.', 11, 5],
    ['I', 'Thanks Yusuf. What does a pilot cost a plant, and how long until it pays for itself?', 11, 2],
    ['S', 'Around €18k for the first line, and our current customers break even in under five months on scrap savings.', 10, 20],
    ['I', 'Good numbers. Could you share the deck and two customer references?', 10, 4],
    ['S', 'Sent both by email. Happy to walk you through the dashboard live.', 9, 3],
  ], { daysAgo: 6, slots: [slot(2, 10), slot(3, 14), slot(4, 11)], accepted: 1 });
  await connect(karim, anna, 'ACCEPTED', 'I', 20, [
    ['I', 'Hi Karim, Ledgerly fits our B2B fintech thesis. Are you open to a first call?', 19],
    ['S', 'Absolutely. We just passed 400 customers and keep 97% of them year on year.', 18, 6],
    ['I', 'Impressive retention. Let us set something up next week.', 18, 2],
  ]);
  await connect(owen, anna, 'PENDING', 'S', 1);
  await connect(lena, anna, 'REJECTED', 'S', 25);
  await connect(yusuf, hugo, 'PENDING', 'S', 3);
  await connect(yusuf, sara, 'ACCEPTED', 'I', 15, [
    ['I', 'Your factory use case reminds me of my last company. Keen to hear more.', 14],
    ['S', 'Thanks Sara! Would you be open to joining as an angel alongside a lead fund?', 13, 8],
  ], { daysAgo: 2, slots: [slot(5, 9), slot(6, 16)] });
  await connect(ines, marco, 'ACCEPTED', 'I', 9, [
    ['I', 'GreenGrid is exactly the kind of hardware-plus-software we back.', 8],
    ['S', 'Great to hear. Our battery scheduling cuts grid fees by 22% on average.', 7, 3],
  ]);
  await connect(maya, hugo, 'ACCEPTED', 'S', 30, [['S', 'Hi Hugo, CargoPilot is raising its Series A.', 29], ['I', 'Send me your unit economics, please.', 28]]);
  await connect(clara, marco, 'PENDING', 'S', 2);

  // Anna's deal pipeline
  const pipeline: [{ id: string }, string, string][] = [
    [karim, 'MEETING', 'Strong retention, check churn by plan.'],
    [yusuf, 'DUE_DILIGENCE', 'Call booked. Ask for plant-level ROI data.'],
    [owen, 'CONTACTED', 'Small round, could co-invest with an angel.'],
    [by(s, 'theo@tutorloop.demo'), 'INTERESTED', 'Too early, follow up after the pilot.'],
    [maya, 'PASSED', 'Outside our ticket size.'],
  ];
  for (const [[u, stage, notes], position] of pipeline.map((p, k) => [p, k] as const)) {
    await prisma.pipelineItem.upsert({
      where: { userId_startupId: { userId: anna.id, startupId: await startupProfile(u.id) } }, update: {},
      create: { userId: anna.id, startupId: await startupProfile(u.id), stage, notes, position },
    });
  }

  // Profile views over the last 30 days (analytics charts)
  const viewers = [...i, ...s];
  for (const target of [yusuf, karim, anna]) {
    const isStartup = s.includes(target);
    const profileId = isStartup ? await startupProfile(target.id) : (await profileOf(target.id))!;
    const views = [];
    for (let d = 0; d < 30; d++) {
      const n = (d * 7 + target.email.length) % 4 + (d < 7 ? 2 : 0);
      for (let k = 0; k < n; k++) {
        const viewer = viewers[(d + k) % viewers.length];
        if (viewer.id !== target.id) views.push({ viewerId: viewer.id, profileType: isStartup ? 'STARTUP' : 'INVESTOR', profileId, createdAt: ago(d, k * 3) });
      }
    }
    await prisma.profileView.createMany({ data: views });
  }

  await prisma.notification.createMany({
    data: [
      { userId: anna.id, type: 'CONNECTION_REQUEST', message: 'Owen Novak (Shelfwise) wants to connect', link: '/connections', createdAt: ago(1) },
      { userId: anna.id, type: 'MEETING_ACCEPTED', message: 'Yusuf Okafor accepted your meeting', link: '/inbox', createdAt: ago(5) },
      { userId: yusuf.id, type: 'MEETING_PROPOSED', message: 'Sara Ishikawa proposed a meeting', link: '/inbox', createdAt: ago(2) },
      { userId: yusuf.id, type: 'CONNECTION_ACCEPTED', message: 'Anna Lindqvist accepted your request', link: '/inbox', createdAt: ago(11) },
    ],
  });
  console.log('Demo activity added: connections, conversations, meetings, pipeline, profile views, notifications.');
}

main().finally(() => prisma.$disconnect());
