import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { StartupsService } from '../../services/startups.service';
import { InvestorsService } from '../../services/investors.service';
import { StartupProfile } from '../../core/models/startup.model';
import { InvestorProfile } from '../../core/models/investor.model';
import { User } from '../../core/models/user.model';
import { Role } from '../../core/enums/role.enum';
import { Router } from '@angular/router';
import { MatchesService } from '../../services/match.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user!: User;
  role!: Role;

  startupProfile?: StartupProfile;
  investorProfile?: InvestorProfile;

  matchedStartups: StartupProfile[] = [];

  loading = true;
  editMode = false;
  editForm!: FormGroup;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private startupService: StartupsService,
    private investorService: InvestorsService,
    private matches: MatchesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.currentUser;
    if (!this.user) return;

    this.role = this.user.role;
    const profileId = this.user.profileId ?? null;

    if (profileId) {
      this.loadByProfileId(profileId);
    } else {
      this.loadByUserId();
    }

    if (this.role === 'INVESTOR') {
      this.loadInvestorMatches();
    }
  }

  get hasStartupProjects() {
    return this.role === 'STARTUP' && !!this.startupProfile?.projects?.length;
  }

  get hasInvestorMatches() {
    return this.role === 'INVESTOR' && !!this.matchedStartups?.length;
  }

  get fillHeader() {
    return !(this.hasStartupProjects || this.hasInvestorMatches);
  }

  private loadByProfileId(id: string) {
    if (this.role === 'STARTUP') {
      this.startupService.getById(id).subscribe({
        next: (res) => { this.startupProfile = res; this.initForm(); this.loading = false; },
        error: (e) => { console.error(e); this.loadByUserId(); }
      });
    } else {
      this.investorService.getById(id).subscribe({
        next: (res) => { this.investorProfile = res; this.initForm(); this.loading = false; },
        error: (e) => { console.error(e); this.loadByUserId(); }
      });
    }
  }

  private loadByUserId() {
    if (this.role === 'STARTUP') {
      this.startupService.getAll().subscribe({
        next: (list: any) => {
          const found = (list as any[]).find(s => s.userId === this.user.id);
          this.startupProfile = found;
          this.initForm();
          this.loading = false;
        },
        error: console.error
      });
    } else {
      this.investorService.getAll().subscribe({
        next: (list: any[]) => {
          const found = list.find(i => i.userId === this.user.id);
          this.investorProfile = found as InvestorProfile;
          this.initForm();
          this.loading = false;
        },
        error: console.error
      });
    }
  }

  private loadInvestorMatches() {
    this.matches.listAll().subscribe({
      next: (all: any[]) => {
        const mine = all.filter(m => m.investorId === this.user.id && m.status === 'ACCEPTED');
        const ids = Array.from(new Set(mine.map(m => m.startupId)));
        this.startupService.getAll().subscribe({
          next: (list: any[]) => {
            const byId = new Map(list.map((s: StartupProfile) => [s.userId, s]));
            this.matchedStartups = ids.map(id => byId.get(id)).filter(Boolean) as StartupProfile[];
          },
          error: console.error
        });
      },
      error: console.error
    });
  }

  private initForm() {
    if (this.role === 'STARTUP' && this.startupProfile) {
      this.editForm = this.fb.group({
        companyName: [this.startupProfile.companyName, Validators.required],
        website: [this.startupProfile.website || ''],
        country: [this.startupProfile.country || '']
      });
    } else if (this.role === 'INVESTOR' && this.investorProfile) {
      this.editForm = this.fb.group({
        companyName: [this.investorProfile.companyName || '', Validators.required],
        website: [this.investorProfile.website || ''],
        location: [this.investorProfile.location || ''],
        bio: [this.investorProfile.bio || '']
      });
    }
  }

  toggleEdit() { this.editMode = !this.editMode; if (!this.editMode) this.previewUrl = null; }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(file);
  }

  saveChanges() {
    if (this.editForm.invalid) return;
    const data = this.editForm.value;

    if (this.role === 'STARTUP' && this.startupProfile) {
      this.startupService.update(this.startupProfile.id, data).subscribe({
        next: (res) => { this.startupProfile = res as StartupProfile; this.editMode = false; },
        error: console.error
      });
    } else if (this.role === 'INVESTOR' && this.investorProfile) {
      this.investorService.update(this.investorProfile.id, data).subscribe({
        next: (res) => { this.investorProfile = res as InvestorProfile; this.editMode = false; },
        error: console.error
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
