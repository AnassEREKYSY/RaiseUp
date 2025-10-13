import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { InvestorsService } from '../../services/investors.service';
import { InvestorProfile } from '../../core/models/investor.model';
import { User } from '../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { ChatDialogComponent } from '../chat-dialog/chat-dialog.component';

@Component({
  selector: 'app-investor-details',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './investor-details.component.html',
  styleUrls: ['./investor-details.component.scss']
})
export class InvestorDetailsComponent implements OnInit {
  investor!: InvestorProfile;
  user!: User;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private investorsService: InvestorsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.investorsService.getById(id).subscribe({
        next: (res) => {
          this.investor = res;
          this.user = res.user;
          this.loading = false;
        },
        error: (err) => console.error(err)
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  openChat() {
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
}
