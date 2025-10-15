import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { InvestorCardComponent } from "../investor-card/investor-card.component";
import { InvestorsService } from '../../services/investors.service';
import { InvestorProfile } from '../../core/models/investor.model';
import { User } from '../../core/models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-investor-list',
  standalone: true,
  imports: [InvestorCardComponent, CommonModule],
  templateUrl: './investor-list.component.html',
  styleUrl: './investor-list.component.scss'
})
export class InvestorListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('grid', { static: true }) gridRef!: ElementRef<HTMLDivElement>;
  @ViewChild('sentinel', { static: true }) sentinelRef!: ElementRef<HTMLDivElement>;

  private io?: IntersectionObserver;

  allInvestors: { user: User; profile: InvestorProfile }[] = [];
  visible: { user: User; profile: InvestorProfile }[] = [];

  initialRows = 2;
  cardMinWidth = 240;
  pageSize = 8;

  loadingInitial = true;
  loadingMore = false;

  skeletonInitialCount = 8;
  skeletonMoreCount = 8;
  skeletonInitial: any[] = [];
  skeletonMore: any[] = [];

  constructor(private investorService: InvestorsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const cols = Math.max(1, Math.floor((window.innerWidth - 60) / this.cardMinWidth));
    this.pageSize = cols;
    this.skeletonInitialCount = cols * this.initialRows;
    this.skeletonMoreCount = this.pageSize;
    this.skeletonInitial = Array.from({ length: this.skeletonInitialCount });
    this.skeletonMore = Array.from({ length: this.skeletonMoreCount });
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      const gridWidth = this.gridRef?.nativeElement?.clientWidth || window.innerWidth;
      const cols = Math.max(1, Math.floor(gridWidth / this.cardMinWidth));
      this.pageSize = cols;
      this.skeletonInitialCount = cols * this.initialRows;
      this.skeletonMoreCount = this.pageSize;
      this.skeletonInitial = Array.from({ length: this.skeletonInitialCount });
      this.skeletonMore = Array.from({ length: this.skeletonMoreCount });
      this.cdr.detectChanges();
    });

    this.investorService.getAll().subscribe({
      next: (res: any[]) => {
        this.allInvestors = res.map(item => ({ user: item.user, profile: item }));
        this.loadingInitial = false;
        this.appendNext(this.skeletonInitialCount);
        this.setupObserver();
      },
      error: () => { this.loadingInitial = false; }
    });
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
    if (already >= this.allInvestors.length) return;

    this.loadingMore = true;
    const nextSlice = this.allInvestors.slice(already, already + count);
    setTimeout(() => {
      this.visible = this.visible.concat(nextSlice);
      this.loadingMore = false;
      this.cdr.detectChanges();
    }, 350);
  }

  trackById = (_: number, it: { user: User; profile: InvestorProfile }) => it.profile.id;
  trackByIndex = (i: number) => i;

  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}
