import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StartupsService } from '../../services/startups.service';
import { MatIconModule } from '@angular/material/icon';
import { StartupProfile } from '../../core/models/startup.model';
import { User } from '../../core/models/user.model';
import { ChatDialogComponent } from '../chat-dialog/chat-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-startup-details',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './startup-details.component.html',
  styleUrls: ['./startup-details.component.scss']
})
export class StartupDetailsComponent implements OnInit {
  startup!: StartupProfile;
  user!: User;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private startupsService: StartupsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.startupsService.getById(id).subscribe({
        next: (res) => {
          this.startup = res;
          this.user = res.user;
          this.loading = false;
        },
        error: (err) => console.error(err)
      });
    }
  }

  openChat() {
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

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
