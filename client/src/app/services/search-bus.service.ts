import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SearchBusService {
  private q$ = new BehaviorSubject<string>('');

  set(query: string) {
    this.q$.next((query || '').trim());
  }

  observe(): Observable<string> {
    return this.q$.asObservable().pipe(
      map(q => q.trim().toLowerCase()),
      distinctUntilChanged()
    );
  }

  get value(): string {
    return this.q$.value;
  }
}
