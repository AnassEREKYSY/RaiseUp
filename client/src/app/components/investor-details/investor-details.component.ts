import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { InvestorsService } from '../../services/investors.service';
import { InvestorProfile } from '../../core/models/investor.model';
import { User } from '../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { ChatDialogComponent } from '../chat-dialog/chat-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatchesService } from '../../services/match.service';
import { SnackMatchComponent } from '../snack-match/snack-match.component';
import { MatchDto } from '../../core/dtos/match.dto';

@Component({
  selector: 'app-investor-details',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './investor-details.component.html',
  styleUrls: ['./investor-details.component.scss']
})
export class InvestorDetailsComponent implements OnInit {
  investor!: InvestorProfile;
  user!: User;
  loading = true;

  liked = false;
  match?: MatchDto;

  constructor(
    private route: ActivatedRoute,
    private investorsService: InvestorsService,
    private router: Router,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private matches: MatchesService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.investorsService.getById(id).subscribe({
        next: (res) => { this.investor = res; this.user = res.user; this.loading = false; },
        error: (err) => console.error(err)
      });
    }
  }

  toggleLike() {
    if (this.liked) return;
    this.matches.request(this.user.id, { investorProfileId: this.investor.id }).subscribe({
      next: (m) => {
        this.match = m;
        this.liked = true;
        if (m.status === 'PENDING') {
          this.snack.openFromComponent(SnackMatchComponent, {
            data: { message: 'Match request sent. Waiting for investor to accept.' },
            duration: 3200,
            panelClass: ['snack-success']
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
        targetName: this.investor?.companyName || this.user.fullName,
        targetAvatar: this.user.avatarUrl
      },
      disableClose: true,
      autoFocus: false,
      panelClass: 'chat-dialog-panel',
      width: '760px'
    });
  }

  goBack() { this.router.navigate(['/dashboard']); }
}
