import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParcoursPage } from './parcours.page';

describe('ParcoursPage', () => {
  let component: ParcoursPage;
  let fixture: ComponentFixture<ParcoursPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ParcoursPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
