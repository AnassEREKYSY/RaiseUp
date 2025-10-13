import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../core/models/user.model';
import { StartupProfile } from '../../core/models/startup.model';
import { Router } from '@angular/router';
import { ChatDialogComponent } from '../chat-dialog/chat-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-startup-card',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './startup-card.component.html',
  styleUrls: ['./startup-card.component.scss']
})
export class StartupCardComponent {
  @Input() user!: User;
  @Input() profile!: StartupProfile;
  liked = false;

  constructor(private router: Router,private dialog: MatDialog) {}

  toggleLike() {
    this.liked = !this.liked;
  }

  openDetails() {
    this.router.navigate(['/startups', this.profile.id]);
  }

  openChat() {
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
