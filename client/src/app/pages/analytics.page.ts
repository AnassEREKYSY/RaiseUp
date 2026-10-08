import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { label } from '../core/labels';
import { Analytics } from '../core/models';
import { LabelPipe } from '../core/pipes';

/** Clean axis maximum: 1, 2, 5 x 10^n at or above the data max. */
const niceMax = (v: number) => { if (v <= 4) return 4; const p = 10 ** Math.floor(Math.log10(v)); return [1, 2, 2.5, 5, 10].map(m => m * p).find(x => x >= v)!; };

@Component({
  selector: 'app-analytics',
  imports: [RouterLink, LabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { --chart: #2E7A5B; --chart-hover: #1F5E46; }`],
  template: `
    <div class="page py-8">
      <h1 class="h1">Analytics</h1>
      <p class="mt-1 text-ink-muted">Last 30 days.</p>

      @if (a(); as a) {
        <div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          @for (t of tiles(); track t.label) {
            <div class="card p-4">
              <p class="text-[13px] text-ink-muted">{{ t.label }}</p>
              <p class="mt-1.5 text-2xl font-semibold tabular-nums tracking-[-0.02em]">{{ t.value }}</p>
              <p class="mt-0.5 text-2xs text-ink-faint">{{ t.hint }}</p>
            </div>
          }
        </div>

        <section class="card mt-6 p-5 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div><h2 class="text-sm font-semibold">Profile views per day</h2><p class="mt-0.5 text-[13px] text-ink-faint">{{ a.views.unique }} different people viewed your profile</p></div>
            <button type="button" class="btn-ghost btn-sm" (click)="table.set(!table())" [attr.aria-pressed]="table()">{{ table() ? 'Show chart' : 'Show table' }}</button>
          </div>
          @if (!table()) {
            <div class="relative mt-6 pl-7" role="img" [attr.aria-label]="'Profile views per day, total ' + a.views.total">
              <div class="pointer-events-none absolute inset-y-0 left-0 right-0 h-44">
                @for (t of ticks(); track t) {
                  <div class="absolute left-0 right-0 flex h-0 items-center" [style.bottom.%]="(t / axis()) * 100">
                    <span class="w-6 pr-1.5 text-right text-2xs tabular-nums text-ink-faint">{{ t }}</span><span class="h-px flex-1 bg-line/[0.07]"></span>
                  </div>
                }
              </div>
              <div class="relative flex h-44 items-end gap-[2px]">
                @for (d of a.views.daily; track d.date; let i = $index) {
                  <div class="relative flex h-full flex-1 items-end justify-center outline-none" tabindex="0" (mouseenter)="hover.set(i)" (mouseleave)="hover.set(null)" (focus)="hover.set(i)" (blur)="hover.set(null)">
                    <div class="w-full max-w-[16px] rounded-t-[3px]" [style.height.%]="(d.count / axis()) * 100" [style.min-height.px]="d.count ? 2 : 0"
                         [style.background]="hover() === i ? 'var(--chart-hover)' : 'var(--chart)'"></div>
                    @if (hover() === i) {
                      <div class="absolute z-10 w-max rounded-lg border border-line/[0.1] bg-surface px-2.5 py-1.5 text-[13px] shadow-lg" [style.bottom]="'calc(' + (d.count / axis()) * 100 + '% + 8px)'">
                        <span class="font-medium">{{ d.count }} view{{ d.count === 1 ? '' : 's' }}</span> <span class="text-ink-faint">· {{ short(d.date) }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
              <div class="mt-2 flex justify-between border-t border-line/[0.12] pt-2 text-2xs text-ink-faint">
                <span>{{ short(a.views.daily[0].date) }}</span><span>{{ short(a.views.daily[14].date) }}</span><span>{{ short(a.views.daily[29].date) }}</span>
              </div>
            </div>
          } @else {
            <div class="mt-4 max-h-72 overflow-y-auto">
              <table class="w-full text-sm"><thead><tr class="text-left text-[13px] text-ink-faint"><th class="py-2 font-medium">Day</th><th class="py-2 text-right font-medium">Views</th></tr></thead>
                <tbody class="divide-y divide-line/[0.06]">@for (d of a.views.daily; track d.date) { <tr><td class="py-1.5">{{ short(d.date) }}</td><td class="py-1.5 text-right tabular-nums">{{ d.count }}</td></tr> }</tbody></table>
            </div>
          }
        </section>

        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          @if (a.investor; as inv) {
            <section class="card p-5 sm:p-6">
              <h2 class="text-sm font-semibold">Pipeline by stage</h2>
              <p class="mt-0.5 text-[13px] text-ink-faint">Startups on your board</p>
              <ul class="mt-5 space-y-3">
                @for (p of inv.pipeline; track p.stage) {
                  <li class="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
                    <span class="text-ink-muted">{{ p.stage | label }}</span>
                    <span class="flex items-center gap-2"><span class="h-3 rounded-r" [style.width.%]="bar(p.count, maxPipeline())" [style.min-width.px]="p.count ? 3 : 0" style="background: var(--chart)"></span><span class="text-[13px] tabular-nums text-ink-muted">{{ p.count }}</span></span>
                  </li>
                }
              </ul>
              <a routerLink="/pipeline" class="link mt-5 inline-block text-sm">Open pipeline</a>
            </section>
            <section class="card p-5 sm:p-6">
              <h2 class="text-sm font-semibold">Deal flow by industry</h2>
              <p class="mt-0.5 text-[13px] text-ink-faint">Startups in your pipeline or connected with you</p>
              @if (inv.byIndustry.length) {
                <ul class="mt-5 space-y-3">
                  @for (g of inv.byIndustry.slice(0, 6); track g.name) {
                    <li class="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
                      <span class="truncate text-ink-muted">{{ g.name | label }}</span>
                      <span class="flex items-center gap-2"><span class="h-3 rounded-r" [style.width.%]="bar(g.count, inv.byIndustry[0].count)" style="background: var(--chart)"></span><span class="text-[13px] tabular-nums text-ink-muted">{{ g.count }}</span></span>
                    </li>
                  }
                </ul>
              } @else { <p class="mt-5 text-sm text-ink-muted">No deal flow yet.</p> }
            </section>
          }
          @if (a.startup; as st) {
            <section class="card p-5 sm:p-6">
              <h2 class="text-sm font-semibold">Who looks at you</h2>
              <p class="mt-0.5 text-[13px] text-ink-faint">Investor types among your viewers</p>
              @if (st.viewerTypes.length) {
                <ul class="mt-5 space-y-3">
                  @for (g of st.viewerTypes; track g.name) {
                    <li class="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
                      <span class="truncate text-ink-muted">{{ g.name | label }}</span>
                      <span class="flex items-center gap-2"><span class="h-3 rounded-r" [style.width.%]="bar(g.count, st.viewerTypes[0].count)" style="background: var(--chart)"></span><span class="text-[13px] tabular-nums text-ink-muted">{{ g.count }}</span></span>
                    </li>
                  }
                </ul>
              } @else { <p class="mt-5 text-sm text-ink-muted">No investor views in this period yet.</p> }
            </section>
          }
          <section class="card p-5 sm:p-6">
            <h2 class="text-sm font-semibold">Requests</h2>
            <dl class="mt-4 divide-y divide-line/[0.06] text-sm">
              @for (r of requestRows(); track r.k) {
                <div class="flex justify-between py-2.5"><dt class="text-ink-muted">{{ r.k }}</dt><dd class="font-medium tabular-nums">{{ r.v }}</dd></div>
              }
            </dl>
          </section>
        </div>
      } @else {
        <div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">@for (i of [1,2,3,4]; track i) { <div class="skeleton h-24"></div> }</div>
        <div class="skeleton mt-6 h-64"></div>
      }
    </div>
  `,
})
export class AnalyticsPage {
  private api = inject(Api);
  private auth = inject(AuthService);
  a = signal<Analytics | null>(null);
  table = signal(false);
  hover = signal<number | null>(null);

  axis = computed(() => niceMax(Math.max(0, ...(this.a()?.views.daily ?? []).map(d => d.count))));
  ticks = computed(() => (Number.isInteger(this.axis() / 2) ? [0, this.axis() / 2, this.axis()] : [0, this.axis()]));
  maxPipeline = computed(() => Math.max(1, ...(this.a()?.investor?.pipeline ?? []).map(p => p.count)));
  tiles = computed(() => {
    const a = this.a(); if (!a) return [];
    const delta = a.views.total - a.views.previous;
    const pct = a.views.previous ? Math.round((delta / a.views.previous) * 100) : null;
    const t = [
      { label: 'Profile views', value: a.views.total, hint: pct === null ? 'No data for the previous period' : `${pct >= 0 ? '+' : ''}${pct}% vs previous 30 days` },
      { label: 'Requests received', value: a.requests.received, hint: `${a.requests.pendingReceived} waiting for you` },
      { label: 'Connections', value: a.requests.acceptedConnections, hint: 'Accepted on both sides' },
    ];
    if (a.investor) t.push({ label: 'Startups viewed', value: a.investor.startupsViewed, hint: 'Profiles you opened' });
    if (a.startup) t.push({ label: 'In investor pipelines', value: a.startup.inPipelines, hint: 'Investors tracking you now' });
    return t;
  });
  requestRows = computed(() => {
    const r = this.a()?.requests; if (!r) return [];
    return [
      { k: 'Sent', v: String(r.sent) },
      { k: 'Accepted (of answered)', v: r.acceptanceRateSent === null ? '–' : `${r.acceptanceRateSent}%` },
      { k: 'Received', v: String(r.received) },
      { k: 'Your median reply time', v: r.medianResponseHours === null ? '–' : r.medianResponseHours < 1 ? 'Under 1 hour' : `${r.medianResponseHours} h` },
    ];
  });

  constructor() { this.api.analytics().subscribe(a => this.a.set(a)); }
  bar(v: number, max: number) { return max ? (v / max) * 85 : 0; }
  short(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  readonly label = label;
}
