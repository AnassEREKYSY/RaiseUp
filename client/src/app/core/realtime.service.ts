import { Injectable, NgZone, effect, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Api } from './api.service';
import { AuthService } from './auth.service';
import { Message, Notification } from './models';

/** Live updates: new messages, meeting answers, connection changes, notifications. */
@Injectable({ providedIn: 'root' })
export class Realtime {
  private auth = inject(AuthService);
  private api = inject(Api);
  private zone = inject(NgZone);
  private socket: Socket | null = null;

  readonly message$ = new Subject<Message>();
  readonly messageUpdate$ = new Subject<Message>();
  readonly connection$ = new Subject<{ id: string }>();
  readonly notification$ = new Subject<Notification>();
  readonly unreadMessages = signal(0);
  readonly unreadNotifications = signal(0);

  constructor() {
    effect(() => {
      const u = this.auth.user();
      if (u && !this.socket) this.connect();
      if (!u && this.socket) { this.socket.disconnect(); this.socket = null; }
    });
  }

  refreshCounts() {
    if (!this.auth.signedIn()) return;
    this.api.unread().subscribe({ next: r => this.unreadMessages.set(r.count), error: () => {} });
    this.api.notifications().subscribe({ next: r => this.unreadNotifications.set(r.unread), error: () => {} });
  }

  private connect() {
    this.refreshCounts();
    this.zone.runOutsideAngular(() => {
      this.socket = io(environment.socketUrl || undefined, { path: '/api/socket.io', auth: { token: this.auth.token }});
      const on = <T>(ev: string, fn: (p: T) => void) => this.socket!.on(ev, (p: T) => this.zone.run(() => fn(p)));
      on<Message>('message:new', m => { this.message$.next(m); if (m.senderId !== this.auth.user()?.id) this.unreadMessages.update(n => n + 1); });
      on<Message>('message:update', m => this.messageUpdate$.next(m));
      on<{ id: string }>('connection:update', c => { this.connection$.next(c); this.refreshCounts(); });
      on<Notification>('notification:new', n => { this.notification$.next(n); this.unreadNotifications.update(x => x + 1); });
    });
  }
}
