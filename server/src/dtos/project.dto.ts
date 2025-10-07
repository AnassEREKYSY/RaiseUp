import { Industry } from '../models/enums';

export interface CreateProjectDto {
  title: string;
  description: string;
  fundingGoal?: number;
  industry: Industry;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}
