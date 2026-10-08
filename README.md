# RaiseUp

RaiseUp connects startups that are raising money with investors who fit them.

Live: https://raiseup.anasserekysy.com

## Features

- **Match score** on every profile (0-100) from industry, stage, ticket size and country, with the reasons shown. "Recommended for you" lists the best fits you are not connected with yet.
- **Discover** startups or investors with search, filters and sorting by match.
- **Connections**: request with a short note, accept or decline. Messaging opens once both sides agree.
- **Real-time inbox**: conversations, unread counts, live messages (Socket.IO), and **meeting requests** with up to three proposed times.
- **Deal pipeline** for investors: a private board (Interested, Contacted, Meeting, Due diligence, Invested, Passed) with drag and drop and notes.
- **Analytics**: profile views per day, who looks at you, requests and reply time; for investors, pipeline and deal flow by industry.
- **Profiles** with the raise (amount, committed, progress), key numbers, projects; guided onboarding in three steps.
- Notifications for requests, answers and meetings.

## Stack

| Part | Tech |
|---|---|
| Client | Angular 19 (standalone, signals), Tailwind CSS, Angular CDK drag and drop, Socket.IO client, Playwright |
| API | Node.js 20, Express 5, Prisma 6, PostgreSQL 16, Socket.IO, Zod validation, JWT, Jest + Supertest |
| Delivery | Docker, GitHub Actions, GHCR, OVH VM behind an Nginx reverse proxy |

```
client/   Angular app, served by Nginx (proxies /api and the socket to the API)
server/   Express API: auth, profiles, directory + match score, connections, inbox, pipeline, analytics
deploy/   docker-compose.prod.yml, deploy.sh and the reverse-proxy site used on the VM
```

## Run locally

```bash
# API
cd server
cp .env.example .env          # DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate deploy
npm run seed:demo             # optional: 8 startups, 4 investors (password demo-pass-123)
npm run dev                   # http://localhost:4000

# Client
cd client
npm install
npm start                     # http://localhost:4200
```

Demo accounts after `seed:demo`: `anna@seedlane.demo` (investor), `yusuf@visionqa.demo` (startup).

## Tests

```bash
cd server && npm test         # match score, analytics, API rules (auth, privacy of conversations, roles)
cd client && npm run e2e      # Playwright with a mocked API
```

The pipeline also upgrades a database created by the previous version (with data in it) and checks that the migrations match `schema.prisma` exactly.

## Deployment

Every push to `main` runs the tests, builds both images, pushes them to GHCR and deploys them on the VM. See [DEPLOYMENT.md](DEPLOYMENT.md).
