import { Routes } from '@angular/router';
import { appGuard, guestGuard, investorGuard, onboardingGuard } from './core/http';

export const routes: Routes = [
  { path: 'login', title: 'Sign in · RaiseUp', canActivate: [guestGuard], data: { mode: 'login' }, loadComponent: () => import('./pages/auth.page').then(m => m.AuthPage) },
  { path: 'register', title: 'Create account · RaiseUp', canActivate: [guestGuard], data: { mode: 'register' }, loadComponent: () => import('./pages/auth.page').then(m => m.AuthPage) },
  { path: 'onboarding', title: 'Set up your profile · RaiseUp', canActivate: [onboardingGuard], loadComponent: () => import('./pages/onboarding.page').then(m => m.OnboardingPage) },
  {
    path: '',
    canActivate: [appGuard],
    loadComponent: () => import('./shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', title: 'Home · RaiseUp', loadComponent: () => import('./pages/home.page').then(m => m.HomePage) },
      { path: 'discover', title: 'Discover · RaiseUp', loadComponent: () => import('./pages/discover.page').then(m => m.DiscoverPage) },
      { path: 'startups/:id', loadComponent: () => import('./pages/startup.page').then(m => m.StartupPage) },
      { path: 'investors/:id', loadComponent: () => import('./pages/investor.page').then(m => m.InvestorPage) },
      { path: 'inbox', title: 'Inbox · RaiseUp', loadComponent: () => import('./pages/inbox.page').then(m => m.InboxPage) },
      { path: 'inbox/:id', title: 'Inbox · RaiseUp', loadComponent: () => import('./pages/inbox.page').then(m => m.InboxPage) },
      { path: 'pipeline', title: 'Pipeline · RaiseUp', canActivate: [investorGuard], loadComponent: () => import('./pages/pipeline.page').then(m => m.PipelinePage) },
      { path: 'analytics', title: 'Analytics · RaiseUp', loadComponent: () => import('./pages/analytics.page').then(m => m.AnalyticsPage) },
      { path: 'profile', title: 'Your profile · RaiseUp', loadComponent: () => import('./pages/profile.page').then(m => m.ProfilePage) },
      // Old URLs
      { path: 'dashboard', redirectTo: '' },
      { path: '**', title: 'Not found · RaiseUp', loadComponent: () => import('./pages/not-found.page').then(m => m.NotFoundPage) },
    ],
  },
];
