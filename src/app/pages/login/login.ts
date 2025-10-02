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
  isLoading: boolean = false; 
  
  // 🔑 คีย์สำหรับเก็บวันห่างหาย (ต้องตรงกับที่ใช้ใน home.ts)
  private readonly DAYS_LAPSED_KEY = 'daysLapsed'; 

  goBack(): void {
    history.back();
  }
  
  // --- Main Login Function ---
  login() {
    if (!this.phoneNumber) {
      this.errorMessage = 'กรุณากรอกเบอร์โทรศัพท์';
      return;
    }
    
    this.isLoading = true; 
    this.errorMessage = ''; 

    const credentials = {
      phone: this.phoneNumber,
    };
    
    this.apiService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false; 
        console.log('Login successful!', response);
        
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.role);
        
        // 🔥 สำคัญ: บันทึก days_since_last_login ลงใน localStorage
        // เพื่อให้ Home Component ดึงไปใช้ในการแสดง Popup ต้อนรับ
        if (response.days_since_last_login !== undefined && response.days_since_last_login !== null) {
             localStorage.setItem(this.DAYS_LAPSED_KEY, response.days_since_last_login.toString());
        }

        if (response.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isLoading = false; 
        console.error('Login failed', err);

        if (err.error && err.error.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
        }
      }
    });
  }
}