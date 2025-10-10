import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../core/models/user.model';
import { StartupProfile } from '../core/models/startup.model';

@Injectable({
  providedIn: 'root'
})
export class StartupsService {
  private base = environment.apiUrl + '/startups';
  constructor(private http: HttpClient) {}

  getAll(): Observable<{ user: User; projects?: any[] } & StartupProfile[]> {
    return this.http.get<{ user: User; projects?: any[] } & StartupProfile[]>(`${this.base}/all`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/one/${id}`);
  }

  search(params: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/search`, { params });
  }

  update(id: string, data: any) {
    return this.http.put(`${this.base}/update/${id}`, data);
  }
}
