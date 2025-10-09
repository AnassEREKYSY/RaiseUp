import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../core/models/user.model';
import { InvestorProfile } from '../../core/models/investor.model';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  toggleLike() {
    this.liked = !this.liked;
  }

  openDetails() {
    this.router.navigate(['/investors', this.profile.id]);
  }

  openChat() {
    this.router.navigate(['/messages'], {
      queryParams: { userId: this.user.id }
    });
  }
}
