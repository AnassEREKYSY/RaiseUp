import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { INDUSTRIES, INVESTOR_TYPES, STAGES } from '../core/labels';
import { InvestorCard, StartupCard } from '../core/models';
import { LabelPipe } from '../core/pipes';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { IconComponent } from '../shared/icon.component';
import { InvestorCardComponent } from '../shared/investor-card.component';
import { StartupCardComponent } from '../shared/startup-card.component';

type Tab = 'startups' | 'investors';

@Component({
  selector: 'app-discover',
  imports: [FormsModule, LabelPipe, EmptyStateComponent, IconComponent, InvestorCardComponent, StartupCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page py-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="h1">Discover</h1>
          <p class="mt-1 text-ink-muted">{{ total() }} {{ tab() === 'startups' ? 'startups' : 'investors' }}@if (q()) { for “{{ q() }}”}</p>
        </div>
        <div class="inline-flex rounded-lg border border-line/[0.12] bg-surface p-1" role="tablist">
          @for (t of tabs; track t.v) {
            <button type="button" role="tab" class="h-8 rounded-md px-4 text-[13px] font-medium transition-colors" [attr.aria-selected]="tab() === t.v"
                    [class]="tab() === t.v ? 'bg-subtle text-ink' : 'text-ink-muted hover:text-ink'" (click)="set({ tab: t.v, industry: null, stage: null, type: null, sort: null })">{{ t.label }}</button>
          }
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-2 border-b border-line/[0.07] pb-5">
        <div class="relative w-full sm:w-64">
          <app-icon name="search" [size]="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input class="input h-9 pl-9 text-sm" type="search" placeholder="Name or keyword" aria-label="Search" [ngModel]="q() ?? ''" (keyup.enter)="set({ q: $any($event.target).value || null })" (search)="set({ q: $any($event.target).value || null })" />
        </div>
        <label class="sr-only" for="f-ind">Industry</label>
        <select id="f-ind" class="select h-9 w-auto text-sm" [ngModel]="industry() ?? ''" (ngModelChange)="set({ industry: $event || null })">
          <option value="">All industries</option>@for (i of industries; track i) { <option [value]="i">{{ i | label }}</option> }
        </select>
        <label class="sr-only" for="f-stage">Stage</label>
        <select id="f-stage" class="select h-9 w-auto text-sm" [ngModel]="stage() ?? ''" (ngModelChange)="set({ stage: $event || null })">
          <option value="">All stages</option>@for (s of stages; track s) { <option [value]="s">{{ s | label }}</option> }
        </select>
        @if (tab() === 'investors') {
          <label class="sr-only" for="f-type">Investor type</label>
          <select id="f-type" class="select h-9 w-auto text-sm" [ngModel]="type() ?? ''" (ngModelChange)="set({ type: $event || null })">
            <option value="">All types</option>@for (t of investorTypes; track t) { <option [value]="t">{{ t | label }}</option> }
          </select>
        } @else {
          <label class="sr-only" for="f-max">Raising up to</label>
          <select id="f-max" class="select h-9 w-auto text-sm" [ngModel]="maxFunding() ?? ''" (ngModelChange)="set({ maxFunding: $event || null })">
            <option value="">Any amount</option><option value="250000">Up to €250k</option><option value="1000000">Up to €1M</option><option value="5000000">Up to €5M</option>
          </select>
        }
        <div class="ml-auto flex items-center gap-2">
          <label class="text-[13px] text-ink-faint" for="f-sort">Sort</label>
          <select id="f-sort" class="select h-9 w-auto text-sm" [ngModel]="sortValue()" (ngModelChange)="set({ sort: $event })">
            @if (canScore()) { <option value="match">Best match</option> }
            <option value="recent">Newest</option>
            @if (tab() === 'startups') { <option value="funding">Largest raise</option> }
          </select>
        </div>
        @if (hasFilters()) { <button type="button" class="btn-ghost btn-sm" (click)="clear()">Clear filters</button> }
      </div>

      <div class="mt-6">
        @if (!loading() && !startups().length && !investors().length) {
          <app-empty icon="search" title="No profiles match" text="Try fewer filters or another keyword."><button type="button" class="btn-secondary btn-sm" (click)="clear()">Clear filters</button></app-empty>
        } @else {
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @for (s of startups(); track s.id) { <app-startup-card [startup]="s" /> }
            @for (i of investors(); track i.id) { <app-investor-card [investor]="i" /> }
            @if (loading()) { @for (i of [1,2,3,4,5,6]; track i) { <div class="skeleton h-52"></div> } }
          </div>
          @if (page() < totalPages() && !loading()) {
            <div class="mt-8 flex justify-center"><button type="button" class="btn-secondary" (click)="more()">Load more</button></div>
          }
        }
      </div>
    </div>
  `,
})
export class DiscoverPage {
  tabParam = input<string | undefined>(undefined, { alias: 'tab' });
  q = input<string | undefined>();
  industry = input<string | undefined>();
  stage = input<string | undefined>();
  type = input<string | undefined>();
  maxFunding = input<string | undefined>();
  sort = input<string | undefined>();

  private api = inject(Api);
  private auth = inject(AuthService);
  private router = inject(Router);
  industries = INDUSTRIES; stages = STAGES; investorTypes = INVESTOR_TYPES;
  tabs: { v: Tab; label: string }[] = [{ v: 'startups', label: 'Startups' }, { v: 'investors', label: 'Investors' }];

  tab = computed<Tab>(() => (this.tabParam() === 'startups' || this.tabParam() === 'investors' ? this.tabParam() as Tab : this.auth.isInvestor() ? 'startups' : 'investors'));
  // Scores exist when browsing the other side.
  canScore = computed(() => (this.tab() === 'startups') === this.auth.isInvestor());
  sortValue = computed(() => this.sort() ?? (this.canScore() ? 'match' : 'recent'));
  hasFilters = computed(() => !!(this.q() || this.industry() || this.stage() || this.type() || this.maxFunding()));

  startups = signal<StartupCard[]>([]);
  investors = signal<InvestorCard[]>([]);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  loading = signal(true);

  private filters = computed(() => ({
    tab: this.tab(), q: this.q(), industry: this.industry(), stage: this.stage(),
    type: this.tab() === 'investors' ? this.type() : undefined,
    maxFunding: this.tab() === 'startups' ? this.maxFunding() : undefined,
    sort: this.sortValue() === 'match' && !this.canScore() ? 'recent' : this.sortValue(),
  }));

  constructor() {
    effect(() => { const f = this.filters(); untracked(() => this.fetch(f, 1)); });
  }

  private fetch(f: ReturnType<DiscoverPage['filters']>, page: number) {
    this.loading.set(true);
    if (page === 1) { this.startups.set([]); this.investors.set([]); }
    const { tab, ...rest } = f;
    const done = (r: { total: number; page: number; totalPages: number }) => { this.total.set(r.total); this.page.set(r.page); this.totalPages.set(r.totalPages); this.loading.set(false); };
    if (tab === 'startups') this.api.startups({ ...rest, page }).subscribe({ next: r => { this.startups.update(l => [...l, ...r.items]); done(r); }, error: () => this.loading.set(false) });
    else this.api.investors({ ...rest, page }).subscribe({ next: r => { this.investors.update(l => [...l, ...r.items]); done(r); }, error: () => this.loading.set(false) });
  }
  more() { this.fetch(this.filters(), this.page() + 1); }

  set(change: Record<string, string | null>) {
    this.router.navigate([], { queryParams: change, queryParamsHandling: 'merge', replaceUrl: true });
  }
  clear() { this.router.navigate([], { queryParams: { tab: this.tabParam() ?? null }, replaceUrl: true }); }
}
