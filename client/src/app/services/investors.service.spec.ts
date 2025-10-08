import { TestBed } from '@angular/core/testing';

import { InvestorsService } from './investors.service';

describe('InvestorsService', () => {
  let service: InvestorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvestorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
