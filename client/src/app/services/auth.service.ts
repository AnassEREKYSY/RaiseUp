import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Role } from '../core/enums/role.enum';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl + '/auth';

  private readySubject = new BehaviorSubject<boolean>(false);
  ready$ = this.readySubject.asObservable();

  private token: string | null = null;
  private user: any | null = null;

  constructor(private http: HttpClient) {
    this.hydrate();
  }

  private hydrate() {
    this.token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    this.user = raw ? JSON.parse(raw) : null;
    this.readySubject.next(true);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.base}/register`, data);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.base}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.token) {
          this.token = res.token;
          this.user = res.user || null;
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.readySubject.next(true);
        }
      })
    );
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.readySubject.next(true);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get currentUser() {
    return this.user;
  }

  getUserRole(): Role | null {
    return this.user?.role || null;
  }

  getToken(): string | null {
    return this.token;
  }
}
