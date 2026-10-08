import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith(environment.apiUrl);
  const r = isApi && auth.token ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } }) : req;
  return next(r).pipe(catchError((e: unknown) => {
    if (e instanceof HttpErrorResponse && e.status === 401 && isApi && auth.token && !req.url.endsWith('/auth/login')) auth.logout();
    return throwError(() => e);
  }));
};

export const errorText = (e: unknown, fallback = 'Something went wrong. Please try again.') =>
  (e instanceof HttpErrorResponse && (e.error?.error as string)) || (e instanceof HttpErrorResponse && e.status === 0 ? 'Cannot reach the server.' : fallback);

/** Signed in, and the profile is complete (otherwise onboarding first). */
export const appGuard: CanActivateFn = (_r, state) => {
  const auth = inject(AuthService), router = inject(Router);
  const u = auth.user();
  if (!u) return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
  if (!u.hasProfile) return router.createUrlTree(['/onboarding']);
  return true;
};
export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  if (!auth.user()) return router.createUrlTree(['/login']);
  return auth.user()!.hasProfile ? router.createUrlTree(['/']) : true;
};
export const guestGuard: CanActivateFn = () => !inject(AuthService).signedIn() || inject(Router).createUrlTree(['/']);
export const investorGuard: CanActivateFn = () => inject(AuthService).isInvestor() || inject(Router).createUrlTree(['/']);
