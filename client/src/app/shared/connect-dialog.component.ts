import { ChangeDetectionStrategy, Component, HostListener, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { errorText } from '../core/http';
import { ToastService } from '../core/toast.service';
import { IconComponent } from './icon.component';

/** Connection request with an optional first message. */
@Component({
  selector: 'app-connect-dialog',
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 sm:items-center sm:p-4" (click)="closed.emit()">
      <form class="w-full max-w-lg rounded-t-2xl bg-surface p-5 shadow-2xl sm:rounded-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="cd-title"
            (click)="$event.stopPropagation()" (ngSubmit)="send()">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="cd-title" class="h2">Connect with {{ name() }}</h2>
            <p class="mt-1 text-sm text-ink-muted">Once they accept, you can message and propose a meeting.</p>
          </div>
          <button type="button" class="btn-ghost btn-icon -mr-2 -mt-1" (click)="closed.emit()" aria-label="Close"><app-icon name="x" /></button>
        </div>
        <label class="label mt-5" for="intro">Add a note (optional)</label>
        <textarea id="intro" name="intro" class="input" rows="4" maxlength="2000" [(ngModel)]="note" [placeholder]="placeholder()"></textarea>
        <p class="hint">A short, specific note gets more answers.</p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn-ghost" (click)="closed.emit()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Send request' }}</button>
        </div>
      </form>
    </div>
  `,
})
export class ConnectDialogComponent {
  userId = input.required<string>();
  name = input.required<string>();
  placeholder = input('Why do you think there is a fit?');
  closed = output<void>();
  sent = output<string>();
  private api = inject(Api);
  private toast = inject(ToastService);
  note = '';
  busy = signal(false);

  send() {
    this.busy.set(true);
    this.api.connect(this.userId(), this.note.trim() || undefined).subscribe({
      next: r => { this.toast.show('Request sent'); this.sent.emit(r.id); },
      error: e => { this.busy.set(false); this.toast.error(errorText(e)); },
    });
  }
  @HostListener('document:keydown.escape') esc() { this.closed.emit(); }
}
