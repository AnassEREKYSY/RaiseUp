import { MatchStatus } from "../enums/match-status.enum";

export interface MatchDto {
  id: string;
  startupId: string;
  investorId: string;
  projectId?: string | null;
  investorProfileId?: string | null;
  status: MatchStatus;
  createdAt: string;
}