import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AproposPage } from './apropos.page';

describe('AproposPage', () => {
  let component: AproposPage;
  let fixture: ComponentFixture<AproposPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AproposPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
