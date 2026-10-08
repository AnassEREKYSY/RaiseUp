import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/http';
import { PIPELINE_STAGES, money } from '../core/labels';
import { PipelineStage, StartupDetail } from '../core/models';
import { LabelPipe, MoneyPipe } from '../core/pipes';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from '../shared/avatar.component';
import { ConnectionActionsComponent } from '../shared/connection-actions.component';
import { IconComponent } from '../shared/icon.component';
import { ScoreBreakdownComponent } from '../shared/score-breakdown.component';

@Component({
  selector: 'app-startup',
  imports: [RouterLink, FormsModule, LabelPipe, MoneyPipe, AvatarComponent, ConnectionActionsComponent, IconComponent, ScoreBreakdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (s(); as s) {
      <div class="page py-8">
        <a routerLink="/discover" [queryParams]="{ tab: 'startups' }" class="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"><app-icon name="arrow-left" [size]="14" /> Startups</a>

        <div class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
          <app-avatar [name]="s.companyName" [size]="72" [square]="true" />
          <div class="min-w-0 flex-1">
            <h1 class="h1">{{ s.companyName }}</h1>
            @if (s.tagline) { <p class="mt-1 text-[17px] text-ink-muted">{{ s.tagline }}</p> }
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <span class="tag">{{ s.industry | label }}</span><span class="tag">{{ s.stage | label }}</span>
              @if (s.country) { <span class="tag">{{ s.country }}</span> }
              @if (s.foundedYear) { <span class="tag">Since {{ s.foundedYear }}</span> }
            </div>
          </div>
          @if (canConnect()) {
            <app-connection-actions [connection]="s.connection" [userId]="s.userId" [name]="s.founder.fullName" (changed)="reload()" />
          } @else if (isMine()) {
            <a routerLink="/profile" class="btn-secondary"><app-icon name="pencil" [size]="15" /> Edit profile</a>
          }
        </div>

        <div class="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div class="min-w-0 space-y-6">
            <!-- Raise -->
            <section class="card p-5 sm:p-6">
              <div class="grid gap-5 sm:grid-cols-3">
                <div><p class="text-[13px] text-ink-muted">Raising</p><p class="mt-1 text-2xl font-semibold tabular-nums">{{ s.fundingNeeded | money }}</p></div>
                <div><p class="text-[13px] text-ink-muted">Committed</p><p class="mt-1 text-2xl font-semibold tabular-nums">{{ s.amountRaised | money }}</p></div>
                <div><p class="text-[13px] text-ink-muted">Progress</p><p class="mt-1 text-2xl font-semibold tabular-nums">{{ progress() }}%</p></div>
              </div>
              <div class="mt-4 h-2 overflow-hidden rounded-full bg-subtle" role="progressbar" [attr.aria-valuenow]="progress()" aria-valuemin="0" aria-valuemax="100">
                <div class="h-full rounded-full bg-accent" [style.width.%]="progress()"></div>
              </div>
            </section>

            <section class="card p-5 sm:p-6">
              <h2 class="h2">About</h2>
              <p class="mt-3 whitespace-pre-line text-[15px] leading-7 text-ink/85">{{ s.description || 'No description yet.' }}</p>
              @if (s.traction) {
                <h3 class="mt-6 text-sm font-semibold">Traction</h3>
                <p class="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink/85">{{ s.traction }}</p>
              }
            </section>

            @if (metrics().length) {
              <section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                @for (m of metrics(); track m.k) {
                  <div class="card p-4"><p class="text-[13px] text-ink-muted">{{ m.k }}</p><p class="mt-1 text-lg font-semibold tabular-nums">{{ m.v }}</p></div>
                }
              </section>
            }

            @if (s.projects.length) {
              <section class="card p-5 sm:p-6">
                <h2 class="h2">Projects</h2>
                <ul class="mt-3 divide-y divide-line/[0.06]">
                  @for (p of s.projects; track p.id) {
                    <li class="py-3">
                      <div class="flex items-baseline justify-between gap-3"><p class="font-medium">{{ p.title }}</p>@if (p.fundingGoal) { <span class="text-sm tabular-nums text-ink-muted">{{ p.fundingGoal | money }}</span> }</div>
                      <p class="mt-1 text-sm text-ink-muted">{{ p.description }}</p>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>

          <aside class="space-y-6">
            @if (s.match) { <section class="card p-5"><app-score-breakdown [match]="s.match" subtitle="How this startup fits your criteria" /></section> }

            @if (auth.isInvestor()) {
              <section class="card p-5">
                <h2 class="text-sm font-semibold">Your pipeline</h2>
                <p class="mt-0.5 text-[13px] text-ink-faint">Private, only you see this.</p>
                <label class="label mt-4" for="stage">Stage</label>
                <select id="stage" class="select" [ngModel]="s.pipeline?.stage ?? ''" (ngModelChange)="setStage($event)">
                  <option value="">Not in pipeline</option>
                  @for (p of stages; track p) { <option [value]="p">{{ p | label }}</option> }
                </select>
                @if (s.pipeline) {
                  <label class="label mt-4" for="notes">Notes</label>
                  <textarea id="notes" class="input" rows="4" maxlength="4000" [(ngModel)]="notes" placeholder="Team, market, questions to ask…"></textarea>
                  <button type="button" class="btn-secondary btn-sm mt-2" (click)="saveNotes()" [disabled]="saving()">Save notes</button>
                }
              </section>
            }

            <section class="card divide-y divide-line/[0.06] text-sm">
              <div class="flex items-center gap-3 p-4"><app-avatar [name]="s.founder.fullName" [size]="34" /><div><p class="font-medium">{{ s.founder.fullName }}</p><p class="text-2xs text-ink-faint">Founder</p></div></div>
              @if (s.website) { <a [href]="s.website" target="_blank" rel="noopener" class="flex items-center gap-2 p-4 text-ink-muted hover:text-ink"><app-icon name="globe" [size]="16" /> <span class="truncate">{{ host(s.website) }}</span> <app-icon name="external" [size]="13" class="ml-auto" /></a> }
              @if (s.pitchDeckUrl) { <a [href]="s.pitchDeckUrl" target="_blank" rel="noopener" class="flex items-center gap-2 p-4 text-ink-muted hover:text-ink"><app-icon name="file" [size]="16" /> Pitch deck <app-icon name="external" [size]="13" class="ml-auto" /></a> }
              @if (s.teamSize) { <div class="flex items-center gap-2 p-4 text-ink-muted"><app-icon name="users" [size]="16" /> {{ s.teamSize }} people</div> }
            </section>
          </aside>
        </div>
      </div>
    } @else if (error()) {
      <div class="page py-24 text-center"><p class="h2">This startup could not be found</p><a routerLink="/discover" class="btn-secondary mt-6">Back to Discover</a></div>
    } @else {
      <div class="page py-8"><div class="skeleton h-20 w-2/3"></div><div class="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><div class="skeleton h-80"></div><div class="skeleton h-64"></div></div></div>
    }
  `,
})
export class StartupPage {
  id = input.required<string>();
  auth = inject(AuthService);
  private api = inject(Api);
  private toast = inject(ToastService);
  private title = inject(Title);
  s = signal<StartupDetail | null>(null);
  error = signal(false);
  saving = signal(false);
  notes = '';
  stages = PIPELINE_STAGES;

  isMine = computed(() => this.s()?.userId === this.auth.user()?.id);
  canConnect = computed(() => this.auth.isInvestor() && !this.isMine());
  progress = computed(() => { const s = this.s(); return s?.fundingNeeded ? Math.min(100, Math.round(((s.amountRaised ?? 0) / s.fundingNeeded) * 100)) : 0; });
  metrics = computed(() => {
    const s = this.s(); if (!s) return [];
    const m: { k: string; v: string }[] = [];
    if (s.monthlyRevenue != null) m.push({ k: 'Monthly revenue', v: money(s.monthlyRevenue) });
    if (s.monthlyGrowth != null) m.push({ k: 'Monthly growth', v: `${s.monthlyGrowth}%` });
    if (s.customers != null) m.push({ k: 'Customers', v: String(s.customers) });
    if (s.teamSize != null) m.push({ k: 'Team', v: String(s.teamSize) });
    return m;
  });

  constructor() { effect(() => { const id = this.id(); untracked(() => this.load(id)); }); }

  private load(id: string) {
    this.api.startup(id).subscribe({
      next: s => { this.s.set(s); this.notes = s.pipeline?.notes ?? ''; this.title.setTitle(`${s.companyName} · RaiseUp`); },
      error: () => this.error.set(true),
    });
  }
  reload() { this.load(this.id()); }

  setStage(stage: PipelineStage | '') {
    const s = this.s(); if (!s) return;
    const call = stage ? this.api.savePipeline(s.id, { stage }) : this.api.removePipeline(s.id);
    call.subscribe({
      next: () => { this.toast.show(stage ? `Pipeline: ${stage === 'DUE_DILIGENCE' ? 'due diligence' : stage.toLowerCase()}` : 'Removed from pipeline'); this.reload(); },
      error: e => this.toast.error(errorText(e)),
    });
  }
  saveNotes() {
    const s = this.s(); if (!s) return;
    this.saving.set(true);
    this.api.savePipeline(s.id, { notes: this.notes }).subscribe({
      next: () => { this.saving.set(false); this.toast.show('Notes saved'); },
      error: e => { this.saving.set(false); this.toast.error(errorText(e)); },
    });
  }
  host(url: string) { try { return new URL(url).host; } catch { return url; } }
}
