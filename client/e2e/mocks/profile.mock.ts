import { Page } from '@playwright/test';

export async function mockStartupProfile(page: Page) {
  await page.route('**/startups/one/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'startup-1',
        userId: 'u1',
        companyName: 'NovaTech',
        industry: 'AI',
        stage: 'SEED',
        country: 'Morocco',
        website: 'https://novatech.io',
        description: 'Building intelligent logistics software.',
        createdAt: new Date().toISOString(),
        projects: [
          { title: 'AI Fleet', industry: 'AI', description: 'Smart transport optimization', fundingGoal: 100000, createdAt: new Date() },
          { title: 'EcoTrack', industry: 'GREEN_TECH', description: 'Carbon footprint monitoring', fundingGoal: 250000, createdAt: new Date() }
        ]
      })
    })
  );

  await page.route('**/matches/all/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  );
}

export async function mockInvestorProfile(page: Page) {
  await page.route('**/investors/one/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'investor-1',
        userId: 'u2',
        companyName: 'Alpha Ventures',
        industries: ['FINTECH', 'AI'],
        investmentRange: '$10k - $1M',
        location: 'Paris, France',
        website: 'https://alphaventures.io',
        bio: 'Early-stage VC focusing on AI and fintech startups.',
        createdAt: new Date().toISOString()
      })
    })
  );

  await page.route('**/matches/all/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'm1', investorId: 'u2', startupId: 's1', status: 'ACCEPTED' }
      ])
    })
  );

  await page.route('**/startups/all', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { userId: 's1', companyName: 'NovaTech', industry: 'AI', stage: 'SEED', createdAt: new Date().toISOString(), description: 'AI logistics startup' }
      ])
    })
  );
}
