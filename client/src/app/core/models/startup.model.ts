import { Industry } from "../enums/industry.enum";
import { Stage } from "../enums/stage.enum";

export interface StartupProfile {
  id: string;
  userId: string;
  companyName: string;
  description?: string;
  industry: Industry;
  stage: Stage;
  fundingNeeded?: number;
  teamSize?: number;
  website?: string;
  country?: string;
  traction?: string;
  pitchDeckUrl?: string;
  createdAt: Date;
}
