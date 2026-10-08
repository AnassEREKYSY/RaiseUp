import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/http';
import { Conversation, Message, Thread } from '../core/models';
import { AgoPipe } from '../core/pipes';
import { Realtime } from '../core/realtime.service';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from '../shared/avatar.component';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { IconComponent } from '../shared/icon.component';

type Filter = 'all' | 'requests' | 'sent';

@Component({
  selector: 'app-inbox',
  imports: [FormsModule, RouterLink, AgoPipe, AvatarComponent, EmptyStateComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex h-[calc(100dvh-4rem-5rem)] max-w-page md:h-[calc(100dvh-4rem)] md:px-6 md:py-6 lg:px-8">
      <div class="flex min-h-0 flex-1 overflow-hidden border-line/[0.08] bg-surface md:rounded-card md:border">
        <!-- Conversations -->
        <section class="flex min-h-0 w-full flex-col border-r border-line/[0.07] md:w-80 md:shrink-0" [class.hidden]="!!id()" [class.md:flex]="true">
          <div class="border-b border-line/[0.07] p-4">
            <h1 class="text-lg font-semibold">Inbox</h1>
            <div class="mt-3 flex gap-1.5">
              @for (f of filters; track f.v) {
                <button type="button" class="chip h-7 text-2xs" [class.chip-on]="filter() === f.v" (click)="filter.set(f.v)">{{ f.label }}@if (f.v === 'requests' && requestCount()) { <span>{{ requestCount() }}</span> }</button>
              }
            </div>
          </div>
          <ul class="min-h-0 flex-1 overflow-y-auto">
            @for (c of shown(); track c.id) {
              <li>
                <a [routerLink]="['/inbox', c.id]" class="flex gap-3 border-l-2 px-4 py-3 transition-colors"
                   [class]="c.id === id() ? 'border-accent bg-accent-soft/60' : 'border-transparent hover:bg-subtle'">
                  <app-avatar [name]="c.counterpart.fullName" [size]="38" />
                  <div class="min-w-0 flex-1">
                    <p class="flex items-baseline gap-2"><span class="truncate text-sm font-medium">{{ c.counterpart.fullName }}</span><span class="ml-auto shrink-0 text-2xs text-ink-faint">{{ c.lastMessageAt | ago }}</span></p>
                    <p class="truncate text-2xs text-ink-faint">{{ c.counterpart.profile?.title || (c.counterpart.role === 'INVESTOR' ? 'Investor' : 'Startup') }}</p>
                    <p class="mt-0.5 truncate text-[13px]" [class]="c.unread ? 'font-medium text-ink' : 'text-ink-muted'">
                      @if (c.status === 'PENDING') { <span class="mr-1 rounded bg-subtle px-1 text-2xs text-ink-muted">{{ c.direction === 'incoming' ? 'Request' : 'Sent' }}</span> }
                      {{ c.lastMessage ? (c.lastMessage.senderId === me() ? 'You: ' : '') + c.lastMessage.content : 'No messages yet' }}
                    </p>
                  </div>
                  @if (c.unread) { <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="unread"></span> }
                </a>
              </li>
            } @empty {
              <li class="p-6"><app-empty icon="inbox" title="Nothing here" [text]="filter() === 'requests' ? 'No requests waiting.' : 'Connect with someone from Discover to start a conversation.'" /></li>
            }
          </ul>
        </section>

        <!-- Thread -->
        <section class="min-h-0 min-w-0 flex-1 flex-col" [class]="id() ? 'flex' : 'hidden md:flex'">
          @if (t(); as t) {
            <header class="flex items-center gap-3 border-b border-line/[0.07] px-4 py-3">
              <a routerLink="/inbox" class="btn-ghost btn-icon -ml-2 md:hidden" aria-label="Back to conversations"><app-icon name="arrow-left" /></a>
              <app-avatar [name]="t.counterpart.fullName" [size]="36" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ t.counterpart.fullName }}</p>
                <p class="truncate text-2xs text-ink-faint">{{ t.counterpart.profile?.title || (t.counterpart.role === 'INVESTOR' ? 'Investor' : 'Startup') }}</p>
              </div>
              @if (t.counterpart.profile; as p) {
                <a [routerLink]="[p.type === 'STARTUP' ? '/startups' : '/investors', p.profileId]" class="btn-secondary btn-sm">View profile</a>
              }
            </header>

            <div #scroll class="min-h-0 flex-1 overflow-y-auto bg-bg/60 px-4 py-5">
              @if (t.status === 'PENDING') {
                <div class="mx-auto mb-5 max-w-md rounded-card border border-line/[0.1] bg-surface p-4 text-center">
                  @if (t.direction === 'outgoing') {
                    <p class="text-sm font-medium">Request sent</p>
                    <p class="mt-1 text-[13px] text-ink-muted">You can write once {{ t.counterpart.fullName }} accepts.</p>
                  } @else {
                    <p class="text-sm font-medium">{{ t.counterpart.fullName }} wants to connect</p>
                    <div class="mt-3 flex justify-center gap-2">
                      <button type="button" class="btn-primary btn-sm" (click)="answer(true)">Accept</button>
                      <button type="button" class="btn-secondary btn-sm" (click)="answer(false)">Decline</button>
                    </div>
                  }
                </div>
              }
              @for (m of t.messages; track m.id; let i = $index) {
                @if (i === 0 || day(m.createdAt) !== day(t.messages[i - 1].createdAt)) {
                  <p class="my-4 text-center text-2xs font-medium uppercase tracking-wider text-ink-faint">{{ dayLabel(m.createdAt) }}</p>
                }
                @if (m.kind === 'MEETING' && m.meta; as meta) {
                  <div class="my-3 flex" [class.justify-end]="m.senderId === me()">
                    <div class="w-full max-w-sm rounded-card border border-line/[0.12] bg-surface p-4">
                      <p class="flex items-center gap-2 text-sm font-semibold"><app-icon name="calendar" [size]="16" class="text-accent" /> Meeting request</p>
                      @if (meta.note) { <p class="mt-1 text-[13px] text-ink-muted">{{ meta.note }}</p> }
                      @if (meta.status === 'ACCEPTED') {
                        <p class="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">Confirmed: {{ slotLabel(meta.acceptedSlot!) }}</p>
                      } @else if (meta.status === 'DECLINED') {
                        <p class="mt-3 text-sm text-ink-muted">Declined</p>
                      } @else if (m.senderId === me()) {
                        <ul class="mt-3 space-y-1.5">@for (s of meta.slots; track s) { <li class="rounded-lg bg-subtle px-3 py-2 text-sm">{{ slotLabel(s) }}</li> }</ul>
                        <p class="mt-2 text-2xs text-ink-faint">Waiting for an answer</p>
                      } @else {
                        <p class="mt-3 text-2xs text-ink-faint">Pick a time</p>
                        <div class="mt-1.5 space-y-1.5">
                          @for (s of meta.slots; track s) {
                            <button type="button" class="btn-secondary btn-sm w-full justify-start" (click)="answerMeeting(m, s)">{{ slotLabel(s) }}</button>
                          }
                        </div>
                        <button type="button" class="mt-2 text-[13px] text-ink-muted hover:text-ink" (click)="answerMeeting(m, null)">None of these work</button>
                      }
                    </div>
                  </div>
                } @else {
                  <div class="my-1 flex" [class.justify-end]="m.senderId === me()">
                    <div class="max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px]"
                         [class]="m.senderId === me() ? 'rounded-br-md bg-accent text-white' : 'rounded-bl-md border border-line/[0.08] bg-surface'"><p class="whitespace-pre-wrap break-words">{{ m.content }}</p><span class="mt-0.5 block text-right text-[10px]" [class]="m.senderId === me() ? 'text-white/70' : 'text-ink-faint'">{{ time(m.createdAt) }}</span></div>
                  </div>
                }
              } @empty {
                @if (t.status === 'ACCEPTED') { <p class="py-10 text-center text-sm text-ink-muted">You are connected. Say hello.</p> }
              }
            </div>

            @if (t.status === 'ACCEPTED') {
              @if (meeting()) {
                <form class="border-t border-line/[0.07] bg-surface p-4" (ngSubmit)="proposeMeeting()">
                  <p class="text-sm font-medium">Propose up to three times</p>
                  <div class="mt-3 grid gap-2 sm:grid-cols-3">
                    @for (i of [0, 1, 2]; track i) {
                      <label class="sr-only" [for]="'slot' + i">Time {{ i + 1 }}</label>
                      <input [id]="'slot' + i" type="datetime-local" class="input h-9 text-sm" [name]="'slot' + i" [(ngModel)]="slots[i]" [min]="minSlot" />
                    }
                  </div>
                  <input class="input mt-2 h-9 text-sm" name="note" placeholder="Add a note (optional), e.g. 30 min video call" [(ngModel)]="meetingNote" maxlength="500" />
                  <div class="mt-3 flex justify-end gap-2">
                    <button type="button" class="btn-ghost btn-sm" (click)="meeting.set(false)">Cancel</button>
                    <button type="submit" class="btn-primary btn-sm" [disabled]="sending()">Send request</button>
                  </div>
                </form>
              } @else {
                <form class="flex items-end gap-2 border-t border-line/[0.07] bg-surface p-3" (ngSubmit)="send()">
                  <button type="button" class="btn-ghost btn-icon shrink-0" (click)="meeting.set(true)" aria-label="Propose a meeting" title="Propose a meeting"><app-icon name="calendar" /></button>
                  <label class="sr-only" for="msg">Message</label>
                  <textarea id="msg" name="msg" rows="1" class="input max-h-40 min-h-10 resize-none py-2" placeholder="Write a message" [(ngModel)]="draft"
                            (keydown.enter)="onEnter($any($event))"></textarea>
                  <button type="submit" class="btn-primary btn-icon shrink-0" [disabled]="!draft.trim() || sending()" aria-label="Send"><app-icon name="send" [size]="16" /></button>
                </form>
              }
            }
          } @else if (id()) {
            <div class="flex flex-1 items-center justify-center"><div class="skeleton h-6 w-40"></div></div>
          } @else {
            <div class="flex flex-1 items-center justify-center p-8"><app-empty icon="message" title="Pick a conversation" text="Requests, messages and meeting times all live here." /></div>
          }
        </section>
      </div>
    </div>
  `,
})
export class InboxPage {
  id = input<string | undefined>();
  private api = inject(Api);
  private auth = inject(AuthService);
  private rt = inject(Realtime);
  private toast = inject(ToastService);
  private destroy = inject(DestroyRef);
  private scrollEl = viewChild<ElementRef<HTMLElement>>('scroll');

  me = computed(() => this.auth.user()?.id);
  list = signal<Conversation[]>([]);
  t = signal<Thread | null>(null);
  filter = signal<Filter>('all');
  filters: { v: Filter; label: string }[] = [{ v: 'all', label: 'All' }, { v: 'requests', label: 'Requests' }, { v: 'sent', label: 'Sent' }];
  requestCount = computed(() => this.list().filter(c => c.status === 'PENDING' && c.direction === 'incoming').length);
  shown = computed(() => this.list().filter(c =>
    this.filter() === 'all' ? true
    : this.filter() === 'requests' ? c.status === 'PENDING' && c.direction === 'incoming'
    : c.status === 'PENDING' && c.direction === 'outgoing'));
  draft = '';
  sending = signal(false);
  meeting = signal(false);
  slots: string[] = ['', '', ''];
  meetingNote = '';
  minSlot = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  constructor() {
    this.loadList();
    effect(() => { const id = this.id(); untracked(() => { this.t.set(null); this.meeting.set(false); if (id) this.loadThread(id); }); });

    this.rt.message$.pipe(takeUntilDestroyed(this.destroy)).subscribe(m => {
      const t = this.t();
      if (t && m.matchId === t.id && !t.messages.some(x => x.id === m.id)) {
        this.t.set({ ...t, messages: [...t.messages, m] });
        this.scrollDown();
        if (m.senderId !== this.me()) this.api.markRead(t.id).subscribe(() => this.rt.refreshCounts());
      }
      this.loadList();
    });
    this.rt.messageUpdate$.pipe(takeUntilDestroyed(this.destroy)).subscribe(m => {
      const t = this.t();
      if (t && m.matchId === t.id) this.t.set({ ...t, messages: t.messages.map(x => (x.id === m.id ? m : x)) });
    });
    this.rt.connection$.pipe(takeUntilDestroyed(this.destroy)).subscribe(c => {
      this.loadList();
      if (this.t()?.id === c.id) this.loadThread(c.id);
    });
  }

  private loadList() { this.api.connections().subscribe({ next: r => this.list.set(r.items), error: () => {} }); }
  private loadThread(id: string) {
    this.api.thread(id).subscribe({
      next: t => { this.t.set(t); this.scrollDown(); this.list.update(l => l.map(c => (c.id === id ? { ...c, unread: 0 } : c))); this.rt.refreshCounts(); },
      error: e => this.toast.error(errorText(e, 'This conversation could not be opened.')),
    });
  }
  private scrollDown() { setTimeout(() => { const el = this.scrollEl()?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }); }

  send() {
    const t = this.t(); const content = this.draft.trim();
    if (!t || !content || this.sending()) return;
    this.sending.set(true);
    this.api.send(t.id, content).subscribe({
      next: m => {
        this.draft = ''; this.sending.set(false);
        const cur = this.t();
        if (cur && !cur.messages.some(x => x.id === m.id)) this.t.set({ ...cur, messages: [...cur.messages, m] });
        this.scrollDown(); this.loadList();
      },
      error: e => { this.sending.set(false); this.toast.error(errorText(e)); },
    });
  }

  proposeMeeting() {
    const t = this.t(); if (!t) return;
    const slots = this.slots.filter(Boolean).map(s => new Date(s).toISOString());
    if (!slots.length) return this.toast.error('Pick at least one time.');
    if (slots.some(s => new Date(s).getTime() < Date.now())) return this.toast.error('Pick times in the future.');
    this.sending.set(true);
    this.api.proposeMeeting(t.id, slots, this.meetingNote.trim() || undefined).subscribe({
      next: m => {
        this.sending.set(false); this.meeting.set(false); this.slots = ['', '', '']; this.meetingNote = '';
        const cur = this.t();
        if (cur && !cur.messages.some(x => x.id === m.id)) this.t.set({ ...cur, messages: [...cur.messages, m] });
        this.scrollDown(); this.toast.show('Meeting request sent');
      },
      error: e => { this.sending.set(false); this.toast.error(errorText(e)); },
    });
  }

  answerMeeting(m: Message, slot: string | null) {
    const t = this.t(); if (!t) return;
    this.api.answerMeeting(t.id, m.id, slot ? 'accept' : 'decline', slot ?? undefined).subscribe({
      next: u => { const cur = this.t(); if (cur) this.t.set({ ...cur, messages: cur.messages.map(x => (x.id === u.id ? u : x)) }); this.toast.show(slot ? 'Meeting confirmed' : 'Meeting declined'); },
      error: e => this.toast.error(errorText(e)),
    });
  }

  answer(accept: boolean) {
    const t = this.t(); if (!t) return;
    (accept ? this.api.accept(t.id) : this.api.decline(t.id)).subscribe({
      next: () => { this.toast.show(accept ? 'Connected. Say hello.' : 'Request declined'); this.loadList(); this.loadThread(t.id); this.rt.refreshCounts(); },
      error: e => this.toast.error(errorText(e)),
    });
  }

  onEnter(e: KeyboardEvent) {
    if (e.shiftKey) return;
    e.preventDefault();
    this.send();
  }

  day(iso: string) { return new Date(iso).toDateString(); }
  dayLabel(iso: string) {
    const d = new Date(iso), today = new Date();
    const y = new Date(); y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  time(iso: string) { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  slotLabel(iso: string) {
    return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
