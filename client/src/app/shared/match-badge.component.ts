import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Score ring 0-100. Strong >= 75, good >= 50. */
@Component({
  selector: 'app-match-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 36 36" role="img" [attr.aria-label]="score() + '% match'">
      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(20 23 26 / 0.08)" stroke-width="3" />
      <circle cx="18" cy="18" r="15.5" fill="none" [attr.stroke]="color()" stroke-width="3" stroke-linecap="round"
              [attr.stroke-dasharray]="dash()" transform="rotate(-90 18 18)" />
      <text x="18" y="22" text-anchor="middle" font-size="11" font-weight="600" fill="#14171A">{{ score() }}</text>
    </svg>
    @if (showLabel()) { <span class="text-[13px] text-ink-muted">{{ word() }}</span> }
  `,
})
export class MatchBadgeComponent {
  score = input.required<number>();
  size = input(40);
  showLabel = input(false);
  dash = computed(() => `${(this.score() / 100) * 97.4} 97.4`);
  color = computed(() => (this.score() >= 75 ? '#1F5E46' : this.score() >= 50 ? '#5C8A75' : '#A8ADB3'));
  word = computed(() => (this.score() >= 75 ? 'Strong match' : this.score() >= 50 ? 'Good match' : 'Partial match'));
}
