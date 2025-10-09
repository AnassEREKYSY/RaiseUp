import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { InvestorsService } from '../../services/investors.service';
import { InvestorProfile } from '../../core/models/investor.model';
import { User } from '../../core/models/user.model';

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
    private router: Router
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

  openChat() {
    this.router.navigate(['/messages'], {
      queryParams: { userId: this.user.id }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
