import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StartupCardComponent } from "../startup-card/startup-card.component";
import { StartupProfile } from '../../core/models/startup.model';
import { User } from '../../core/models/user.model';
import { StartupsService } from '../../services/startups.service';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { SearchBusService } from '../../services/search-bus.service';

@Component({
  selector: 'app-startup-list',
  standalone: true,
  imports: [CommonModule, StartupCardComponent],
  templateUrl: './startup-list.component.html',
  styleUrl: './startup-list.component.scss'
})
export class StartupListComponent implements AfterViewInit, OnDestroy {
  @ViewChild('grid', { static: true }) gridRef!: ElementRef<HTMLDivElement>;
  @ViewChild('sentinel', { static: true }) sentinelRef!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private io?: IntersectionObserver;
  private sub?: Subscription;


  allStartups: { user: User; profile: StartupProfile }[] = [];
  filtered: { user: User; profile: StartupProfile }[] = [];
  visible: { user: User; profile: StartupProfile }[] = [];

  initialRows = 2;
  cardMinWidth = 240;
  pageSize = 8;

  loadingInitial = true;
  loadingMore = false;

  skeletonInitialCount = 8;
  skeletonMoreCount = 8;
  skeletonInitial: any[] = [];
  skeletonMore: any[] = [];
  trackByIndex = (i: number) => i;

  constructor(
    private startupService: StartupsService,
    private searchBus: SearchBusService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.computePageSizes();
    fromEvent(window, 'resize')
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => this.computePageSizes());

    this.startupService.getAll().subscribe({
      next: (res: any[]) => {
        this.allStartups = res.map(item => ({ user: item.user, profile: item }));
        this.loadingInitial = false;
        this.applyFilter('');
        this.setupObserver();
        this.sub = this.searchBus.observe().subscribe(q => {
          this.applyFilter(q);
        });
      },
      error: () => { this.loadingInitial = false; }
    });
  }

  private computePageSizes(): void {
    const gridEl = this.gridRef?.nativeElement;
    if (!gridEl) return;
    const gridWidth = gridEl.clientWidth || window.innerWidth;
    const cols = Math.max(1, Math.floor(gridWidth / this.cardMinWidth));
    this.pageSize = cols;
    this.skeletonMoreCount = this.pageSize;
    this.skeletonInitialCount = cols * this.initialRows;
    this.skeletonInitial = Array.from({ length: this.skeletonInitialCount });
    this.skeletonMore = Array.from({ length: this.skeletonMoreCount });
    this.cdr.detectChanges();
  }

  private applyFilter(q: string) {
    const query = (q || '').toLowerCase();
    const matches = (it: { user: User; profile: StartupProfile }) => {
      if (!query) return true;
      const { profile, user } = it;
      const hay = [
        user?.fullName,
        user?.email,
        profile?.companyName,
        profile?.description,
        profile?.industry,
        profile?.stage,
        profile?.country,
        profile?.traction,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(query);
    };
    this.filtered = this.allStartups.filter(matches);
    this.visible = [];
    this.appendNext(this.skeletonInitialCount);
  }

  private setupObserver(): void {
    if (!this.sentinelRef) return;
    this.io?.disconnect();
    this.io = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting) this.appendNext(this.pageSize);
    }, { root: null, rootMargin: '600px 0px', threshold: 0 });
    this.io.observe(this.sentinelRef.nativeElement);
  }

  private appendNext(count: number): void {
    if (this.loadingMore) return;
    const already = this.visible.length;
    if (already >= this.filtered.length) return;

    this.loadingMore = true;
    const nextSlice = this.filtered.slice(already, already + count);

    setTimeout(() => {
      this.visible = this.visible.concat(nextSlice);
      this.loadingMore = false;
    }, 350);
  }

  trackById = (_: number, it: { user: User; profile: StartupProfile }) => it.profile.id;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.io?.disconnect();
    this.sub?.unsubscribe();
  }
}
