import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/http';
import { Role } from '../core/models';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid min-h-dvh lg:grid-cols-2">
      <div class="flex flex-col px-6 py-8 sm:px-12">
        <a routerLink="/" class="flex items-center gap-2.5" aria-label="RaiseUp">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#1F5E46"/><path d="M9 21l7-8 4 4 3-4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 9h4v4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="text-[16px] font-semibold">RaiseUp</span>
        </a>
        <div class="mx-auto my-auto w-full max-w-sm py-10">
          <h1 class="text-2xl font-semibold tracking-[-0.02em]">{{ isLogin() ? 'Welcome back' : 'Create your account' }}</h1>
          <p class="mt-1.5 text-ink-muted">{{ isLogin() ? 'Sign in to see your matches and messages.' : 'Free for startups and investors.' }}</p>

          <form class="mt-8 space-y-4" (ngSubmit)="submit()" novalidate>
            @if (!isLogin()) {
              <fieldset>
                <legend class="label">I am</legend>
                <div class="grid grid-cols-2 gap-2">
                  @for (r of roles; track r.v) {
                    <label class="flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors"
                           [class]="role() === r.v ? 'border-accent bg-accent-soft' : 'border-line/[0.14] hover:border-line/30'">
                      <input type="radio" name="role" class="sr-only" [value]="r.v" [checked]="role() === r.v" (change)="role.set(r.v)" />
                      <app-icon [name]="r.icon" [size]="18" [class]="role() === r.v ? 'text-accent' : 'text-ink-muted'" />
                      <span class="text-sm font-medium">{{ r.label }}</span>
                      <span class="text-2xs text-ink-faint">{{ r.hint }}</span>
                    </label>
                  }
                </div>
              </fieldset>
              <div>
                <label class="label" for="name">Full name</label>
                <input id="name" name="name" class="input" autocomplete="name" [(ngModel)]="fullName" required />
              </div>
            }
            <div>
              <label class="label" for="email">Email</label>
              <input id="email" name="email" type="email" class="input" autocomplete="email" [(ngModel)]="email" required />
            </div>
            <div>
              <div class="flex items-baseline justify-between"><label class="label" for="password">Password</label>@if (!isLogin()) { <span class="text-2xs text-ink-faint">At least 8 characters</span> }</div>
              <input id="password" name="password" type="password" class="input" [autocomplete]="isLogin() ? 'current-password' : 'new-password'" [(ngModel)]="password" required />
            </div>
            @if (error()) { <p class="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{{ error() }}</p> }
            <button type="submit" class="btn-primary h-11 w-full" [disabled]="busy()">{{ busy() ? 'Please wait…' : isLogin() ? 'Sign in' : 'Create account' }}</button>
          </form>
          <p class="mt-6 text-center text-sm text-ink-muted">
            @if (isLogin()) { New to RaiseUp? <a routerLink="/register" class="link">Create an account</a> }
            @else { Already have an account? <a routerLink="/login" class="link">Sign in</a> }
          </p>
        </div>
      </div>
      <div class="hidden flex-col justify-center bg-accent px-16 text-white lg:flex">
        <p class="max-w-md text-[28px] font-semibold leading-tight tracking-[-0.02em]">Meet the investors and startups that actually fit you.</p>
        <ul class="mt-10 max-w-md space-y-5 text-[15px] text-white/85">
          <li class="flex gap-3"><app-icon name="sparkle" class="mt-0.5 text-white" /> A match score on every profile, based on industry, stage, ticket size and country.</li>
          <li class="flex gap-3"><app-icon name="message" class="mt-0.5 text-white" /> Requests, messages and meeting times in one inbox.</li>
          <li class="flex gap-3"><app-icon name="chart" class="mt-0.5 text-white" /> See who viewed you and how your raise is going.</li>
        </ul>
      </div>
    </div>
  `,
})
export class AuthPage {
  mode = input<'login' | 'register'>('login');
  next = input<string>();
  private auth = inject(AuthService);
  private router = inject(Router);
  isLogin = computed(() => this.mode() === 'login');
  roles: { v: Role; label: string; hint: string; icon: string }[] = [
    { v: 'STARTUP', label: 'A startup', hint: 'Raising money', icon: 'building' },
    { v: 'INVESTOR', label: 'An investor', hint: 'Looking for deals', icon: 'briefcase' },
  ];
  role = signal<Role>('STARTUP');
  fullName = ''; email = ''; password = '';
  busy = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.error.set(null);
    const email = this.email.trim();
    if (!this.isLogin() && this.fullName.trim().length < 2) return this.error.set('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.error.set('Enter a valid email address.');
    if (!this.isLogin() && this.password.length < 8) return this.error.set('Use at least 8 characters for your password.');
    if (!this.password) return this.error.set('Enter your password.');
    this.busy.set(true);
    const call = this.isLogin()
      ? this.auth.login(email, this.password)
      : this.auth.register({ email, password: this.password, fullName: this.fullName.trim(), role: this.role() });
    call.subscribe({
      next: r => {
        const next = this.next();
        this.router.navigateByUrl(!r.user.hasProfile ? '/onboarding' : next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
      },
      error: e => { this.busy.set(false); this.error.set(errorText(e)); },
    });
  }
}
