import { Component, Inject, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MessagesService } from '../../services/messages.service';
import { MessageDto } from '../../core/dtos/message.dto';
import { ChatDialogData } from '../../core/types/chatDialogData.type';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatIconModule, DatePipe, NgOptimizedImage],
  templateUrl: './chat-dialog.component.html',
  styleUrls: ['./chat-dialog.component.scss']
})
export class ChatDialogComponent implements OnInit, OnDestroy {
  @ViewChild('scrollEl') scrollEl!: ElementRef<HTMLElement>;

  messages: MessageDto[] = [];
  input = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  loading = true;
  sending = false;
  errorMsg = '';
  matchId!: string;
  currentUserId = '';
  private sub?: Subscription;

  get sendDisabled() { return this.sending || this.input.value.trim().length === 0; }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ChatDialogData,
    public ref: MatDialogRef<ChatDialogComponent>,
    private msgs: MessagesService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.currentUser?.id || this.getUserId();

    const open$ = this.data.matchId
      ? of({ id: this.data.matchId, messages: [] })
      : this.msgs.getOrCreateConversation(this.data.targetUserId, {
          projectId: this.data.projectId,
          investorProfileId: this.data.investorProfileId
        });

    open$
      .pipe(
        catchError(() => {
          this.loading = false;
          this.errorMsg = 'Unable to open conversation.';
          return of(null);
        })
      )
      .subscribe(match => {
        if (!match) return;

        this.matchId = match.id;
        this.msgs.setCurrentMatch(match.id);

        if (Array.isArray(match.messages) && match.messages.length) {
          this.messages = match.messages as MessageDto[];
        }

        this.sub = this.msgs.listByMatch(match.id)
          .pipe(
            catchError(() => {
              this.loading = false;
              this.errorMsg = 'Unable to load messages.';
              return of([]);
            }),
            finalize(() => {
              this.loading = false;
              this.cdr.markForCheck();
              queueMicrotask(() => this.scrollToBottom());
            })
          )
          .subscribe(list => {
            this.messages = list;
            this.cdr.detectChanges();
            this.scrollToBottom();
          });
      });
  }

  send() {
    const content = this.input.value.trim();
    if (!content || !this.matchId || this.sending) return;

    this.sending = true;

    const temp: MessageDto = {
      id: 'temp-' + cryptoRandom(),
      matchId: this.matchId,
      senderId: this.currentUserId,
      content,
      createdAt: new Date().toISOString()
    } as MessageDto;

    this.messages = [...this.messages, temp];
    this.input.reset('');
    this.cdr.detectChanges();
    this.scrollToBottom();

    this.msgs.send(this.matchId, content)
      .pipe(
        catchError(() => {
          this.errorMsg = 'Message not sent. Try again.';
          this.messages = this.messages.filter(m => m.id !== temp.id);
          this.sending = false;
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe(sent => {
        if (sent) {
          const idx = this.messages.findIndex(m => m.id === temp.id);
          if (idx > -1) this.messages[idx] = sent; else this.messages = [...this.messages, sent];
        }
        this.sending = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      });
  }

  onEnter(event: KeyboardEvent) {
    event.preventDefault();
    this.send();
  }

  isMine(m: MessageDto) { return m.senderId === this.currentUserId; }

  trackById = (_: number, m: MessageDto) => m.id;

  isRead(m: MessageDto): boolean {
    const anyM = m as any;
    return Boolean(anyM.isRead || anyM.read || anyM.readAt);
  }

  private scrollToBottom() {
    const el = this.scrollEl?.nativeElement;
    if (!el) return;
    el.scrollLeft = 0;
    el.scrollTop = el.scrollHeight;
  }

  private getUserId(): string {
    const uid = localStorage.getItem('uid');
    if (uid) return uid;
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload?.sub || payload?.userId || payload?.id || '';
    } catch { return ''; }
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}

function cryptoRandom() {
  try { return crypto.getRandomValues(new Uint32Array(1))[0].toString(16); }
  catch { return Math.floor(Math.random() * 1e9).toString(16); }
}
