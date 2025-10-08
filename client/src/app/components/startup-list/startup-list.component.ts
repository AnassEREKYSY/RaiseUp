import { Component } from '@angular/core';
import { StartupCardComponent } from "../startup-card/startup-card.component";
import { StartupProfile } from '../../core/models/startup.model';
import { User } from '../../core/models/user.model';
import { Role } from '../../core/enums/role.enum';
import { Industry } from '../../core/enums/industry.enum';
import { Stage } from '../../core/enums/stage.enum';
import { StartupsService } from '../../services/startups.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-startup-list',
  imports: [CommonModule,StartupCardComponent],
  templateUrl: './startup-list.component.html',
  styleUrl: './startup-list.component.scss'
})
export class StartupListComponent {
  startups: { user: User; profile: StartupProfile }[] = [];
  loading = true;

  constructor(private startupService: StartupsService) {}

  ngOnInit() {
    this.startupService.getAll().subscribe({
      next: (res: any[]) => {
        this.startups = res.map(item => ({
          user: item.user,
          profile: item
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load startups', err);
        this.loading = false;
      }
    });
  }
}
