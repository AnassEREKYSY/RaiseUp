import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/http';
import { ProfileFieldsComponent, ProfileModel, Section, toPayload } from '../shared/profile-fields.component';

@Component({
  selector: 'app-onboarding',
  imports: [ProfileFieldsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <p class="eyebrow">Step {{ step() + 1 }} of {{ steps().length }}</p>
      <div class="mt-3 flex gap-1.5" aria-hidden="true">
        @for (s of steps(); track s.key; let i = $index) { <span class="h-1 flex-1 rounded-full" [class]="i <= step() ? 'bg-accent' : 'bg-line/10'"></span> }
      </div>
      <h1 class="h1 mt-8">{{ current().title }}</h1>
      <p class="mt-1.5 text-ink-muted">{{ current().text }}</p>

      <div class="card mt-8 p-5 sm:p-6">
        <app-profile-fields [role]="role()" [section]="current().key" [(value)]="model" />
      </div>
      @if (error()) { <p class="mt-4 rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{{ error() }}</p> }

      <div class="mt-6 flex items-center justify-between">
        @if (step() > 0) { <button type="button" class="btn-ghost" (click)="step.set(step() - 1)">Back</button> } @else { <button type="button" class="btn-ghost" (click)="auth.logout()">Sign out</button> }
        @if (step() < steps().length - 1) {
          <button type="button" class="btn-primary" (click)="nextStep()">Continue</button>
        } @else {
          <button type="button" class="btn-primary" (click)="finish()" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Finish and see matches' }}</button>
        }
      </div>
    </div>
  `,
})
export class OnboardingPage {
  auth = inject(AuthService);
  private api = inject(Api);
  private router = inject(Router);
  role = computed(() => this.auth.user()!.role);
  step = signal(0);
  busy = signal(false);
  error = signal<string | null>(null);
  model = signal<ProfileModel>({ industries: [], stagePreference: [] });

  steps = computed<{ key: Section; title: string; text: string }[]>(() => this.role() === 'STARTUP' ? [
    { key: 'basics', title: 'Your company', text: 'What investors see first.' },
    { key: 'focus', title: 'Your raise', text: 'Industry, stage and how much you are raising. This drives your match score.' },
    { key: 'numbers', title: 'Key numbers', text: 'Optional, but profiles with numbers get more requests.' },
  ] : [
    { key: 'basics', title: 'About you', text: 'Who you are and where you invest.' },
    { key: 'focus', title: 'Your focus', text: 'Industries and stages you invest in. This drives the match score of every startup.' },
    { key: 'numbers', title: 'Ticket size', text: 'The range of a typical first cheque.' },
  ]);
  current = computed(() => this.steps()[this.step()]);

  nextStep() {
    this.error.set(null);
    const m = this.model();
    if (this.role() === 'STARTUP') {
      if (this.current().key === 'basics' && !m['companyName']?.trim()) return this.error.set('Add your company name.');
      if (this.current().key === 'focus' && (!m['industry'] || !m['stage'])) return this.error.set('Pick an industry and a stage.');
    }
    this.step.set(this.step() + 1);
  }

  finish() {
    this.error.set(null);
    this.busy.set(true);
    this.api.saveProfile(toPayload(this.role(), this.model())).subscribe({
      next: r => { this.auth.setUser(r.user); this.router.navigateByUrl('/'); },
      error: e => { this.busy.set(false); this.error.set(errorText(e)); },
    });
  }
}
