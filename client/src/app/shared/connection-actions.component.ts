import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/http';
import { ConnectionRef } from '../core/models';
import { Realtime } from '../core/realtime.service';
import { ToastService } from '../core/toast.service';
import { ConnectDialogComponent } from './connect-dialog.component';
import { IconComponent } from './icon.component';

/** Connect / pending / accept-decline / message, depending on the connection state. */
@Component({
  selector: 'app-connection-actions',
  imports: [RouterLink, IconComponent, ConnectDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap gap-2' },
  template: `
    @let c = connection();
    @if (!c || c.status === 'REJECTED') {
      <button type="button" class="btn-primary" (click)="dialog.set(true)"><app-icon name="plus" [size]="16" /> Connect</button>
    } @else if (c.status === 'ACCEPTED') {
      <a [routerLink]="['/inbox', c.id]" class="btn-primary"><app-icon name="message" [size]="16" /> Message</a>
    } @else if (incoming()) {
      <button type="button" class="btn-primary" (click)="answer(true)" [disabled]="busy()">Accept request</button>
      <button type="button" class="btn-secondary" (click)="answer(false)" [disabled]="busy()">Decline</button>
    } @else {
      <a [routerLink]="['/inbox', c.id]" class="btn-secondary"><app-icon name="clock" [size]="16" /> Request sent</a>
    }
    @if (dialog()) {
      <app-connect-dialog [userId]="userId()" [name]="name()" (closed)="dialog.set(false)" (sent)="dialog.set(false); changed.emit()" />
    }
  `,
})
export class ConnectionActionsComponent {
  connection = input<ConnectionRef | null | undefined>(null);
  userId = input.required<string>();
  name = input.required<string>();
  changed = output<void>();
  private api = inject(Api);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private rt = inject(Realtime);
  dialog = signal(false);
  busy = signal(false);
  incoming = computed(() => { const c = this.connection(); return !!c && c.requestedById !== this.auth.user()?.id; });

  answer(accept: boolean) {
    const c = this.connection();
    if (!c) return;
    this.busy.set(true);
    (accept ? this.api.accept(c.id) : this.api.decline(c.id)).subscribe({
      next: () => { this.busy.set(false); this.toast.show(accept ? 'Connected' : 'Request declined'); this.rt.refreshCounts(); this.changed.emit(); },
      error: e => { this.busy.set(false); this.toast.error(errorText(e)); },
    });
  }
}
