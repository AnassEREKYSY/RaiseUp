import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { onboardingGuard } from './guards/onboarding.guard';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'onboarding', component: OnboardingComponent },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [onboardingGuard]
      },
      {
        path: 'startups/:id',
        loadComponent: () =>
          import('./components/startup-details/startup-details.component').then(
            (m) => m.StartupDetailsComponent
          )
      },
      {
        path: 'investors/:id',
        loadComponent: () =>
          import('./components/investor-details/investor-details.component').then(
            (m) => m.InvestorDetailsComponent
          )
      },
      {
        path: 'profile',
        component: ProfileComponent
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
