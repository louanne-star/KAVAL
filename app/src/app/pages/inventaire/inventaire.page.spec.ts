import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventairePage } from './inventaire.page';

describe('InventairePage', () => {
  let component: InventairePage;
  let fixture: ComponentFixture<InventairePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InventairePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
