/**
 * Demo data for local development: `npm run seed:demo`.
 * Creates accounts only when their email does not exist yet. Password for all: demo-pass-123
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
  console.log(`Demo accounts ready (${startups.length} startups, ${investors.length} investors). Password: ${PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
