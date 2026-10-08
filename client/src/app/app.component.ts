import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Realtime } from './core/realtime.service';
import { ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <div class="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="pointer-events-auto rounded-lg px-4 py-2.5 text-sm shadow-lg"
             [class]="t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-white'">{{ t.text }}</div>
      }
    </div>
  `,
})
export class AppComponent {
  toast = inject(ToastService);
  // Started here so live updates run on every page.
  private realtime = inject(Realtime);
}
