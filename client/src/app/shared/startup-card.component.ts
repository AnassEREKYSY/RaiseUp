import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StartupCard } from '../core/models';
import { LabelPipe, MoneyPipe } from '../core/pipes';
import { AvatarComponent } from './avatar.component';
import { IconComponent } from './icon.component';
import { MatchBadgeComponent } from './match-badge.component';

@Component({
  selector: 'app-startup-card',
  imports: [RouterLink, AvatarComponent, MatchBadgeComponent, IconComponent, LabelPipe, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let s = startup();
    <a [routerLink]="['/startups', s.id]" class="card group flex h-full flex-col p-5 transition hover:border-line/20 hover:shadow-[0_4px_16px_rgb(20_23_26/0.05)]">
      <div class="flex items-start gap-3">
        <app-avatar [name]="s.companyName" [size]="44" [square]="true" />
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold group-hover:text-accent">{{ s.companyName }}</p>
          <p class="mt-0.5 line-clamp-2 text-[13px] text-ink-muted">{{ s.tagline || s.description || 'No description yet' }}</p>
        </div>
        @if (s.match) { <app-match-badge [score]="s.match.score" [size]="38" /> }
      </div>
      <div class="mt-4 flex flex-wrap gap-1.5">
        <span class="tag">{{ s.industry | label }}</span>
        <span class="tag">{{ s.stage | label }}</span>
        @if (s.country) { <span class="tag">{{ s.country }}</span> }
      </div>
      <div class="mt-auto flex items-end justify-between gap-3 border-t border-line/[0.06] pt-4 mt-5">
        <div>
          <p class="text-2xs uppercase tracking-wider text-ink-faint">Raising</p>
          <p class="font-semibold tabular-nums">{{ s.fundingNeeded | money }}</p>
        </div>
        @if (s.amountRaised && s.fundingNeeded) {
          <div class="w-28">
            <div class="h-1.5 overflow-hidden rounded-full bg-subtle"><div class="h-full rounded-full bg-accent" [style.width.%]="progress()"></div></div>
            <p class="mt-1 text-right text-2xs text-ink-faint">{{ s.amountRaised | money }} raised</p>
          </div>
        } @else if (hint()) {
          <span class="inline-flex items-center gap-1 text-[13px] text-ink-faint">{{ hint() }} <app-icon name="arrow-right" [size]="14" /></span>
        }
      </div>
    </a>
  `,
})
export class StartupCardComponent {
  startup = input.required<StartupCard>();
  hint = input<string | null>(null);
  progress() {
    const s = this.startup();
    return Math.min(100, ((s.amountRaised ?? 0) / (s.fundingNeeded || 1)) * 100);
  }
}
