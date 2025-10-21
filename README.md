# RaiseUp — Investor & Startup Matchmaking Platform

## Overview
RaiseUp is a matchmaking platform that connects startups seeking funding with investors looking for opportunities. The application provides role-based experiences, a guided three-step onboarding, a card-based directory with search and filtering, a matching flow, and messaging once there is mutual interest. The frontend is built with Angular 19. The backend uses Node.js, Express, and Prisma with PostgreSQL. The project includes unit, end-to-end, and load testing and can be run locally or via Docker, with CI/CD to an OVH VPS.

## Tech Stack
**Frontend**  
![Angular](https://img.shields.io/badge/Angular-19-EA4335?logo=angular&logoColor=white)
![Angular Material](https://img.shields.io/badge/Angular%20Material-UI-757575?logo=angular&logoColor=white)

**Backend**  
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)

**Database**  
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-336791?logo=postgresql&logoColor=white)

**Testing**  
![Jest](https://img.shields.io/badge/Jest-Unit-C21325?logo=jest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=microsoftplaywright&logoColor=white)
![Artillery](https://img.shields.io/badge/Artillery-Load-F9A03C?logo=artillery&logoColor=white)

**DevOps**  
![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white)
![OVHcloud](https://img.shields.io/badge/OVHcloud-Deploy-123F6D?logo=ovh&logoColor=white)


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

### 3. Setup the frontend (Angular)

```bash
cd client
npm install
```

Update your src/environments/environment.ts:
```bash
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000/api'
};
```

To run locally:
```bash
npm run start
```

### 4. Run the tests 

Unit tests (Jest):
```bash
cd server
npm run test
npm run test:cov
```

Load tests (Artillery):
```bash
cd server
npm run load:test
npm run load:report
```

E2E tests (Playwright):
```bash
cd client
npm run e2e:test
```

### 5. Deployment (CI/CD)

Deployment pipeline defined in .github/workflows/ci.yml

- Includes:

- Linting & testing

- Build API & client images

- Push to GitHub Container Registry

- SSH deploy to OVH VPS


## Creator 

| Name | Role | Contact |
|------|------|----------|
| **Anass EREKYSY** | Full-Stack Developer / DevOps / QA | [GitHub](https://github.com/AnassEREKYSY) / [LinkedIn](https://www.linkedin.com/in/anass-erekysy-5a8939204/) |

