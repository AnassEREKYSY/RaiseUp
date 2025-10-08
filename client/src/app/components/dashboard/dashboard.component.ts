import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { InvestorListComponent } from '../investor-list/investor-list.component';
import { StartupListComponent } from '../startup-list/startup-list.component';
import { Role } from '../../core/enums/role.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    InvestorListComponent,
    StartupListComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  Role = Role;
  role: Role | null = null;

  constructor(private authService: AuthService) {}
  ngOnInit() {
    this.role = this.authService.getUserRole() as Role;
  }
}
