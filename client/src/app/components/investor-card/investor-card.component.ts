import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../core/models/user.model';
import { InvestorProfile } from '../../core/models/investor.model';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ChatDialogComponent } from '../chat-dialog/chat-dialog.component';

@Component({
  selector: 'app-investor-card',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './investor-card.component.html',
  styleUrls: ['./investor-card.component.scss']
})
export class InvestorCardComponent {
  @Input() user!: User;
  @Input() profile!: InvestorProfile;
  liked = false;

  constructor(private router: Router, private dialog: MatDialog) {}

  toggleLike() {
    this.liked = !this.liked;
  }

  openDetails() {
    this.router.navigate(['/investors', this.profile.id]);
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
