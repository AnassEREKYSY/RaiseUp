import { StartupProfile } from "./startup.model";
import { User } from "./user.model";

export interface StartupCardData {
  user: User;
  profile: StartupProfile;
}