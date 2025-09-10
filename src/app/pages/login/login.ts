import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✨ 1. Import FormsModule

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule,
    FormsModule // ✨ 2. Add FormsModule here
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {

   phoneNumber: string = '';
  passwordValue: string = '';
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';

  constructor(private router: Router) {}

  goBack(): void {
    history.back();
  }

  login() {
    console.log('Login button clicked, navigating...'); // For debugging
    this.router.navigate(['/home']);
  }
}