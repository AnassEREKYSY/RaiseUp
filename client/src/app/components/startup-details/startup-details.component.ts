import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StartupsService } from '../../services/startups.service';
import { MatIconModule } from '@angular/material/icon';
import { StartupProfile } from '../../core/models/startup.model';
import { User } from '../../core/models/user.model';
import { ChatDialogComponent } from '../chat-dialog/chat-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatchesService } from '../../services/match.service';
import { MatchDto } from '../../core/dtos/match.dto';
import { SnackMatchComponent } from '../snack-match/snack-match.component';

@Component({
  selector: 'app-startup-details',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './startup-details.component.html',
  styleUrls: ['./startup-details.component.scss']
})
export class StartupDetailsComponent implements OnInit {
  startup!: StartupProfile;
  user!: User;
  loading = true;

  liked = false;
  match?: MatchDto;

  constructor(
    private route: ActivatedRoute,
    private startupsService: StartupsService,
    private router: Router,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private matches: MatchesService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.startupsService.getById(id).subscribe({
        next: (res) => { this.startup = res; this.user = res.user; this.loading = false; },
        error: (err) => console.error(err)
      });
    }
  }

  toggleLike() {
    if (this.liked) return;
    this.matches.request(this.user.id).subscribe({
      next: (m) => {
        this.match = m;
        this.liked = true;
        if (m.status === 'PENDING') {
          this.snack.openFromComponent(SnackMatchComponent, {
            data: { message: 'Match request sent. Waiting for startup to accept.' },
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
        targetName: this.startup?.companyName || this.user.fullName,
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
