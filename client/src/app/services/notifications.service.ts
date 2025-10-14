import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { NotificationDto } from '../core/dtos/notification.dto';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private http: HttpClient) { }
  private base = environment.apiUrl;

  listMine(userId: string) {
    return this.http.get<NotificationDto[]>(`${this.base}/notifications/one/${userId}`);
  }

  markRead(id: string) {
    return this.http.patch<NotificationDto>(`${this.base}/notifications/read/${id}`, {});
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/notifications/delete/${id}`);
  }
}
