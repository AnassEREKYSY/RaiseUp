import { Component } from '@angular/core';
import { InvestorCardComponent } from "../investor-card/investor-card.component";
import { InvestorsService } from '../../services/investors.service';
import { InvestorProfile } from '../../core/models/investor.model';
import { User } from '../../core/models/user.model';
import { StartupCardComponent } from "../startup-card/startup-card.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-investor-list',
  imports: [InvestorCardComponent, CommonModule],
  templateUrl: './investor-list.component.html',
  styleUrl: './investor-list.component.scss'
})
export class InvestorListComponent {
  investors: { user: User; profile: InvestorProfile }[] = [];
  loading = true;

  constructor(private investorService: InvestorsService) {}

  ngOnInit() {
    this.investorService.getAll().subscribe({
      next: (res: any[]) => {
        this.investors = res.map(item => ({
          user: item.user,
          profile: item
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load investors', err);
        this.loading = false;
      }
    });
  }
}
