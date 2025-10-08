import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../core/models/user.model';
import { InvestorProfile } from '../../core/models/investor.model';

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

  toggleLike() {
    this.liked = !this.liked;
  }
}
