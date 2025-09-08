import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyTree } from './my-tree';

describe('MyTree', () => {
  let component: MyTree;
  let fixture: ComponentFixture<MyTree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTree]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyTree);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
