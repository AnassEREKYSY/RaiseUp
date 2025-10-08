import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl + '/auth';
  constructor(private http: HttpClient) {}

  register(data: any): Observable<any> {
    return this.http.post(`${this.base}/register`, data);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.base}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  get currentUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getUserRole(): 'INVESTOR' | 'STARTUP' | null {
    const user = this.currentUser;
    return user?.role || null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

}
