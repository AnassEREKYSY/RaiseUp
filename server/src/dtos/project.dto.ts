import { Industry } from '../enums/enums';

export interface CreateProjectDto {
  title: string;
  description: string;
  fundingGoal?: number;
  industry: Industry;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}
