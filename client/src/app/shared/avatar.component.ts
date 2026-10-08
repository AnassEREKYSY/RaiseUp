import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { initials } from '../core/labels';

/** Initials on a soft tone picked from the name, so people are easy to tell apart. */
const TONES = ['#E8F0EC:#1F5E46', '#EEF0F6:#33406B', '#F6EFE6:#7A4A12', '#F2ECF4:#5E3A6E', '#EAF2F4:#22566A', '#F5ECEA:#7A3326'];

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `
    <span class="inline-flex items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-black/5"
          [class.!rounded-lg]="square()" [style.width.px]="size()" [style.height.px]="size()" [style.fontSize.px]="size() * 0.38"
          [style.background]="tone()[0]" [style.color]="tone()[1]" aria-hidden="true">{{ text() }}</span>
  `,
})
export class AvatarComponent {
  name = input<string | null | undefined>('');
  size = input(36);
  square = input(false);
  text = computed(() => initials(this.name()));
  tone = computed(() => {
    const n = [...(this.name() ?? '')].reduce((a, c) => a + c.charCodeAt(0), 0);
    return TONES[n % TONES.length].split(':');
  });
}
