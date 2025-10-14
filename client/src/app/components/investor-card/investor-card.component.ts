import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../../core/models/user.model';
import { InvestorProfile } from '../../core/models/investor.model';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ChatDialogComponent } from '../chat-dialog/chat-dialog.component';
import { MatchDto } from '../../core/dtos/match.dto';
import { MatchesService } from '../../services/match.service';
import { SnackMatchComponent } from '../snack-match/snack-match.component';

@Component({
  selector: 'app-investor-card',
  standalone: true,
  imports: [CommonModule, MatIcon, MatSnackBarModule],
  templateUrl: './investor-card.component.html',
  styleUrls: ['./investor-card.component.scss']
})
export class InvestorCardComponent {
  @Input() user!: User;
  @Input() profile!: InvestorProfile;
  liked = false;
  match?: MatchDto;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private matches: MatchesService,
    private snack: MatSnackBar
  ) {}

  toggleLike() {
    if (this.liked) return;
    this.matches.request(this.user.id, { investorProfileId: this.profile.id }).subscribe({
      next: (m) => {
        this.match = m;
        this.liked = true;
        if (m.status === 'PENDING') {
          this.snack.openFromComponent(SnackMatchComponent, {
            data: { message: 'Match request sent. Waiting for investor to accept.' },
            duration: 3200,
            panelClass: ['snack-pending']
          });
        } else if (m.status === 'ACCEPTED') {
          const ref = this.snack.openFromComponent(SnackMatchComponent, {
            data: { message: 'You are matched. Start chatting now.', action: 'Open chat' },
            duration: 4000,
            panelClass: ['snack-success']
          });
          ref.onAction().subscribe(() => this.openChat());
        }
      },
      error: () => {
        this.snack.openFromComponent(SnackMatchComponent, {
          data: { message: 'Could not send match request.' },
          duration: 3000,
          panelClass: ['snack-error']
        });
      }
    });
  }

  openDetails() { this.router.navigate(['/investors', this.profile.id]); }

  openChat() {
    if (this.match && this.match.status !== 'ACCEPTED') {
      this.snack.openFromComponent(SnackMatchComponent, {
        data: { message: 'Match not accepted yet.' },
        duration: 2200,
        panelClass: ['snack-error']
      });
      return;
    }
    this.dialog.open(ChatDialogComponent, {
      data: {
        targetUserId: this.user.id,
        targetName: this.profile?.companyName || this.user.fullName,
        targetAvatar: this.user.avatarUrl
      },
      disableClose: true,
      autoFocus: false,
      panelClass: 'chat-dialog-panel',
      width: '760px'
    });
  }
}
