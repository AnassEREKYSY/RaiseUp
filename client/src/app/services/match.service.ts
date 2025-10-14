import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatchDto } from '../core/dtos/match.dto';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  constructor(private http: HttpClient) { }
  private base = environment.apiUrl;

  request(targetUserId: string, opts?: { projectId?: string; investorProfileId?: string }) {
    return this.http.post<MatchDto>(`${this.base}/matches/request`, { targetUserId, ...opts });
  }

  getOne(id: string) {
    return this.http.get<MatchDto>(`${this.base}/matches/one/${id}`);
  }

  accept(matchId: string) {
    return this.http.patch<MatchDto>(`${this.base}/matches/${matchId}/accept`, {});
  }

  reject(matchId: string) {
    return this.http.patch<void>(`${this.base}/matches/${matchId}/reject`, {});
  }

  listAll(): Observable<MatchDto[]> {
    return this.http.get<MatchDto[]>(`${this.base}/matches/all/`);
  }
}
