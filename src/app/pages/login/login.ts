import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common'; // ✨ 1. Import CommonModule เข้ามา

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatIconModule, CommonModule], // ✨ 2. เพิ่ม CommonModule ใน imports array
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {

  // ✨ 3. เพิ่ม Property ที่หายไปกลับเข้ามา ✨
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';

  constructor(private router: Router) {}

  // ฟังก์ชันสำหรับปุ่มย้อนกลับ (เผื่อเปลี่ยนจาก onclick มาใช้)
  goBack(): void {
    history.back();
  }

  // ฟังก์ชันสลับการแสดงรหัสผ่าน
  togglePasswordVisibility(): void {
    if (this.passwordFieldType === 'password') {
      this.passwordFieldType = 'text';
      this.passwordIcon = 'visibility_off';
    } else {
      this.passwordFieldType = 'password';
      this.passwordIcon = 'visibility';
    }
  }

  // ฟังก์ชัน login ทำงานถูกต้องแล้ว
  login() {
    console.log('Login successful!');
    this.router.navigate(['/home']);
  }
}

