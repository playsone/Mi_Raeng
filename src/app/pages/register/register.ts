import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  
  // --- Inject Services ---
  private router = inject(Router);
  private apiService = inject(ApiService);

  // --- Form Data Model ---
  registerData = {
    name: '',
    phone: '',
    age: null,
    gender: ''
  };

  // --- UI State ---
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // --- ลบส่วนของรหัสผ่านออกไปแล้ว ---
  // passwordFieldType, passwordIcon, confirmPasswordFieldType, confirmPasswordIcon ถูกลบออกไป

  goBack(): void {
    history.back();
  }

  // --- Main Register Function ---
  onRegister(): void {
    // เพิ่มการตรวจสอบเบื้องต้น
    if (!this.registerData.name || !this.registerData.phone) {
      this.errorMessage = 'กรุณากรอกชื่อและเบอร์โทรศัพท์';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // payload ที่จะส่งไปถูกต้องอยู่แล้ว
    const payload = {
      name: this.registerData.name,
      phone: this.registerData.phone,
      age: this.registerData.age,
      gender: this.registerData.gender
    };

    this.apiService.register(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'สมัครสมาชิกสำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...';
        console.log('Registration successful', response);
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
        }
        console.error('Registration failed', err);
      }
    });
  }

  // --- ลบฟังก์ชันที่เกี่ยวกับรหัสผ่านออกไปแล้ว ---
  // togglePasswordVisibility และ toggleConfirmPasswordVisibility ถูกลบออกไป
}