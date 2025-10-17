import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OnboardingService } from '../../services/onboarding.service';
import { Industry } from '../../core/enums/industry.enum';
import { Stage } from '../../core/enums/stage.enum';
import { Role } from '../../core/enums/role.enum';


@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  currentStep = 1;
  totalSteps = 3;

  form!: FormGroup;
  role!: Role;

  industries = Object.values(Industry);
  stages = Object.values(Stage);

  ddOpen: Record<string, boolean> = {
    industries: false,
    stagePreference: false,
    industry: false,
    stage: false
  };

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private onboardingService: OnboardingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = (this.auth.getUserRole() as Role) || 'STARTUP';
    this.initForm();
  }

  private requiredForInvestor() {
    return this.role === 'INVESTOR'
      ? {
          companyName: ['', Validators.required],
          website: [''],
          location: [''],
          investmentRange: [''],
          industries: [[] as Industry[]],
          stagePreference: [[] as Stage[]],
          bio: ['']
        }
      : {};
  }

  private requiredForStartup() {
    return this.role === 'STARTUP'
      ? {
          companyName: ['', Validators.required],
          website: [''],
          country: [''],
          teamSize: [null],
          description: [''],
          industry: ['' as any, Validators.required],
          stage: ['' as any, Validators.required],
          fundingNeeded: [null],
          traction: [''],
          pitchDeckUrl: ['']
        }
      : {};
  }

  initForm() {
    this.form = this.fb.group({
      ...this.requiredForInvestor(),
      ...this.requiredForStartup()
    });
  }

  nextStep() { if (this.currentStep < this.totalSteps) this.currentStep++; }
  prevStep() { if (this.currentStep > 1) this.currentStep--; }

  toggleDd(key: keyof typeof this.ddOpen) { this.ddOpen[key] = !this.ddOpen[key]; }
  closeAllDd() { Object.keys(this.ddOpen).forEach(k => this.ddOpen[k] = false); }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const el = ev.target as HTMLElement;
    if (!el.closest('.dd')) this.closeAllDd();
  }

  isSelectedArr(ctrl: 'industries'|'stagePreference', value: string): boolean {
    const arr = (this.form.get(ctrl)?.value as string[]) || [];
    return arr.includes(value);
  }
  toggleOptionArr(ctrl: 'industries'|'stagePreference', value: string) {
    const current = new Set((this.form.get(ctrl)?.value as string[]) || []);
    current.has(value) ? current.delete(value) : current.add(value);
    this.form.get(ctrl)?.setValue(Array.from(current));
  }
  removeChip(ctrl: 'industries'|'stagePreference', value: string) {
    this.toggleOptionArr(ctrl, value);
  }

  setSingle(ctrl: 'industry'|'stage', value: string) {
    this.form.get(ctrl)?.setValue(value);
    this.closeAllDd();
  }

  get industriesVal(): string[] {
    return (this.form.get('industries')?.value as string[]) || [];
  }
  get stagePrefVal(): string[] {
    return (this.form.get('stagePreference')?.value as string[]) || [];
  }
  get industryVal(): string | null {
    return (this.form.get('industry')?.value as string) || null;
  }
  get stageVal(): string | null {
    return (this.form.get('stage')?.value as string) || null;
  }

  get stepTitle(): string {
    if (this.role === 'INVESTOR') {
      return ['Company details', 'Investment preferences', 'About you'][this.currentStep - 1];
    }
    return ['Company basics', 'Product & funding', 'Traction & deck'][this.currentStep - 1];
  }

  submit() {
    if (this.form.invalid) return;

    const user = this.auth.currentUser;
    const payload = { ...this.form.value, userId: user.id };

    const after = () => {
      user.hasProfile = true;
      localStorage.setItem('user', JSON.stringify(user));
      this.router.navigate(['/dashboard']);
    };

    if (this.role === 'STARTUP') {
      this.onboardingService.createStartupProfile(payload).subscribe({ next: after, error: console.error });
    } else {
      this.onboardingService.createInvestorProfile(payload).subscribe({ next: after, error: console.error });
    }
  }
}
