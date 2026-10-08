export type Role = 'STARTUP' | 'INVESTOR' | 'ADMIN';
export type Industry = 'FINTECH' | 'HEALTHCARE' | 'EDUCATION' | 'ECOMMERCE' | 'AI' | 'BLOCKCHAIN' | 'GREEN_TECH' | 'LOGISTICS' | 'AGRITECH' | 'OTHER';
export type Stage = 'IDEA' | 'MVP' | 'GROWTH' | 'SCALE' | 'EXIT';
export type InvestorType = 'ANGEL' | 'VC' | 'CORPORATE' | 'FAMILY_OFFICE' | 'ACCELERATOR';
export type PipelineStage = 'INTERESTED' | 'CONTACTED' | 'MEETING' | 'DUE_DILIGENCE' | 'INVESTED' | 'PASSED';
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface PublicUser { id: string; fullName: string; avatarUrl: string | null; role: Role; }
export interface MatchReason { label: string; points: number; max: number; ok: boolean; }
export interface MatchScore { score: number; reasons: MatchReason[]; }
export interface ConnectionRef { id: string; status: ConnectionStatus; requestedById: string | null; createdAt: string; }

export interface StartupCard {
  id: string; userId: string; companyName: string; tagline: string | null; description: string | null;
  industry: Industry; stage: Stage; fundingNeeded: number | null; amountRaised: number | null; country: string | null;
  teamSize: number | null; createdAt: string; founder: PublicUser; match: MatchScore | null;
}
export interface Project { id: string; title: string; description: string; fundingGoal: number | null; industry: Industry; createdAt: string; }
export interface StartupDetail extends StartupCard {
  website: string | null; traction: string | null; pitchDeckUrl: string | null; foundedYear: number | null;
  monthlyRevenue: number | null; monthlyGrowth: number | null; customers: number | null; projects: Project[];
  connection?: ConnectionRef | null; pipeline?: { stage: PipelineStage; notes: string | null; updatedAt: string } | null;
}
export interface InvestorCard {
  id: string; userId: string; name: string | null; companyName: string | null; investorType: InvestorType | null; bio: string | null;
  industries: Industry[]; stagePreference: Stage[]; location: string | null; minTicket: number | null; maxTicket: number | null;
  investmentRange: string | null; portfolioCount: number | null; createdAt: string; user: PublicUser; match: MatchScore | null;
}
export interface InvestorDetail extends InvestorCard { website: string | null; connection?: ConnectionRef | null; }

export interface Me {
  id: string; email: string; fullName: string; avatarUrl: string | null; role: Role; createdAt: string; hasProfile: boolean;
  startup: StartupDetail | null; investor: InvestorDetail | null;
}

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number; }

export interface Counterpart extends PublicUser {
  profile: { type: 'STARTUP' | 'INVESTOR'; profileId: string; title: string | null; industry?: Industry; stage?: Stage; investorType?: InvestorType | null } | null;
}
export interface Conversation {
  id: string; status: ConnectionStatus; direction: 'incoming' | 'outgoing' | 'unknown'; createdAt: string; lastMessageAt: string;
  counterpart: Counterpart; lastMessage: { content: string; senderId: string; createdAt: string } | null; unread: number;
}
export interface MeetingMeta { slots: string[]; note: string | null; status: 'PROPOSED' | 'ACCEPTED' | 'DECLINED'; acceptedSlot: string | null; }
export interface Message { id: string; matchId: string; senderId: string; content: string; kind: 'TEXT' | 'MEETING'; meta: MeetingMeta | null; createdAt: string; }
export interface Thread { id: string; status: ConnectionStatus; direction: Conversation['direction']; createdAt: string; counterpart: Counterpart; messages: Message[]; }

export interface Notification { id: string; type: string; message: string; isRead: boolean; createdAt: string; link: string | null; }

export interface PipelineItem { id: string; stage: PipelineStage; notes: string | null; position: number; createdAt: string; updatedAt: string; startup: StartupCard; }

export interface Analytics {
  role: Role; period: number;
  views: { total: number; previous: number; unique: number; daily: { date: string; count: number }[] };
  requests: { received: number; sent: number; pendingReceived: number; acceptedConnections: number; acceptanceRateSent: number | null; medianResponseHours: number | null };
  startup?: { inPipelines: number; viewerTypes: { name: string; count: number }[] };
  investor?: { pipeline: { stage: PipelineStage; count: number }[]; startupsViewed: number; byIndustry: { name: string; count: number }[]; byStage: { name: string; count: number }[] };
}
