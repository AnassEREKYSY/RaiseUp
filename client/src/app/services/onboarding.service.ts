import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  createStartupProfile(data: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
    return this.http.post(`${this.api}/startups/create`, data, { headers });
  }

  createInvestorProfile(data: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
    return this.http.post(`${this.api}/investors/create`, data, { headers });
  }
}
