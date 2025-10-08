import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../core/models/user.model';
import { StartupProfile } from '../../core/models/startup.model';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  toggleLike() {
    this.liked = !this.liked;
  }

  openDetails() {
    this.router.navigate(['/startups', this.profile.id]);
  }
}
