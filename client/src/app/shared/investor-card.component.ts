import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ticket } from '../core/labels';
import { InvestorCard } from '../core/models';
import { LabelPipe } from '../core/pipes';
import { AvatarComponent } from './avatar.component';
import { MatchBadgeComponent } from './match-badge.component';

@Component({
  selector: 'app-investor-card',
  imports: [RouterLink, AvatarComponent, MatchBadgeComponent, LabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let i = investor();
    <a [routerLink]="['/investors', i.id]" class="card group flex h-full flex-col p-5 transition hover:border-line/20 hover:shadow-[0_4px_16px_rgb(20_23_26/0.05)]">
      <div class="flex items-start gap-3">
        <app-avatar [name]="i.name" [size]="44" />
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold group-hover:text-accent">{{ i.name }}</p>
          <p class="mt-0.5 truncate text-[13px] text-ink-muted">{{ i.companyName || (i.investorType | label) || 'Investor' }}@if (i.companyName && i.investorType) { · {{ i.investorType | label }}}</p>
        </div>
        @if (i.match) { <app-match-badge [score]="i.match.score" [size]="38" /> }
      </div>
      @if (i.bio) { <p class="mt-3 line-clamp-2 text-[13px] text-ink-muted">{{ i.bio }}</p> }
      <div class="mt-4 flex flex-wrap gap-1.5">
        @for (x of i.industries.slice(0, 3); track x) { <span class="tag">{{ x | label }}</span> }
        @if (i.industries.length > 3) { <span class="tag">+{{ i.industries.length - 3 }}</span> }
      </div>
      <div class="mt-auto flex items-end justify-between gap-3 border-t border-line/[0.06] pt-4 mt-5 text-[13px]">
        <div><p class="text-2xs uppercase tracking-wider text-ink-faint">Ticket</p><p class="font-semibold tabular-nums">{{ ticketText() }}</p></div>
        <p class="truncate text-ink-faint">{{ i.location || 'Any country' }}</p>
      </div>
    </a>
  `,
})
export class InvestorCardComponent {
  investor = input.required<InvestorCard>();
  ticketText = computed(() => ticket(this.investor().minTicket, this.investor().maxTicket));
}
