import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartupListComponent } from './startup-list.component';

describe('StartupListComponent', () => {
  let component: StartupListComponent;
  let fixture: ComponentFixture<StartupListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartupListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
