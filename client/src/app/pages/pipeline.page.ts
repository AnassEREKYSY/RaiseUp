import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { errorText } from '../core/http';
import { PIPELINE_STAGES } from '../core/labels';
import { PipelineItem, PipelineStage } from '../core/models';
import { LabelPipe, MoneyPipe } from '../core/pipes';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from '../shared/avatar.component';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { IconComponent } from '../shared/icon.component';
import { MatchBadgeComponent } from '../shared/match-badge.component';

@Component({
  selector: 'app-pipeline',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, FormsModule, RouterLink, LabelPipe, MoneyPipe, AvatarComponent, EmptyStateComponent, IconComponent, MatchBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .cdk-drag-preview { box-shadow: 0 12px 28px rgb(20 23 26 / 0.18); border-radius: 12px; }
    .cdk-drag-placeholder { opacity: 0.35; }
    .cdk-drag-animating, .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) { transition: transform 200ms ease; }
  `],
  template: `
    <div class="px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-page">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="h1">Pipeline</h1>
            <p class="mt-1 text-ink-muted">Your private deal board. Drag a card to move it. {{ active() }} active deals.</p>
          </div>
          <a routerLink="/discover" [queryParams]="{ sort: 'match' }" class="btn-secondary"><app-icon name="plus" [size]="15" /> Find startups</a>
        </div>
      </div>

      @if (loading()) {
        <div class="mx-auto mt-6 grid max-w-page grid-cols-2 gap-3 lg:grid-cols-6">@for (i of stages; track i) { <div class="skeleton h-64"></div> }</div>
      } @else if (!items().length) {
        <div class="mx-auto mt-8 max-w-page">
          <app-empty icon="kanban" title="Your pipeline is empty" text="Open a startup and choose a stage under “Your pipeline” to start tracking it.">
            <a routerLink="/discover" class="btn-primary btn-sm">Browse startups</a>
          </app-empty>
        </div>
      } @else {
        <div class="mx-auto mt-6 max-w-page overflow-x-auto pb-4" cdkDropListGroup>
          <div class="flex min-w-max gap-3">
            @for (st of stages; track st) {
              <section class="flex w-64 shrink-0 flex-col rounded-card bg-subtle/80">
                <header class="flex items-center justify-between px-3 pb-2 pt-3">
                  <h2 class="text-[13px] font-semibold">{{ st | label }}</h2>
                  <span class="rounded-full bg-surface px-2 text-2xs font-medium text-ink-muted">{{ columns()[st].length }}</span>
                </header>
                <div class="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-2" cdkDropList [cdkDropListData]="st" (cdkDropListDropped)="drop($event)" [attr.aria-label]="(st | label) + ' column'">
                  @for (it of columns()[st]; track it.id) {
                    <article cdkDrag [cdkDragData]="it" class="cursor-grab rounded-[10px] border border-line/[0.08] bg-surface p-3 active:cursor-grabbing" (click)="open(it)" tabindex="0" (keydown.enter)="open(it)">
                      <div class="flex items-start gap-2.5">
                        <app-avatar [name]="it.startup.companyName" [size]="30" [square]="true" />
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium">{{ it.startup.companyName }}</p>
                          <p class="truncate text-2xs text-ink-faint">{{ it.startup.industry | label }} · {{ it.startup.stage | label }}</p>
                        </div>
                        @if (it.startup.match) { <app-match-badge [score]="it.startup.match.score" [size]="28" /> }
                      </div>
                      <div class="mt-2 flex items-center justify-between text-2xs text-ink-muted">
                        <span class="tabular-nums">{{ it.startup.fundingNeeded | money }}</span>
                        @if (it.notes) { <app-icon name="pencil" [size]="12" class="text-ink-faint" /> }
                      </div>
                    </article>
                  }
                </div>
              </section>
            }
          </div>
        </div>
      }
    </div>

    @if (selected(); as it) {
      <div class="fixed inset-0 z-50 flex justify-end bg-ink/25" (click)="selected.set(null)">
        <aside class="flex h-full w-full max-w-md flex-col bg-surface shadow-2xl" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="pd-title">
          <header class="flex items-start gap-3 border-b border-line/[0.07] p-5">
            <app-avatar [name]="it.startup.companyName" [size]="44" [square]="true" />
            <div class="min-w-0 flex-1">
              <h2 id="pd-title" class="truncate font-semibold">{{ it.startup.companyName }}</h2>
              <p class="truncate text-[13px] text-ink-muted">{{ it.startup.tagline }}</p>
            </div>
            <button type="button" class="btn-ghost btn-icon -mr-2" (click)="selected.set(null)" aria-label="Close"><app-icon name="x" /></button>
          </header>
          <div class="flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <label class="label" for="pd-stage">Stage</label>
              <select id="pd-stage" class="select" [ngModel]="it.stage" (ngModelChange)="move(it, $event)">
                @for (st of stages; track st) { <option [value]="st">{{ st | label }}</option> }
              </select>
            </div>
            <div>
              <label class="label" for="pd-notes">Notes</label>
              <textarea id="pd-notes" class="input" rows="8" maxlength="4000" [(ngModel)]="notes" placeholder="Team, market, open questions…"></textarea>
              <button type="button" class="btn-secondary btn-sm mt-2" (click)="saveNotes(it)">Save notes</button>
            </div>
            <dl class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg bg-subtle p-3"><dt class="text-2xs text-ink-faint">Raising</dt><dd class="font-semibold tabular-nums">{{ it.startup.fundingNeeded | money }}</dd></div>
              <div class="rounded-lg bg-subtle p-3"><dt class="text-2xs text-ink-faint">Match</dt><dd class="font-semibold tabular-nums">{{ it.startup.match ? it.startup.match.score + '%' : '–' }}</dd></div>
            </dl>
          </div>
          <footer class="flex gap-2 border-t border-line/[0.07] p-4">
            <a [routerLink]="['/startups', it.startup.id]" class="btn-primary flex-1">Open profile</a>
            <button type="button" class="btn-danger" (click)="remove(it)">Remove</button>
          </footer>
        </aside>
      </div>
    }
  `,
})
export class PipelinePage {
  private api = inject(Api);
  private toast = inject(ToastService);
  stages = PIPELINE_STAGES;
  items = signal<PipelineItem[]>([]);
  loading = signal(true);
  selected = signal<PipelineItem | null>(null);
  notes = '';

  columns = computed(() => {
    const c = Object.fromEntries(this.stages.map(s => [s, [] as PipelineItem[]])) as Record<PipelineStage, PipelineItem[]>;
    for (const it of this.items()) (c[it.stage] ?? c.INTERESTED).push(it);
    for (const s of this.stages) c[s].sort((a, b) => a.position - b.position);
    return c;
  });
  active = computed(() => this.items().filter(i => i.stage !== 'PASSED' && i.stage !== 'INVESTED').length);

  constructor() { this.load(); }
  private load() { this.api.pipeline().subscribe({ next: r => { this.items.set(r.items); this.loading.set(false); }, error: () => this.loading.set(false) }); }

  drop(e: CdkDragDrop<PipelineStage>) {
    const it = e.item.data as PipelineItem;
    const target = e.container.data;
    const list = this.columns()[target].filter(x => x.id !== it.id);
    list.splice(e.currentIndex, 0, { ...it, stage: target });
    // Renumber the column so the order survives a reload.
    const positions = new Map(list.map((x, i) => [x.id, i]));
    const before = this.items();
    this.items.set(before.map(x => (positions.has(x.id) ? { ...x, stage: x.id === it.id ? target : x.stage, position: positions.get(x.id)! } : x)));
    const changed = list.filter((x, i) => x.id === it.id || before.find(b => b.id === x.id)?.position !== i);
    changed.forEach(x => this.api.savePipeline(x.startup.id, { stage: x.id === it.id ? target : undefined, position: positions.get(x.id)! }).subscribe({
      error: err => { this.items.set(before); this.toast.error(errorText(err)); },
    }));
  }

  open(it: PipelineItem) { this.selected.set(it); this.notes = it.notes ?? ''; }

  move(it: PipelineItem, stage: PipelineStage) {
    const pos = this.columns()[stage].length;
    this.api.savePipeline(it.startup.id, { stage, position: pos }).subscribe({
      next: () => {
        this.items.update(l => l.map(x => (x.id === it.id ? { ...x, stage, position: pos } : x)));
        this.selected.set({ ...it, stage, position: pos });
      },
      error: e => this.toast.error(errorText(e)),
    });
  }
  saveNotes(it: PipelineItem) {
    this.api.savePipeline(it.startup.id, { notes: this.notes }).subscribe({
      next: () => { this.items.update(l => l.map(x => (x.id === it.id ? { ...x, notes: this.notes || null } : x))); this.toast.show('Notes saved'); },
      error: e => this.toast.error(errorText(e)),
    });
  }
  remove(it: PipelineItem) {
    this.api.removePipeline(it.startup.id).subscribe({
      next: () => { this.items.update(l => l.filter(x => x.id !== it.id)); this.selected.set(null); this.toast.show('Removed from pipeline'); },
      error: e => this.toast.error(errorText(e)),
    });
  }
  @HostListener('document:keydown.escape') esc() { this.selected.set(null); }
}
