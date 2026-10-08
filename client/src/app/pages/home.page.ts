import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/http';
import { Analytics, Conversation, InvestorCard, StartupCard } from '../core/models';
import { AgoPipe } from '../core/pipes';
import { Realtime } from '../core/realtime.service';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from '../shared/avatar.component';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { InvestorCardComponent } from '../shared/investor-card.component';
import { StartupCardComponent } from '../shared/startup-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, AgoPipe, AvatarComponent, EmptyStateComponent, InvestorCardComponent, StartupCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page py-8">
      <h1 class="h1">Hello, {{ firstName() }}</h1>
      <p class="mt-1 text-ink-muted">{{ subtitle() }}</p>

      <!-- Key numbers -->
      <div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        @for (t of tiles(); track t.label) {
          <a [routerLink]="t.link" class="card p-4 transition hover:border-line/20">
            <p class="text-[13px] text-ink-muted">{{ t.label }}</p>
            <p class="mt-1.5 text-2xl font-semibold tabular-nums tracking-[-0.02em]">{{ t.value }}</p>
            <p class="mt-0.5 text-2xs text-ink-faint">{{ t.hint }}</p>
          </a>
        }
      </div>

      @if (completeness(); as c) {
        @if (c.missing.length) {
          <div class="card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div class="flex-1">
              <p class="font-medium">Your profile is {{ c.percent }}% complete</p>
              <p class="mt-0.5 text-sm text-ink-muted">Add {{ c.missing.slice(0, 3).join(', ') }} to get better matches.</p>
              <div class="mt-3 h-1.5 max-w-sm overflow-hidden rounded-full bg-subtle"><div class="h-full rounded-full bg-accent" [style.width.%]="c.percent"></div></div>
            </div>
            <a routerLink="/profile" class="btn-secondary shrink-0">Complete profile</a>
          </div>
        }
      }

      <div class="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section class="min-w-0">
          <div class="mb-3 flex items-end justify-between">
            <div>
              <h2 class="h2">Recommended for you</h2>
              <p class="mt-0.5 text-[13px] text-ink-faint">{{ auth.isInvestor() ? 'Startups that fit your criteria best' : 'Investors whose criteria fit your raise' }}</p>
            </div>
            <a routerLink="/discover" [queryParams]="{ sort: 'match' }" class="btn-ghost btn-sm">See all</a>
          </div>
          @if (recsLoading()) {
            <div class="grid gap-4 sm:grid-cols-2">@for (i of [1,2,3,4]; track i) { <div class="skeleton h-48"></div> }</div>
          } @else if (!startups().length && !investors().length) {
            <app-empty icon="sparkle" title="No recommendations yet" [text]="auth.isInvestor() ? 'Every startup that fits your criteria is already in your pipeline or inbox.' : 'Every investor that fits your raise is already in your inbox.'" />
          } @else {
            <div class="grid gap-4 sm:grid-cols-2">
              @for (s of startups(); track s.id) { <app-startup-card [startup]="s" /> }
              @for (i of investors(); track i.id) { <app-investor-card [investor]="i" /> }
            </div>
          }
        </section>

        <aside class="space-y-6">
          <section class="card">
            <div class="flex items-center justify-between border-b border-line/[0.07] px-4 py-3">
              <h2 class="text-sm font-semibold">Requests for you</h2>
              <span class="text-[13px] text-ink-faint">{{ incoming().length }}</span>
            </div>
            <ul class="divide-y divide-line/[0.06]">
              @for (c of incoming(); track c.id) {
                <li class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <app-avatar [name]="c.counterpart.fullName" [size]="34" />
                    <div class="min-w-0 flex-1">
                      <a [routerLink]="profileLink(c)" class="block truncate text-sm font-medium hover:text-accent">{{ c.counterpart.fullName }}</a>
                      <p class="truncate text-2xs text-ink-faint">{{ c.counterpart.profile?.title || (c.counterpart.role === 'INVESTOR' ? 'Investor' : 'Startup') }} · {{ c.createdAt | ago }}</p>
                    </div>
                  </div>
                  @if (c.lastMessage) { <p class="mt-2 line-clamp-2 text-[13px] text-ink-muted">“{{ c.lastMessage.content }}”</p> }
                  <div class="mt-2.5 flex gap-2">
                    <button type="button" class="btn-primary btn-sm flex-1" (click)="answer(c, true)" [disabled]="busy().has(c.id)">Accept</button>
                    <button type="button" class="btn-secondary btn-sm flex-1" (click)="answer(c, false)" [disabled]="busy().has(c.id)">Decline</button>
                  </div>
                </li>
              } @empty {
                <li class="px-4 py-6 text-center text-sm text-ink-muted">No requests waiting.</li>
              }
            </ul>
          </section>

          <section class="card">
            <div class="flex items-center justify-between border-b border-line/[0.07] px-4 py-3">
              <h2 class="text-sm font-semibold">Recent conversations</h2>
              <a routerLink="/inbox" class="text-[13px] text-accent hover:underline">Inbox</a>
            </div>
            <ul class="divide-y divide-line/[0.06]">
              @for (c of recent(); track c.id) {
                <li>
                  <a [routerLink]="['/inbox', c.id]" class="flex items-center gap-3 px-4 py-3 hover:bg-subtle">
                    <app-avatar [name]="c.counterpart.fullName" [size]="34" />
                    <div class="min-w-0 flex-1">
                      <p class="flex items-center gap-2 text-sm"><span class="truncate font-medium">{{ c.counterpart.fullName }}</span><span class="ml-auto shrink-0 text-2xs text-ink-faint">{{ c.lastMessageAt | ago }}</span></p>
                      <p class="truncate text-[13px]" [class]="c.unread ? 'font-medium text-ink' : 'text-ink-muted'">{{ c.lastMessage?.content || (c.status === 'PENDING' ? 'Request sent' : 'Say hello') }}</p>
                    </div>
                    @if (c.unread) { <span class="h-2 w-2 rounded-full bg-accent"></span> }
                  </a>
                </li>
              } @empty {
                <li class="px-4 py-6 text-center text-sm text-ink-muted">No conversations yet.</li>
              }
            </ul>
          </section>
        </aside>
      </div>
    </div>
  `,
})
export class HomePage {
  auth = inject(AuthService);
  private api = inject(Api);
  private toast = inject(ToastService);
  private rt = inject(Realtime);

  startups = signal<StartupCard[]>([]);
  investors = signal<InvestorCard[]>([]);
  recsLoading = signal(true);
  conversations = signal<Conversation[]>([]);
  stats = signal<Analytics | null>(null);
  busy = signal(new Set<string>());

  firstName = computed(() => this.auth.user()?.fullName.split(' ')[0] ?? '');
  incoming = computed(() => this.conversations().filter(c => c.status === 'PENDING' && c.direction === 'incoming'));
  recent = computed(() => this.conversations().filter(c => c.status === 'ACCEPTED' || c.direction === 'outgoing').slice(0, 5));
  subtitle = computed(() => {
    const n = this.incoming().length, u = this.conversations().reduce((x, c) => x + c.unread, 0);
    const parts = [n ? `${n} request${n > 1 ? 's' : ''} waiting` : '', u ? `${u} unread message${u > 1 ? 's' : ''}` : ''].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Here is what is happening with your raise.'.replace('your raise', this.auth.isInvestor() ? 'your deal flow' : 'your raise');
  });
  tiles = computed(() => {
    const s = this.stats();
    const delta = s ? s.views.total - s.views.previous : 0;
    return [
      { label: 'Profile views', value: s?.views.total ?? '–', hint: s ? `${delta >= 0 ? '+' : ''}${delta} vs previous 30 days` : 'Last 30 days', link: '/analytics' },
      { label: 'Requests waiting', value: s?.requests.pendingReceived ?? '–', hint: 'Answer them from here', link: '/inbox' },
      { label: 'Connections', value: s?.requests.acceptedConnections ?? '–', hint: 'Accepted on both sides', link: '/inbox' },
      this.auth.isInvestor()
        ? { label: 'In your pipeline', value: s?.investor ? s.investor.pipeline.filter(p => p.stage !== 'PASSED').reduce((n, p) => n + p.count, 0) : '–', hint: 'Excluding passed', link: '/pipeline' }
        : { label: 'In investor pipelines', value: s?.startup?.inPipelines ?? '–', hint: 'Investors tracking you', link: '/analytics' },
    ];
  });
  completeness = computed(() => {
    const u = this.auth.user();
    const p: Record<string, unknown> | null = (u?.startup ?? u?.investor) as any;
    if (!p) return null;
    const fields: [string, string][] = u!.role === 'STARTUP'
      ? [['tagline', 'a one-line pitch'], ['description', 'a description'], ['fundingNeeded', 'the amount you raise'], ['country', 'your country'], ['traction', 'traction'], ['monthlyRevenue', 'revenue'], ['pitchDeckUrl', 'a pitch deck'], ['website', 'a website']]
      : [['bio', 'your thesis'], ['investorType', 'your investor type'], ['location', 'where you invest'], ['minTicket', 'a ticket size'], ['website', 'a website']];
    const missing = fields.filter(([k]) => p[k] === null || p[k] === undefined || p[k] === '').map(([, l]) => l);
    if (u!.role === 'INVESTOR' && !(p['industries'] as string[])?.length) missing.push('industries');
    const total = fields.length + (u!.role === 'INVESTOR' ? 1 : 0);
    return { missing, percent: Math.round(((total - missing.length) / total) * 100) };
  });

  constructor() {
    this.api.recommendations(6).pipe(catchError(() => of({ kind: 'none' as const, items: [] }))).subscribe(r => {
      if (r.kind === 'startups') this.startups.set(r.items as StartupCard[]);
      if (r.kind === 'investors') this.investors.set(r.items as InvestorCard[]);
      this.recsLoading.set(false);
    });
    this.load();
    this.rt.connection$.subscribe(() => this.load());
    this.rt.message$.subscribe(() => this.load());
  }

  private load() {
    this.api.connections().pipe(catchError(() => of({ items: [] }))).subscribe(r => this.conversations.set(r.items));
    this.api.analytics().pipe(catchError(() => of(null))).subscribe(s => this.stats.set(s));
  }

  profileLink(c: Conversation) {
    const p = c.counterpart.profile;
    return p ? [p.type === 'STARTUP' ? '/startups' : '/investors', p.profileId] : ['/inbox', c.id];
  }

  answer(c: Conversation, accept: boolean) {
    this.busy.update(s => new Set(s).add(c.id));
    (accept ? this.api.accept(c.id) : this.api.decline(c.id)).subscribe({
      next: () => { this.toast.show(accept ? `You are now connected with ${c.counterpart.fullName}` : 'Request declined'); this.load(); this.rt.refreshCounts(); },
      error: e => { this.toast.error(errorText(e)); this.busy.update(s => { const n = new Set(s); n.delete(c.id); return n; }); },
    });
  }
}
