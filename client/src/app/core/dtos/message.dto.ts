
export interface MessageDto {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; fullName: string; avatarUrl?: string };
}