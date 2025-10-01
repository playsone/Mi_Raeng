import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

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

  // --- Inject Services ---
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  // --- Form Data ---
  phoneNumber: string = '';
  
  // --- UI State ---
  errorMessage: string = '';
  isLoading: boolean = false; // ✨ เพิ่ม isLoading เข้ามา

  goBack(): void {
    history.back();
  }
  
  // --- Main Login Function ---
  login() {
    if (!this.phoneNumber) {
      this.errorMessage = 'กรุณากรอกเบอร์โทรศัพท์';
      return;
    }
    
    this.isLoading = true; // ✨ เริ่ม loading
    this.errorMessage = ''; // เคลียร์ error เก่า

    const credentials = {
      phone: this.phoneNumber,
    };
    
    this.apiService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false; // ✨ หยุด loading
        console.log('Login successful!', response);
        
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.role);
        
        if (response.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isLoading = false; // ✨ หยุด loading
        console.error('Login failed', err);

        // ✨ แก้ไขการแสดง Error Message ให้ดีขึ้น ✨
        if (err.error && err.error.error) {
          // แสดงข้อความ error ที่ส่งมาจาก Backend โดยตรง
          // เช่น "Phone number not found"
          this.errorMessage = err.error.error;
        } else {
          // ข้อความสำรองกรณีที่ไม่มี error message จาก backend
          this.errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
        }
      }
    });
  }
}