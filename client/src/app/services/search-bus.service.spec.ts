import { TestBed } from '@angular/core/testing';

import { SearchBusService } from './search-bus.service';

describe('SearchBusService', () => {
  let service: SearchBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchBusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
