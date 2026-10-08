import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { INDUSTRIES, INVESTOR_TYPES, STAGES } from '../core/labels';
import { Industry, Role, Stage } from '../core/models';
import { LabelPipe } from '../core/pipes';

export type Section = 'basics' | 'focus' | 'numbers';
export type ProfileModel = Record<string, any>;

/** Profile form fields for both account types, split in sections (onboarding shows one at a time). */
@Component({
  selector: 'app-profile-fields',
  imports: [FormsModule, LabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let m = value();
    @if (role() === 'STARTUP') {
      @if (show('basics')) {
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2"><label class="label" for="companyName">Company name</label><input id="companyName" class="input" [ngModel]="m['companyName']" (ngModelChange)="set('companyName', $event)" maxlength="120" /></div>
          <div class="sm:col-span-2"><label class="label" for="tagline">One-line pitch</label><input id="tagline" class="input" [ngModel]="m['tagline']" (ngModelChange)="set('tagline', $event)" maxlength="140" placeholder="What you do, for whom" /><p class="hint">Shown on your card. 140 characters.</p></div>
          <div class="sm:col-span-2"><label class="label" for="description">Description</label><textarea id="description" class="input" rows="4" [ngModel]="m['description']" (ngModelChange)="set('description', $event)" maxlength="4000"></textarea></div>
          <div><label class="label" for="country">Country</label><input id="country" class="input" [ngModel]="m['country']" (ngModelChange)="set('country', $event)" /></div>
          <div><label class="label" for="website">Website</label><input id="website" class="input" type="url" placeholder="https://" [ngModel]="m['website']" (ngModelChange)="set('website', $event)" /></div>
        </div>
      }
      @if (show('focus')) {
        <div class="space-y-5">
          <fieldset><legend class="label">Industry</legend>
            <div class="flex flex-wrap gap-2">@for (i of industries; track i) { <button type="button" class="chip" [class.chip-on]="m['industry'] === i" (click)="set('industry', i)" [attr.aria-pressed]="m['industry'] === i">{{ i | label }}</button> }</div>
          </fieldset>
          <fieldset><legend class="label">Stage</legend>
            <div class="flex flex-wrap gap-2">@for (s of stages; track s) { <button type="button" class="chip" [class.chip-on]="m['stage'] === s" (click)="set('stage', s)" [attr.aria-pressed]="m['stage'] === s">{{ s | label }}</button> }</div>
          </fieldset>
          <div class="grid gap-4 sm:grid-cols-2">
            <div><label class="label" for="fundingNeeded">Raising (€)</label><input id="fundingNeeded" class="input" type="number" min="0" step="1000" [ngModel]="m['fundingNeeded']" (ngModelChange)="set('fundingNeeded', $event)" /></div>
            <div><label class="label" for="amountRaised">Already committed (€)</label><input id="amountRaised" class="input" type="number" min="0" step="1000" [ngModel]="m['amountRaised']" (ngModelChange)="set('amountRaised', $event)" /></div>
            <div class="sm:col-span-2"><label class="label" for="pitchDeckUrl">Pitch deck link</label><input id="pitchDeckUrl" class="input" type="url" placeholder="https://" [ngModel]="m['pitchDeckUrl']" (ngModelChange)="set('pitchDeckUrl', $event)" /><p class="hint">Visible to investors you connect with and to anyone who opens your profile.</p></div>
          </div>
        </div>
      }
      @if (show('numbers')) {
        <div class="grid gap-4 sm:grid-cols-3">
          <div><label class="label" for="foundedYear">Founded</label><input id="foundedYear" class="input" type="number" min="1900" max="2100" [ngModel]="m['foundedYear']" (ngModelChange)="set('foundedYear', $event)" /></div>
          <div><label class="label" for="teamSize">Team size</label><input id="teamSize" class="input" type="number" min="1" [ngModel]="m['teamSize']" (ngModelChange)="set('teamSize', $event)" /></div>
          <div><label class="label" for="customers">Customers</label><input id="customers" class="input" type="number" min="0" [ngModel]="m['customers']" (ngModelChange)="set('customers', $event)" /></div>
          <div><label class="label" for="monthlyRevenue">Monthly revenue (€)</label><input id="monthlyRevenue" class="input" type="number" min="0" [ngModel]="m['monthlyRevenue']" (ngModelChange)="set('monthlyRevenue', $event)" /></div>
          <div><label class="label" for="monthlyGrowth">Monthly growth (%)</label><input id="monthlyGrowth" class="input" type="number" [ngModel]="m['monthlyGrowth']" (ngModelChange)="set('monthlyGrowth', $event)" /></div>
          <div class="sm:col-span-3"><label class="label" for="traction">Traction</label><textarea id="traction" class="input" rows="3" maxlength="2000" placeholder="Customers, pilots, partnerships, key numbers" [ngModel]="m['traction']" (ngModelChange)="set('traction', $event)"></textarea></div>
        </div>
      }
    } @else {
      @if (show('basics')) {
        <div class="grid gap-4 sm:grid-cols-2">
          <div><label class="label" for="icompany">Fund or company</label><input id="icompany" class="input" placeholder="Leave empty if you invest alone" [ngModel]="m['companyName']" (ngModelChange)="set('companyName', $event)" /></div>
          <div><label class="label" for="itype">Investor type</label>
            <select id="itype" class="select" [ngModel]="m['investorType'] ?? ''" (ngModelChange)="set('investorType', $event || null)">
              <option value="">Choose</option>@for (t of investorTypes; track t) { <option [value]="t">{{ t | label }}</option> }
            </select></div>
          <div class="sm:col-span-2"><label class="label" for="bio">Thesis and what you bring</label><textarea id="bio" class="input" rows="4" maxlength="4000" [ngModel]="m['bio']" (ngModelChange)="set('bio', $event)"></textarea></div>
          <div><label class="label" for="location">Where you invest</label><input id="location" class="input" placeholder="France, Europe, Global…" [ngModel]="m['location']" (ngModelChange)="set('location', $event)" /></div>
          <div><label class="label" for="iweb">Website</label><input id="iweb" class="input" type="url" placeholder="https://" [ngModel]="m['website']" (ngModelChange)="set('website', $event)" /></div>
        </div>
      }
      @if (show('focus')) {
        <div class="space-y-5">
          <fieldset><legend class="label">Industries <span class="font-normal text-ink-faint">(none selected = open to all)</span></legend>
            <div class="flex flex-wrap gap-2">@for (i of industries; track i) { <button type="button" class="chip" [class.chip-on]="has('industries', i)" (click)="toggle('industries', i)" [attr.aria-pressed]="has('industries', i)">{{ i | label }}</button> }</div>
          </fieldset>
          <fieldset><legend class="label">Stages</legend>
            <div class="flex flex-wrap gap-2">@for (s of stages; track s) { <button type="button" class="chip" [class.chip-on]="has('stagePreference', s)" (click)="toggle('stagePreference', s)" [attr.aria-pressed]="has('stagePreference', s)">{{ s | label }}</button> }</div>
          </fieldset>
        </div>
      }
      @if (show('numbers')) {
        <div class="grid gap-4 sm:grid-cols-3">
          <div><label class="label" for="minTicket">Smallest ticket (€)</label><input id="minTicket" class="input" type="number" min="0" step="1000" [ngModel]="m['minTicket']" (ngModelChange)="set('minTicket', $event)" /></div>
          <div><label class="label" for="maxTicket">Largest ticket (€)</label><input id="maxTicket" class="input" type="number" min="0" step="1000" [ngModel]="m['maxTicket']" (ngModelChange)="set('maxTicket', $event)" /></div>
          <div><label class="label" for="portfolioCount">Companies backed</label><input id="portfolioCount" class="input" type="number" min="0" [ngModel]="m['portfolioCount']" (ngModelChange)="set('portfolioCount', $event)" /></div>
        </div>
      }
    }
  `,
})
export class ProfileFieldsComponent {
  role = input.required<Role>();
  section = input<Section | 'all'>('all');
  value = model.required<ProfileModel>();
  industries: Industry[] = INDUSTRIES;
  stages: Stage[] = STAGES;
  investorTypes = INVESTOR_TYPES;

  show(s: Section) { return this.section() === 'all' || this.section() === s; }
  set(k: string, v: unknown) { this.value.update(m => ({ ...m, [k]: v === '' ? null : v })); }
  has(k: string, v: string) { return ((this.value()[k] as string[]) ?? []).includes(v); }
  toggle(k: string, v: string) {
    const list = (this.value()[k] as string[]) ?? [];
    this.set(k, list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  }
}

/** Keeps only the fields the API accepts for this role. */
export function toPayload(role: Role, m: ProfileModel) {
  const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  if (role === 'STARTUP') {
    return {
      companyName: str(m['companyName']) ?? '', tagline: str(m['tagline']), description: str(m['description']), industry: m['industry'], stage: m['stage'],
      fundingNeeded: num(m['fundingNeeded']), amountRaised: num(m['amountRaised']), teamSize: num(m['teamSize']), foundedYear: num(m['foundedYear']),
      monthlyRevenue: num(m['monthlyRevenue']), monthlyGrowth: num(m['monthlyGrowth']), customers: num(m['customers']),
      website: str(m['website']), country: str(m['country']), traction: str(m['traction']), pitchDeckUrl: str(m['pitchDeckUrl']),
    };
  }
  return {
    companyName: str(m['companyName']), investorType: m['investorType'] || null, bio: str(m['bio']), industries: m['industries'] ?? [],
    stagePreference: m['stagePreference'] ?? [], location: str(m['location']), minTicket: num(m['minTicket']), maxTicket: num(m['maxTicket']),
    portfolioCount: num(m['portfolioCount']), website: str(m['website']),
  };
}
