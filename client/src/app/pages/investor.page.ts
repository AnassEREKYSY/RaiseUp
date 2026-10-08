import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ticket } from '../core/labels';
import { InvestorDetail } from '../core/models';
import { LabelPipe } from '../core/pipes';
import { AvatarComponent } from '../shared/avatar.component';
import { ConnectionActionsComponent } from '../shared/connection-actions.component';
import { IconComponent } from '../shared/icon.component';
import { ScoreBreakdownComponent } from '../shared/score-breakdown.component';

@Component({
  selector: 'app-investor',
  imports: [RouterLink, LabelPipe, AvatarComponent, ConnectionActionsComponent, IconComponent, ScoreBreakdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (i(); as i) {
      <div class="page py-8">
        <a routerLink="/discover" [queryParams]="{ tab: 'investors' }" class="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"><app-icon name="arrow-left" [size]="14" /> Investors</a>
        <div class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
          <app-avatar [name]="i.name" [size]="72" />
          <div class="min-w-0 flex-1">
            <h1 class="h1">{{ i.name }}</h1>
            <p class="mt-1 text-[17px] text-ink-muted">{{ i.companyName || 'Independent' }}@if (i.investorType) { · {{ i.investorType | label }}}</p>
          </div>
          @if (canConnect()) {
            <app-connection-actions [connection]="i.connection" [userId]="i.userId" [name]="i.name ?? 'this investor'" (changed)="reload()" />
          } @else if (isMine()) {
            <a routerLink="/profile" class="btn-secondary"><app-icon name="pencil" [size]="15" /> Edit profile</a>
          }
        </div>

        <div class="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div class="min-w-0 space-y-6">
            <section class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div class="card p-4"><p class="text-[13px] text-ink-muted">Ticket</p><p class="mt-1 font-semibold tabular-nums">{{ ticketText() }}</p></div>
              <div class="card p-4"><p class="text-[13px] text-ink-muted">Invests in</p><p class="mt-1 font-semibold">{{ i.location || 'Any country' }}</p></div>
              <div class="card p-4"><p class="text-[13px] text-ink-muted">Companies backed</p><p class="mt-1 font-semibold tabular-nums">{{ i.portfolioCount ?? '–' }}</p></div>
            </section>
            <section class="card p-5 sm:p-6">
              <h2 class="h2">Thesis</h2>
              <p class="mt-3 whitespace-pre-line text-[15px] leading-7 text-ink/85">{{ i.bio || 'No thesis written yet.' }}</p>
            </section>
            <section class="card p-5 sm:p-6">
              <h2 class="h2">Focus</h2>
              <p class="mt-4 text-[13px] text-ink-muted">Industries</p>
              <div class="mt-2 flex flex-wrap gap-1.5">@for (x of i.industries; track x) { <span class="tag">{{ x | label }}</span> } @empty { <span class="text-sm text-ink-muted">Open to all</span> }</div>
              <p class="mt-4 text-[13px] text-ink-muted">Stages</p>
              <div class="mt-2 flex flex-wrap gap-1.5">@for (x of i.stagePreference; track x) { <span class="tag">{{ x | label }}</span> } @empty { <span class="text-sm text-ink-muted">Open to all</span> }</div>
            </section>
          </div>
          <aside class="space-y-6">
            @if (i.match) { <section class="card p-5"><app-score-breakdown [match]="i.match" subtitle="How your raise fits their criteria" /></section> }
            @if (i.website) {
              <section class="card text-sm"><a [href]="i.website" target="_blank" rel="noopener" class="flex items-center gap-2 p-4 text-ink-muted hover:text-ink"><app-icon name="globe" [size]="16" /> <span class="truncate">{{ host(i.website) }}</span> <app-icon name="external" [size]="13" class="ml-auto" /></a></section>
            }
          </aside>
        </div>
      </div>
    } @else if (error()) {
      <div class="page py-24 text-center"><p class="h2">This investor could not be found</p><a routerLink="/discover" class="btn-secondary mt-6">Back to Discover</a></div>
    } @else {
      <div class="page py-8"><div class="skeleton h-20 w-2/3"></div><div class="skeleton mt-8 h-72"></div></div>
    }
  `,
})
export class InvestorPage {
  id = input.required<string>();
  private api = inject(Api);
  private auth = inject(AuthService);
  private title = inject(Title);
  i = signal<InvestorDetail | null>(null);
  error = signal(false);
  isMine = computed(() => this.i()?.userId === this.auth.user()?.id);
  canConnect = computed(() => this.auth.user()?.role === 'STARTUP' && !this.isMine());
  ticketText = computed(() => { const i = this.i(); return i ? ticket(i.minTicket, i.maxTicket) : ''; });

  constructor() { effect(() => { const id = this.id(); untracked(() => this.load(id)); }); }
  private load(id: string) {
    this.api.investor(id).subscribe({ next: i => { this.i.set(i); this.title.setTitle(`${i.name} · RaiseUp`); }, error: () => this.error.set(true) });
  }
  reload() { this.load(this.id()); }
  host(url: string) { try { return new URL(url).host; } catch { return url; } }
}
