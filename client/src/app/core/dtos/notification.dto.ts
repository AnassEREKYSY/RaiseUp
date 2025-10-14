import { NotificationStatus } from "../enums/notification-status.enum";

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationStatus | string;
  message: string;
  isRead: boolean;
  createdAt: string;
}