import { MatchStatus } from '../enums/enums';

export interface Match {
  id: string;
  startupId: string;
  investorId: string;
  projectId?: string;
  investorProfileId?: string;
  status: MatchStatus;
  createdAt: Date;
}
