import { Component, EventEmitter, HostListener, Output, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../core/models/user.model';
import { NotificationsService } from '../../services/notifications.service';
import { NotificationDto } from '../../core/dtos/notification.dto';
import { MatchDto } from '../../core/dtos/match.dto';
import { MatchesService } from '../../services/match.service';
import { SearchBusService } from '../../services/search-bus.service';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Output() searchSubmit = new EventEmitter<string>();
  form!: FormGroup;

  user!: User;

  open = false;
  loading = false;

  notifications: NotificationDto[] = [];
  pending: MatchDto[] = [];
  hasNewNotifications = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private notif: NotificationsService,
    private matches: MatchesService,
    private el: ElementRef<HTMLElement>,
    private searchBus: SearchBusService
  ) {
    this.form = this.fb.group({ q: [''] });
    this.user = this.auth.currentUser;
    this.refreshBadge();
  }

  ngOnInit() {
    this.form.get('q')!.valueChanges
      .pipe(
        startWith(this.form.get('q')!.value || ''),
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe((val: string) => this.searchBus.set(val || ''));
  }

  onSubmit() {
    const q = this.form.value.q?.trim() || '';
    this.searchSubmit.emit(q);
    this.searchBus.set(q);
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

  openNotifications() {
    this.open = !this.open;
    if (this.open) this.load();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private load() {
    const meId = this.user?.id || localStorage.getItem('uid') || '';
    if (!meId) return;
    this.loading = true;

    this.notif.listMine(meId).subscribe({
      next: (list) => {
        this.notifications = Array.isArray(list) ? list : [];
        this.refreshBadge();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.matches.listAll().subscribe({
      next: (all) => {
        this.pending = (all || []).filter(m =>
          (m.startupId === meId || m.investorId === meId) && m.status === 'PENDING'
        );
        this.refreshBadge();
      }
    });
  }

  accept(m: MatchDto) {
    this.matches.accept(m.id).subscribe({
      next: () => {
        this.pending = this.pending.filter(x => x.id !== m.id);
        this.refreshBadge();
      }
    });
  }

  reject(m: MatchDto) {
    this.matches.reject(m.id).subscribe({
      next: () => {
        this.pending = this.pending.filter(x => x.id !== m.id);
        this.refreshBadge();
      }
    });
  }

  markAsRead(n: NotificationDto) {
    if (n.isRead) return;
    this.notif.markRead(n.id).subscribe({
      next: (updated) => {
        const idx = this.notifications.findIndex(x => x.id === n.id);
        if (idx > -1) this.notifications[idx] = updated;
        this.refreshBadge();
      }
    });
  }

  remove(n: NotificationDto) {
    this.notif.delete(n.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(x => x.id !== n.id);
        this.refreshBadge();
      }
    });
  }

  trackById = (_: number, x: { id: string }) => x.id;

  private refreshBadge() {
    const unread = this.notifications.filter(x => !x.isRead).length;
    const pend = this.pending.length;
    this.hasNewNotifications = unread + pend > 0;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(ev: MouseEvent) {
    if (!this.open) return;
    const host = this.el.nativeElement;
    if (!host.contains(ev.target as Node)) this.open = false;
  }
}
