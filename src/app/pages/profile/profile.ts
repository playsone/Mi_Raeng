import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router'; // 👈 เพิ่มเข้ามา

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile {

  constructor(private router: Router) {} // 👈 inject Router

  isEditing = false;
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';

  userData = {
    fullName: 'สมศรี รักดี',
    phone: '081-234-5678',
    password: 'password123',
    age: 28,
    gender: 'หญิง'
  };
  
  goBack(): void {
    history.back();
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    console.log('ข้อมูลที่บันทึก:', this.userData);
    this.isEditing = false;
  }
  
  togglePasswordVisibility(): void {
    if (this.passwordFieldType === 'password') {
      this.passwordFieldType = 'text';
      this.passwordIcon = 'visibility_off';
    } else {
      this.passwordFieldType = 'password';
      this.passwordIcon = 'visibility';
    }
  }

  logout(): void {
    // ล้างข้อมูล session/token
    localStorage.clear();

    // ไปหน้า welcome
    this.router.navigate(['/welcome']);
  }
}
