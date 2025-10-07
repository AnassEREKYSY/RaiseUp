import { Role } from './enums';

export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
