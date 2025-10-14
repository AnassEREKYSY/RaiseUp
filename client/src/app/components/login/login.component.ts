import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loading = false;
  errorMsg = '';
  showPassword = false;
  form!: FormGroup;
  private submitted = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  showError(controlName: 'email' | 'password'): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.submitted);
  }

  onSubmit() {
    this.submitted = true;
    this.errorMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.auth.login(this.form.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const user = res.user;
          if (!user?.hasProfile) {
            this.router.navigate(['/onboarding']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          const status = err?.status;
          const serverMsg = err?.error?.error || err?.error?.message;

          if (status === 0) {
            this.errorMsg = 'Network error. Please check your connection and try again.';
          } else if (status === 400) {
            this.errorMsg = serverMsg || 'Invalid request. Please verify your inputs.';
          } else if (status === 401 || status === 403) {
            this.errorMsg = serverMsg || 'Invalid email or password.';
          } else if (status === 429) {
            this.errorMsg = 'Too many attempts. Please wait a moment and try again.';
          } else if (status >= 500) {
            this.errorMsg = 'Server error. Please try again later.';
          } else {
            this.errorMsg = serverMsg || 'Something went wrong. Please try again.';
          }
        }
      });
  }
}
