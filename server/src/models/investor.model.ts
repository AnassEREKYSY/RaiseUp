import { Industry, Stage } from './enums';

export interface InvestorProfile {
  id: string;
  userId: string;
  companyName?: string;
  investmentRange?: string;
  industries: Industry[];
  location?: string;
  stagePreference: Stage[];
  website?: string;
  bio?: string;
  createdAt: Date;
}
