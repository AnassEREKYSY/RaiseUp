import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/http';
import { INDUSTRIES } from '../core/labels';
import { Project } from '../core/models';
import { LabelPipe, MoneyPipe } from '../core/pipes';
import { ToastService } from '../core/toast.service';
import { IconComponent } from '../shared/icon.component';
import { ProfileFieldsComponent, ProfileModel, toPayload } from '../shared/profile-fields.component';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, LabelPipe, MoneyPipe, IconComponent, ProfileFieldsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let u = auth.user()!;
    <div class="page max-w-3xl py-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div><h1 class="h1">Your profile</h1><p class="mt-1 text-ink-muted">{{ u.email }} · {{ u.role === 'INVESTOR' ? 'Investor' : 'Startup' }} account</p></div>
        @if (publicLink(); as l) { <a [routerLink]="l" class="btn-secondary"><app-icon name="eye" [size]="15" /> See public profile</a> }
      </div>

      <section class="card mt-6 p-5 sm:p-6">
        <h2 class="h2">Account</h2>
        <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div class="flex-1"><label class="label" for="fullName">Full name</label><input id="fullName" class="input" [(ngModel)]="fullName" maxlength="100" /></div>
          <button type="button" class="btn-secondary" (click)="saveName()" [disabled]="fullName.trim() === u.fullName || fullName.trim().length < 2">Save</button>
        </div>
      </section>

      @for (s of sections; track s.key) {
        <section class="card mt-6 p-5 sm:p-6">
          <h2 class="h2">{{ s.title }}</h2>
          <div class="mt-4"><app-profile-fields [role]="u.role" [section]="s.key" [(value)]="model" /></div>
        </section>
      }
      <div class="sticky bottom-20 z-10 mt-6 flex items-center justify-end gap-3 rounded-card border border-line/[0.08] bg-surface/95 p-3 backdrop-blur md:bottom-4">
        @if (error()) { <p class="mr-auto text-sm text-danger" role="alert">{{ error() }}</p> }
        <button type="button" class="btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save profile' }}</button>
      </div>

      @if (u.role === 'STARTUP') {
        <section class="card mt-6 p-5 sm:p-6">
          <div class="flex items-center justify-between"><h2 class="h2">Projects</h2>@if (!editing()) { <button type="button" class="btn-secondary btn-sm" (click)="edit(null)"><app-icon name="plus" [size]="14" /> Add project</button> }</div>
          @if (editing(); as p) {
            <form class="mt-4 grid gap-3 rounded-lg bg-subtle p-4 sm:grid-cols-2" (ngSubmit)="saveProject()">
              <div class="sm:col-span-2"><label class="label" for="pt">Title</label><input id="pt" name="pt" class="input" [(ngModel)]="p.title" maxlength="120" required /></div>
              <div class="sm:col-span-2"><label class="label" for="pd">Description</label><textarea id="pd" name="pd" class="input" rows="3" [(ngModel)]="p.description" maxlength="4000" required></textarea></div>
              <div><label class="label" for="pi">Industry</label><select id="pi" name="pi" class="select" [(ngModel)]="p.industry">@for (i of industries; track i) { <option [value]="i">{{ i | label }}</option> }</select></div>
              <div><label class="label" for="pg">Funding goal (€)</label><input id="pg" name="pg" type="number" min="0" class="input" [(ngModel)]="p.fundingGoal" /></div>
              <div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-ghost btn-sm" (click)="editing.set(null)">Cancel</button><button type="submit" class="btn-primary btn-sm">Save project</button></div>
            </form>
          }
          <ul class="mt-3 divide-y divide-line/[0.06]">
            @for (p of projects(); track p.id) {
              <li class="flex items-start gap-3 py-3">
                <div class="min-w-0 flex-1"><p class="font-medium">{{ p.title }}</p><p class="mt-0.5 line-clamp-2 text-sm text-ink-muted">{{ p.description }}</p><p class="mt-1 text-2xs text-ink-faint">{{ p.industry | label }}@if (p.fundingGoal) { · {{ p.fundingGoal | money }}}</p></div>
                <button type="button" class="btn-ghost btn-icon" (click)="edit(p)" [attr.aria-label]="'Edit ' + p.title"><app-icon name="pencil" [size]="15" /></button>
                <button type="button" class="btn-ghost btn-icon hover:text-danger" (click)="deleteProject(p)" [attr.aria-label]="'Delete ' + p.title"><app-icon name="trash" [size]="15" /></button>
              </li>
            } @empty { @if (!editing()) { <li class="py-4 text-sm text-ink-muted">No projects yet. Add the products or rounds you want investors to see.</li> } }
          </ul>
        </section>
      }

      <div class="mt-8 flex justify-end"><button type="button" class="btn-ghost" (click)="auth.logout()"><app-icon name="logout" [size]="15" /> Sign out</button></div>
    </div>
  `,
})
export class ProfilePage {
  auth = inject(AuthService);
  private api = inject(Api);
  private toast = inject(ToastService);
  industries = INDUSTRIES;
  fullName = this.auth.user()!.fullName;
  model = signal<ProfileModel>(this.initial());
  saving = signal(false);
  error = signal<string | null>(null);
  editing = signal<Partial<Project> | null>(null);
  projects = computed(() => this.auth.user()?.startup?.projects ?? []);
  publicLink = computed(() => { const u = this.auth.user(); return u?.startup ? ['/startups', u.startup.id] : u?.investor ? ['/investors', u.investor.id] : null; });
  sections = this.auth.user()!.role === 'STARTUP'
    ? [{ key: 'basics' as const, title: 'Company' }, { key: 'focus' as const, title: 'Raise' }, { key: 'numbers' as const, title: 'Key numbers' }]
    : [{ key: 'basics' as const, title: 'About you' }, { key: 'focus' as const, title: 'Focus' }, { key: 'numbers' as const, title: 'Ticket size' }];

  private initial(): ProfileModel {
    const u = this.auth.user()!;
    return { ...(u.startup ?? u.investor ?? { industries: [], stagePreference: [] }) } as ProfileModel;
  }

  saveName() {
    this.api.updateMe({ fullName: this.fullName.trim() }).subscribe({ next: r => { this.auth.setUser(r.user); this.toast.show('Name saved'); }, error: e => this.toast.error(errorText(e)) });
  }
  save() {
    this.error.set(null); this.saving.set(true);
    this.api.saveProfile(toPayload(this.auth.user()!.role, this.model())).subscribe({
      next: r => { this.auth.setUser(r.user); this.saving.set(false); this.toast.show('Profile saved'); },
      error: e => { this.saving.set(false); this.error.set(errorText(e)); },
    });
  }

  edit(p: Project | null) { this.editing.set(p ? { ...p } : { title: '', description: '', industry: this.auth.user()?.startup?.industry ?? 'OTHER', fundingGoal: null }); }
  saveProject() {
    const p = this.editing(); if (!p) return;
    const body = { title: (p.title ?? '').trim(), description: (p.description ?? '').trim(), industry: p.industry, fundingGoal: p.fundingGoal === null || (p.fundingGoal as unknown) === '' ? null : Number(p.fundingGoal) };
    if (!body.title || !body.description) return this.toast.error('Add a title and a description.');
    (p.id ? this.api.updateProject(p.id, body) : this.api.addProject(body)).subscribe({
      next: () => { this.editing.set(null); this.refresh(); this.toast.show('Project saved'); },
      error: e => this.toast.error(errorText(e)),
    });
  }
  deleteProject(p: Project) {
    this.api.deleteProject(p.id).subscribe({ next: () => { this.refresh(); this.toast.show('Project deleted'); }, error: e => this.toast.error(errorText(e)) });
  }
  private refresh() { this.api.me().subscribe(r => this.auth.setUser(r.user)); }
}
