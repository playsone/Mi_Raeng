import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-register',
  standalone: true, // เพิ่ม standalone: true
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
  // สร้าง object เดียวเพื่อรวบรวมข้อมูลจากฟอร์มทั้งหมด
  registerData = {
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    age: null,
    gender: ''
  };

  // --- UI State ---
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // --- Password Visibility ---
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';
  confirmPasswordFieldType: string = 'password';
  confirmPasswordIcon: string = 'visibility';

  goBack(): void {
    history.back();
  }

  // --- Main Register Function ---
  onRegister(): void {
    // Client-side validation
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // สร้าง payload ที่จะส่งไป backend (ตัด confirmPassword ออก)
    const payload = {
      name: this.registerData.name,
      phone: this.registerData.phone,
      password: this.registerData.password,
      age: this.registerData.age,
      gender: this.registerData.gender
    };

    this.apiService.register(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'สมัครสมาชิกสำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...';
        console.log('Registration successful', response);
        // หน่วงเวลาเล็กน้อยเพื่อให้ผู้ใช้เห็นข้อความ
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.error) {
          this.errorMessage = err.error.error; // แสดง error จาก backend เช่น "เบอร์โทรซ้ำ"
        } else {
          this.errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
        }
        console.error('Registration failed', err);
      }
    });
  }

  // --- Password Toggle Functions ---
  togglePasswordVisibility(): void {
    if (this.passwordFieldType === 'password') {
      this.passwordFieldType = 'text';
      this.passwordIcon = 'visibility_off';
    } else {
      this.passwordFieldType = 'password';
      this.passwordIcon = 'visibility';
    }
  }

  toggleConfirmPasswordVisibility(): void {
    if (this.confirmPasswordFieldType === 'password') {
      this.confirmPasswordFieldType = 'text';
      this.confirmPasswordIcon = 'visibility_off';
    } else {
      this.confirmPasswordFieldType = 'password';
      this.confirmPasswordIcon = 'visibility';
    }
  }
}