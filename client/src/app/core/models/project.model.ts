import { Industry } from '../enums/industry.enum';

export interface Project {
  id: string;
  startupId: string;
  title: string;
  description: string;
  fundingGoal?: number;
  industry: Industry;
  createdAt: Date;
}
