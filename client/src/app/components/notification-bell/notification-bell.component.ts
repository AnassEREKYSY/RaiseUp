import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationsService } from '../../services/notifications.service';
import { MatchesService } from '../../services/match.service';
import { NotificationDto } from '../../core/dtos/notification.dto';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit {
  open = false;
  loading = false;
  items: NotificationDto[] = [];
  unreadCount = 0;

  constructor(
    private notifications: NotificationsService,
    private matches: MatchesService
  ) {}

  ngOnInit() {
    this.load();
  }

  toggle() {
    this.open = !this.open;
    if (this.open) this.load();
  }

  load() {
    const meId = localStorage.getItem('uid') ?? '';
    if (!meId) return;
    this.loading = true;
    this.notifications.listMine(meId).subscribe({
      next: list => {
        this.items = list;
        this.unreadCount = list.filter(x => !x.isRead).length;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  extractMatchId(n: NotificationDto): string | null {
    // If you store matchId inside message body later, parse it here.
    // For now this returns null; adjust your NotificationService.create(...) on server to include matchId if you want direct mapping.
    return null;
  }

  accept(matchId: string) {
    this.matches.accept(matchId).subscribe(() => this.load());
  }

  reject(matchId: string) {
    this.matches.reject(matchId).subscribe(() => this.load());
  }
}
