import { InvestorProfile } from "./investor.model";
import { User } from "./user.model";

export interface InvestorCardData {
  user: User;
  profile: InvestorProfile;
}