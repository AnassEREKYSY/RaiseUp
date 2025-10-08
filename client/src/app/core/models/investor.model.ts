import { Industry } from "../enums/industry.enum";
import { Stage } from "../enums/stage.enum";

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
