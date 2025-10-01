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
  errorMessage: string = ''; // ✨ 4. เพิ่ม property สำหรับเก็บข้อความ error

  // ไม่ต้องแก้ไขส่วนนี้

  goBack(): void {
    history.back();
  }
  
  // ✨ 5. เขียนฟังก์ชัน login ใหม่ทั้งหมด
  login() {
    // ป้องกันการกดซ้ำซ้อน
    if (!this.phoneNumber ){
      this.errorMessage = 'กรุณากรอกเบอร์โทร';
      return;
    }
    
    // สร้าง object ที่จะส่งไปให้ backend
    const credentials = {
      phone: this.phoneNumber,
    };
    
    // เรียกใช้ login method จาก ApiService
   this.apiService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful!', response);
        
        // เก็บ Token และ Role
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.role); // ✨ เก็บ Role
        
        // ✨ เช็ค Role แล้วเปลี่ยนหน้า
        if (response.role === 'admin') {
          this.router.navigate(['/admin/dashboard']); // ไปหน้าแอดมิน
        } else {
          this.router.navigate(['/home']); // ไปหน้าผู้ใช้ทั่วไป
        }
      },
      error: (err) => {
        // --- ไม่สำเร็จ ---
        console.error('Login failed', err);
        this.errorMessage = 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง';
      }
    });
  }
}