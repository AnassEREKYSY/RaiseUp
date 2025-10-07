export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
