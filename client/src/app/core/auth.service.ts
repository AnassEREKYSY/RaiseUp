import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Me, Role } from './models';

const KEY = 'raiseup_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly user = signal<Me | null>(null);
  readonly signedIn = computed(() => !!this.user());
  readonly isInvestor = computed(() => this.user()?.role === 'INVESTOR');
  private _token: string | null = read();
  get token() { return this._token; }

  restore(): Observable<void> {
    if (!this._token) return of(void 0);
    return this.http.get<{ user: Me }>(`${environment.apiUrl}/auth/me`).pipe(
      tap(r => this.user.set(r.user)), map(() => void 0),
      catchError(() => { this.clear(); return of(void 0); }),
    );
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: Me }>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(tap(r => this.set(r)));
  }
  register(body: { email: string; password: string; fullName: string; role: Role }) {
    return this.http.post<{ token: string; user: Me }>(`${environment.apiUrl}/auth/register`, body).pipe(tap(r => this.set(r)));
  }
  setUser(u: Me) { this.user.set(u); }
  logout() { this.clear(); this.router.navigateByUrl('/login'); }

  private set(r: { token: string; user: Me }) {
    this._token = r.token;
    try { localStorage.setItem(KEY, r.token); } catch { /* ignore */ }
    this.user.set(r.user);
  }
  clear() {
    this._token = null; this.user.set(null);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }
}
function read() { try { return localStorage.getItem(KEY); } catch { return null; } }
