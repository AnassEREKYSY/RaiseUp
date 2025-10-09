import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class InvestorsService {
    private base = environment.apiUrl + '/investors';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/all`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/one/${id}`);
  }

  search(params: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/search`, { params });
  }
}
