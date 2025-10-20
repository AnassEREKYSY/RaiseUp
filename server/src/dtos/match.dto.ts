import { MatchStatus } from '../enums/enums';

export interface CreateMatchDto {
  startupId: string;
  investorId: string;
  projectId?: string;
  investorProfileId?: string;
}

export interface UpdateMatchStatusDto {
  status: MatchStatus;
}
