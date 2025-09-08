import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Exercise } from './exercise';

describe('Exercise', () => {
  let component: Exercise;
  let fixture: ComponentFixture<Exercise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Exercise]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Exercise);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
