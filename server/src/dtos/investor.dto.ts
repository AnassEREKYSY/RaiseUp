import { Industry, Stage } from '../enums/enums';

export interface CreateInvestorDto {
  companyName?: string;
  investmentRange?: string;
  industries: Industry[];
  location?: string;
  stagePreference: Stage[];
  website?: string;
  bio?: string;
}

export interface UpdateInvestorDto extends Partial<CreateInvestorDto> {}
