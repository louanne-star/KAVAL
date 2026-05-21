import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-inventaire',
  templateUrl: './inventaire.page.html',
  styleUrls: ['./inventaire.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class InventairePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
