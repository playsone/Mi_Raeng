import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home {
  constructor(private router: Router) {}

  goTo(route: string) {
    this.router.navigate([route]);
  }
}
