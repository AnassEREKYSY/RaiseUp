import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  loading = false;
  errorMsg = '';
  successMsg = '';
  showPassword = false;
  form!: FormGroup;
  private submitted = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.form = this.fb.group({
      role: ['STARTUP', Validators.required],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }

  showError(c: 'role'|'fullName'|'email'|'password'): boolean {
    const ctrl = this.form.get(c);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.submitted);
  }

  onSubmit() {
    this.submitted = true;
    this.errorMsg = '';
    this.successMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.auth.register(this.form.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMsg = 'Registration successful! You can now log in.';
          setTimeout(() => this.router.navigate(['/login']), 1200);
        },
        error: (err) => {
          const status = err?.status;
          const serverMsg = err?.error?.error || err?.error?.message;

          if (status === 0) this.errorMsg = 'Network error. Please check your connection.';
          else if (status === 400) this.errorMsg = serverMsg || 'Invalid data. Please verify your inputs.';
          else if (status === 409) this.errorMsg = serverMsg || 'An account with this email already exists.';
          else if (status >= 500) this.errorMsg = 'Server error. Please try again later.';
          else this.errorMsg = serverMsg || 'Registration failed. Please try again.';
        }
      });
  }
}
