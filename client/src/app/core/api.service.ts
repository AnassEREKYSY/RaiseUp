import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  Analytics, Conversation, InvestorCard, InvestorDetail, Me, Message, Notification, Paged, PipelineItem, PipelineStage,
  Project, StartupCard, StartupDetail, Thread,
} from './models';

const params = (o: Record<string, unknown>) =>
  new HttpParams({ fromObject: Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Record<string, string> });

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private b = environment.apiUrl;

  // Profile
  me() { return this.http.get<{ user: Me }>(`${this.b}/me`); }
  updateMe(body: { fullName?: string; avatarUrl?: string | null }) { return this.http.patch<{ user: Me }>(`${this.b}/me`, body); }
  saveProfile(body: Record<string, unknown>) { return this.http.put<{ user: Me }>(`${this.b}/me/profile`, body); }
  addProject(body: Partial<Project>) { return this.http.post<Project>(`${this.b}/me/projects`, body); }
  updateProject(id: string, body: Partial<Project>) { return this.http.put<Project>(`${this.b}/me/projects/${id}`, body); }
  deleteProject(id: string) { return this.http.delete(`${this.b}/me/projects/${id}`); }

  // Directory
  startups(f: Record<string, unknown>) { return this.http.get<Paged<StartupCard>>(`${this.b}/startups`, { params: params(f) }); }
  startup(id: string) { return this.http.get<StartupDetail>(`${this.b}/startups/${id}`); }
  investors(f: Record<string, unknown>) { return this.http.get<Paged<InvestorCard>>(`${this.b}/investors`, { params: params(f) }); }
  investor(id: string) { return this.http.get<InvestorDetail>(`${this.b}/investors/${id}`); }
  recommendations(limit = 6) {
    return this.http.get<{ kind: 'startups' | 'investors' | 'none'; items: (StartupCard | InvestorCard)[] }>(`${this.b}/recommendations`, { params: { limit } });
  }

  // Connections and inbox
  connections(status?: string) { return this.http.get<{ items: Conversation[] }>(`${this.b}/connections`, { params: params({ status }) }); }
  unread() { return this.http.get<{ count: number }>(`${this.b}/connections/unread`); }
  connect(userId: string, message?: string) { return this.http.post<{ id: string; status: string }>(`${this.b}/connections`, { userId, message }); }
  accept(id: string) { return this.http.patch(`${this.b}/connections/${id}/accept`, {}); }
  decline(id: string) { return this.http.patch(`${this.b}/connections/${id}/decline`, {}); }
  thread(id: string) { return this.http.get<Thread>(`${this.b}/connections/${id}`); }
  markRead(id: string) { return this.http.post(`${this.b}/connections/${id}/read`, {}); }
  send(id: string, content: string) { return this.http.post<Message>(`${this.b}/connections/${id}/messages`, { content }); }
  proposeMeeting(id: string, slots: string[], note?: string) { return this.http.post<Message>(`${this.b}/connections/${id}/meetings`, { slots, note }); }
  answerMeeting(id: string, messageId: string, action: 'accept' | 'decline', slot?: string) {
    return this.http.patch<Message>(`${this.b}/connections/${id}/meetings/${messageId}`, { action, slot });
  }

  // Notifications
  notifications() { return this.http.get<{ items: Notification[]; unread: number }>(`${this.b}/notifications`); }
  readAll() { return this.http.patch(`${this.b}/notifications/read-all`, {}); }
  readOne(id: string) { return this.http.patch(`${this.b}/notifications/${id}/read`, {}); }

  // Pipeline
  pipeline() { return this.http.get<{ stages: PipelineStage[]; items: PipelineItem[] }>(`${this.b}/pipeline`); }
  savePipeline(startupId: string, body: { stage?: PipelineStage; notes?: string | null; position?: number }) {
    return this.http.put<{ id: string; stage: PipelineStage }>(`${this.b}/pipeline/${startupId}`, body);
  }
  removePipeline(startupId: string) { return this.http.delete(`${this.b}/pipeline/${startupId}`); }

  analytics() { return this.http.get<Analytics>(`${this.b}/analytics`); }
}
