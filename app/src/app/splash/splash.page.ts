import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SplashPage implements OnInit {

  visible = false;

  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => this.visible = true, 100);
    setTimeout(() => this.router.navigate(['/tabs/carte']), 3000);
  }
}