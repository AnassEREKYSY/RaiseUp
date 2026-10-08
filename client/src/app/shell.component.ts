import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Api } from './core/api.service';
import { AuthService } from './core/auth.service';
import { Notification } from './core/models';
import { AgoPipe } from './core/pipes';
import { Realtime } from './core/realtime.service';
import { AvatarComponent } from './shared/avatar.component';
import { IconComponent } from './shared/icon.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, IconComponent, AvatarComponent, AgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
    <div class="flex min-h-dvh">
      <!-- Sidebar -->
      <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line/[0.07] bg-surface px-3 py-5 md:flex">
        <a routerLink="/" class="flex items-center gap-2.5 px-3" aria-label="RaiseUp home">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#1F5E46"/><path d="M9 21l7-8 4 4 3-4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 9h4v4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="text-[16px] font-semibold tracking-[-0.01em]">RaiseUp</span>
        </a>
        <nav class="mt-8 flex flex-col gap-0.5" aria-label="Main">
          @for (l of links(); track l.path) {
            <a [routerLink]="l.path" routerLinkActive="!bg-accent-soft !text-accent" [routerLinkActiveOptions]="{ exact: l.path === '/' }"
               class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-subtle hover:text-ink">
              <app-icon [name]="l.icon" [size]="18" /> <span class="flex-1">{{ l.label }}</span>
              @if (l.badge && l.badge()) { <span class="rounded-full bg-accent px-1.5 text-2xs font-semibold leading-5 text-white">{{ l.badge() }}</span> }
            </a>
          }
        </nav>
        <div class="mt-auto rounded-lg border border-line/[0.07] p-3">
          <div class="flex items-center gap-2.5">
            <app-avatar [name]="auth.user()?.fullName" [size]="32" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ auth.user()?.fullName }}</p>
              <p class="truncate text-2xs text-ink-faint">{{ profileName() }}</p>
            </div>
          </div>
          <div class="mt-3 flex gap-1">
            <a routerLink="/profile" class="btn-ghost btn-sm flex-1"><app-icon name="settings" [size]="14" /> Profile</a>
            <button type="button" class="btn-ghost btn-sm" (click)="auth.logout()" aria-label="Sign out" title="Sign out"><app-icon name="logout" [size]="15" /></button>
          </div>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Top bar -->
        <header class="sticky top-0 z-30 border-b border-line/[0.07] bg-bg/90 backdrop-blur">
          <div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <a routerLink="/" class="md:hidden" aria-label="RaiseUp home">
              <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#1F5E46"/><path d="M9 21l7-8 4 4 3-4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 9h4v4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <form class="relative w-full max-w-md" role="search" (ngSubmit)="search()">
              <app-icon name="search" [size]="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input name="q" [(ngModel)]="q" type="search" [placeholder]="auth.isInvestor() ? 'Search startups' : 'Search investors'" aria-label="Search"
                     class="h-9 w-full rounded-lg border border-line/[0.12] bg-surface pl-9 pr-3 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none" />
            </form>
            <div class="relative ml-auto">
              <button type="button" class="btn-ghost btn-icon relative" (click)="toggleNotifications()" [attr.aria-expanded]="panel()" aria-label="Notifications" data-panel>
                <app-icon name="bell" />
                @if (rt.unreadNotifications()) { <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg"></span> }
              </button>
              @if (panel()) {
                <div class="absolute right-0 top-11 w-[min(92vw,360px)] rounded-card border border-line/[0.1] bg-surface shadow-xl" data-panel>
                  <div class="flex items-center justify-between border-b border-line/[0.07] px-4 py-3">
                    <p class="text-sm font-semibold">Notifications</p>
                    @if (rt.unreadNotifications()) { <button type="button" class="text-[13px] text-accent hover:underline" (click)="readAll()">Mark all as read</button> }
                  </div>
                  <ul class="max-h-96 overflow-y-auto">
                    @for (n of notes(); track n.id) {
                      <li>
                        <button type="button" class="flex w-full gap-3 px-4 py-3 text-left hover:bg-subtle" (click)="open(n)">
                          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" [class]="n.isRead ? 'bg-transparent' : 'bg-accent'"></span>
                          <span class="flex-1 text-sm" [class.text-ink-muted]="n.isRead">{{ n.message }}</span>
                          <span class="shrink-0 text-2xs text-ink-faint">{{ n.createdAt | ago }}</span>
                        </button>
                      </li>
                    } @empty {
                      <li class="px-4 py-8 text-center text-sm text-ink-muted">Nothing new.</li>
                    }
                  </ul>
                </div>
              }
            </div>
            <a routerLink="/profile" class="md:hidden" aria-label="Your profile"><app-avatar [name]="auth.user()?.fullName" [size]="32" /></a>
          </div>
        </header>

        <main id="main" class="flex-1 pb-24 md:pb-12"><router-outlet /></main>
      </div>
    </div>

    <!-- Mobile tab bar -->
    <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-line/[0.08] bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Main">
      <div class="grid" [style.grid-template-columns]="'repeat(' + links().length + ', minmax(0, 1fr))'">
        @for (l of links(); track l.path) {
          <a [routerLink]="l.path" routerLinkActive="!text-accent" [routerLinkActiveOptions]="{ exact: l.path === '/' }" class="relative flex flex-col items-center gap-1 py-2.5 text-2xs text-ink-faint">
            <app-icon [name]="l.icon" [size]="20" />{{ l.label }}
            @if (l.badge && l.badge()) { <span class="absolute left-1/2 top-1.5 ml-2 h-2 w-2 rounded-full bg-accent"></span> }
          </a>
        }
      </div>
    </nav>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  rt = inject(Realtime);
  private api = inject(Api);
  private router = inject(Router);
  q = '';
  panel = signal(false);
  notes = signal<Notification[]>([]);

  links = computed(() => [
    { path: '/', label: 'Home', icon: 'home', badge: null },
    { path: '/discover', label: 'Discover', icon: 'compass', badge: null },
    { path: '/inbox', label: 'Inbox', icon: 'inbox', badge: this.rt.unreadMessages },
    ...(this.auth.isInvestor() ? [{ path: '/pipeline', label: 'Pipeline', icon: 'kanban', badge: null }] : []),
    { path: '/analytics', label: 'Analytics', icon: 'chart', badge: null },
  ]);
  profileName = computed(() => this.auth.user()?.startup?.companyName ?? this.auth.user()?.investor?.companyName ?? (this.auth.isInvestor() ? 'Investor' : 'Startup'));

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.panel.set(false));
    this.rt.notification$.subscribe(n => this.notes.update(l => [n, ...l]));
  }

  search() {
    const q = this.q.trim();
    this.router.navigate(['/discover'], { queryParams: { q: q || null } });
  }

  toggleNotifications() {
    this.panel.set(!this.panel());
    if (this.panel()) this.api.notifications().subscribe(r => { this.notes.set(r.items); this.rt.unreadNotifications.set(r.unread); });
  }
  readAll() {
    this.api.readAll().subscribe(() => { this.notes.update(l => l.map(n => ({ ...n, isRead: true }))); this.rt.unreadNotifications.set(0); });
  }
  open(n: Notification) {
    if (!n.isRead) this.api.readOne(n.id).subscribe(() => this.rt.unreadNotifications.update(x => Math.max(0, x - 1)));
    this.panel.set(false);
    if (n.link) this.router.navigateByUrl(n.link);
  }

  @HostListener('document:click', ['$event'])
  outside(e: MouseEvent) { if (this.panel() && !(e.target as HTMLElement).closest('[data-panel]')) this.panel.set(false); }
}
