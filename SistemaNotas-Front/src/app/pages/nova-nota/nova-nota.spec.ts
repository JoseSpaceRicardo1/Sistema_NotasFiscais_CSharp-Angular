import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaNota } from './nova-nota';

describe('NovaNota', () => {
  let component: NovaNota;
  let fixture: ComponentFixture<NovaNota>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovaNota],
    }).compileComponents();

    fixture = TestBed.createComponent(NovaNota);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
