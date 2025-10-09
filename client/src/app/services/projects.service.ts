import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../core/models/project.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private baseUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) { }

  createProject(data: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/create`, data);
  }

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/all`);
  }
  
}
