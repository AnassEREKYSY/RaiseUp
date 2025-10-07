import { Role } from '../models/enums';

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}
