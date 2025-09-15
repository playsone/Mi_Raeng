import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome',
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome.html',
  styleUrls: ['./welcome.scss']
})
export class Welcome {

}
