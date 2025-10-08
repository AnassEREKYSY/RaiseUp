import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser;
  const isLoggedIn = auth.isLoggedIn;
  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  if (!user.hasProfile) {
    router.navigate(['/onboarding']);
    return false;
  }

  return true;
};
