import { MatchStatus } from '../models/enums';

export interface CreateMatchDto {
  startupId: string;
  investorId: string;
  projectId?: string;
  investorProfileId?: string;
}

export interface UpdateMatchStatusDto {
  status: MatchStatus;
}
