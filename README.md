# RaiseUp — Investor & Startup Matchmaking Platform

## Overview
RaiseUp is a matchmaking platform that connects startups seeking funding with investors looking for opportunities. The application provides role-based experiences, a guided three-step onboarding, a card-based directory with search and filtering, a matching flow, and messaging once there is mutual interest. The frontend is built with Angular 19. The backend uses Node.js, Express, and Prisma with PostgreSQL. The project includes unit, end-to-end, and load testing and can be run locally or via Docker, with CI/CD to an OVH VPS.

## Tech Stack
- Frontend: Angular 19 (standalone components, Angular Material)
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- Testing: Jest (unit), Playwright (E2E), Artillery (load)
- DevOps: Docker, Docker Compose, GitHub Actions, OVH VPS

## Features
- Authentication with role-based access (Investor / Startup)
- Three-step onboarding for profile completion
- Matching flow and chat after acceptance
- Search and filtering by industry, stage, and funding
- Responsive, lazy-loaded card grid
- Notifications for match status and actions
- CI/CD pipeline with tests and container build

## Main Interfaces
| Interface | Screenshot |
|-----------|------------|
| Login | ![Login](docs/screens/login.png) |
| Register | ![Register](docs/screens/register.png) |
| Dashboard | ![Dashboard](docs/screens/dashboard.png) |
| Profile | ![Profile](docs/screens/profile.png) |
| Investor — Details | ![Investor Details](docs/screens/investor-details.png) |
| Startup — Details (1) | ![Startup Details 1](docs/screens/startup-details-1.png) |
| Startup — Details (2) | ![Startup Details 2](docs/screens/startup-details-2.png) |
| Chat | ![Chat](docs/screens/chat-dialog.png) |
| Onboarding — Step 1 | ![Onboarding Step 1](docs/screens/onboarding-step-1.png) |
| Onboarding — Step 2 | ![Onboarding Step 2](docs/screens/onboarding-step-2.png) |
| Onboarding — Step 3 | ![Onboarding Step 3](docs/screens/onboarding-step-3.png) |


## Prerequisites
- Node.js 20+
- npm
- Docker and Docker Compose
- Git
- Local PostgreSQL or Dockerized PostgreSQL

## Setup

### 1. Clone
```bash
git clone https://github.com/AnassEREKYSY/RaiseUp.git
cd RaiseUp
```
### 2. Backend (API)

```bash
cd server
npm install
npm run prisma:generate
```

Create server/.env:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/raiseup"
JWT_SECRET="your_secret_key"
PORT=4000
```
Run the API:
```bash
npm run dev
```

