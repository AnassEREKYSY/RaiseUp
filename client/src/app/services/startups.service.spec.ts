import { TestBed } from '@angular/core/testing';

import { StartupsService } from './startups.service';

describe('StartupsService', () => {
  let service: StartupsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StartupsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
