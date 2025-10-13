import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MessageDto } from '../core/dtos/message.dto';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private http = inject(HttpClient);
  private api = 'http://localhost:4000/api';
  private currentMatchId$ = new BehaviorSubject<string | null>(null);

  getOrCreateConversation(targetUserId: string, opts?: { projectId?: string; investorProfileId?: string }) {
    return this.http.post<any>(`${this.api}/matches/get-or-create`, { targetUserId, ...opts }).pipe(
      tap(m => console.log('[get-or-create] =>', m))
    );
  }

  listByMatch(matchId: string): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.api}/messages/bymatch/${matchId}`).pipe(
      tap(list => console.log('[bymatch]', matchId, list)),
      map(list => (Array.isArray(list) ? list : [])),
      map(list => list.sort((a, b) => +new Date(a.createdAt as any) - +new Date(b.createdAt as any)))
    );
  }

  send(matchId: string, content: string) {
    return this.http.post<MessageDto>(`${this.api}/messages/create`, { matchId, content }).pipe(
      tap(sent => console.log('[send] =>', sent))
    );
  }

  setCurrentMatch(matchId: string) {
    this.currentMatchId$.next(matchId);
  }
}
