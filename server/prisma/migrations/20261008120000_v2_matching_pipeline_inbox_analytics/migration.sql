-- v2: match score inputs, deal pipeline, inbox (read marks, meeting messages), analytics (profile views).
-- Additive only: no column or table is dropped.

-- AlterTable
ALTER TABLE "StartupProfile" ADD COLUMN     "amountRaised" DOUBLE PRECISION,
ADD COLUMN     "customers" INTEGER,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "monthlyGrowth" DOUBLE PRECISION,
ADD COLUMN     "monthlyRevenue" DOUBLE PRECISION,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "InvestorProfile" ADD COLUMN     "investorType" TEXT,
ADD COLUMN     "maxTicket" DOUBLE PRECISION,
ADD COLUMN     "minTicket" DOUBLE PRECISION,
ADD COLUMN     "portfolioCount" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "requestedById" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "link" TEXT;

-- CreateTable
CREATE TABLE "MatchRead" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchRead_pkey" PRIMARY KEY ("matchId","userId")
);

-- CreateTable
CREATE TABLE "PipelineItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'INTERESTED',
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineItem_userId_stage_idx" ON "PipelineItem"("userId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineItem_userId_startupId_key" ON "PipelineItem"("userId", "startupId");

-- CreateIndex
CREATE INDEX "ProfileView_profileType_profileId_createdAt_idx" ON "ProfileView"("profileType", "profileId", "createdAt");

-- CreateIndex
CREATE INDEX "Match_startupId_idx" ON "Match"("startupId");

-- CreateIndex
CREATE INDEX "Match_investorId_idx" ON "Match"("investorId");

-- CreateIndex
CREATE INDEX "Message_matchId_createdAt_idx" ON "Message"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "MatchRead" ADD CONSTRAINT "MatchRead_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRead" ADD CONSTRAINT "MatchRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineItem" ADD CONSTRAINT "PipelineItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineItem" ADD CONSTRAINT "PipelineItem_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "StartupProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
