import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnackMatchComponent } from './snack-match.component';

describe('SnackMatchComponent', () => {
  let component: SnackMatchComponent;
  let fixture: ComponentFixture<SnackMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnackMatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnackMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
