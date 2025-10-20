import { Industry, Stage } from '../enums/enums';

export interface CreateStartupDto {
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
}

export interface UpdateStartupDto extends Partial<CreateStartupDto> {}
