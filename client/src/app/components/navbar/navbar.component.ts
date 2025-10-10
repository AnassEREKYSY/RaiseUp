import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Output() searchSubmit = new EventEmitter<string>();
  form!: FormGroup;
  hasNewNotifications = true;
  user!: User;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({ q: [''] });
    this.user = this.auth.currentUser;
  }

  onSubmit() {
    const q = this.form.value.q?.trim() || '';
    this.searchSubmit.emit(q);
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

  openNotifications() {
    console.log('Notifications clicked!');
    this.hasNewNotifications = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
