import { Component, inject } from '@angular/core'; // ✨ 1. เพิ่ม inject
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; // ✨ 2. Import ApiService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {

  // ✨ 3. ใช้ inject service เข้ามา (วิธีใหม่ของ Angular)
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  // Properties สำหรับ form
  phoneNumber: string = '';
  passwordValue: string = '';
  errorMessage: string = ''; // ✨ 4. เพิ่ม property สำหรับเก็บข้อความ error

  // ไม่ต้องแก้ไขส่วนนี้
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';

  goBack(): void {
    history.back();
  }
  
  // ✨ 5. เขียนฟังก์ชัน login ใหม่ทั้งหมด
  login() {
    // ป้องกันการกดซ้ำซ้อน
    if (!this.phoneNumber || !this.passwordValue) {
      this.errorMessage = 'กรุณากรอกเบอร์โทรและรหัสผ่าน';
      return;
    }
    
    // สร้าง object ที่จะส่งไปให้ backend
    const credentials = {
      phone: this.phoneNumber,
      password: this.passwordValue
    };
    
    // เรียกใช้ login method จาก ApiService
    this.apiService.login(credentials).subscribe({
      next: (response) => {
        // --- สำเร็จ ---
        console.log('Login successful!', response);
        // เก็บ Token ไว้ใน Local Storage เพื่อใช้ยืนยันตัวตนครั้งต่อไป
        localStorage.setItem('authToken', response.token);
        // นำทางไปยังหน้า home
        this.router.navigate(['/home']);
      },
      error: (err) => {
        // --- ไม่สำเร็จ ---
        console.error('Login failed', err);
        this.errorMessage = 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง';
      }
    });
  }
}