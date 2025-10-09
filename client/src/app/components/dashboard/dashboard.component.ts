import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { InvestorListComponent } from '../investor-list/investor-list.component';
import { StartupListComponent } from '../startup-list/startup-list.component';
import { ProjectModalComponent } from '../project-modal/project-modal.component';
import { Role } from '../../core/enums/role.enum';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, InvestorListComponent, StartupListComponent, ProjectModalComponent, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  Role = Role;
  role: Role | null = null;
  showModal = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.role = this.authService.getUserRole() as Role;
  }

  onProjectCreated() {
    console.log('New project created');
  }
}
