import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatchScore } from '../core/models';
import { IconComponent } from './icon.component';
import { MatchBadgeComponent } from './match-badge.component';

@Component({
  selector: 'app-score-breakdown',
  imports: [IconComponent, MatchBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center gap-3">
      <app-match-badge [score]="match().score" [size]="52" />
      <div>
        <p class="font-semibold">{{ match().score }}% match</p>
        <p class="text-[13px] text-ink-muted">{{ subtitle() }}</p>
      </div>
    </div>
    <ul class="mt-4 space-y-2.5">
      @for (r of match().reasons; track r.label) {
        <li class="flex items-center gap-2.5 text-sm">
          <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                [class]="r.ok ? 'bg-accent-soft text-accent' : 'bg-subtle text-ink-faint'">
            <app-icon [name]="r.ok ? 'check' : 'x'" [size]="12" [stroke]="2.5" />
          </span>
          <span class="flex-1" [class.text-ink-muted]="!r.ok">{{ r.label }}</span>
          <span class="text-[13px] tabular-nums text-ink-faint">{{ r.points }}/{{ r.max }}</span>
        </li>
      }
    </ul>
  `,
})
export class ScoreBreakdownComponent {
  match = input.required<MatchScore>();
  subtitle = input('Based on industry, stage, ticket size and country');
}
