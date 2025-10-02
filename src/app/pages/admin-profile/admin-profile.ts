import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { ApiService } from '../../services/api';
import { UserProfile } from '../../model/api.model';
import { MatIconModule } from '@angular/material/icon'; 
import { catchError, throwError } from 'rxjs'; // Import for better error handling

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  // เพิ่ม MatIconModule เพื่อใช้ไอคอนใน HTML
  imports: [CommonModule, MatIconModule], 
  templateUrl: './admin-profile.html',
  styleUrls: ['./admin-profile.scss']
})
export class AdminProfile implements OnInit {

  // --- Inject Services ---
  private router = inject(Router);
  private apiService = inject(ApiService);

  // --- UI State ---
  isLoading = true;
  isResetting = false; // สถานะสำหรับปุ่มรีเซ็ต
  errorMessage = '';
  successMessage = ''; 
  showResetConfirmation: boolean = false; // ควบคุมการแสดง Custom Modal

  // --- Data Models ---
  userProfile: UserProfile | null = null;
  
  ngOnInit(): void {
    // 1. ดึงข้อมูลโปรไฟล์ของ Admin เมื่อหน้าถูกโหลด
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.isLoading = false;
        this.successMessage = 'โหลดข้อมูลโปรไฟล์สำเร็จ';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Failed to load admin profile', err);
        this.errorMessage = 'ไม่สามารถโหลดข้อมูลโปรไฟล์แอดมินได้';
        this.isLoading = false;
      }
    });
  }

  // --- Reset Data Logic ---
  resetData(): void {
    // แสดง Custom Modal เพื่อยืนยัน
    this.showResetConfirmation = true;
  }

  confirmReset(): void {
    this.showResetConfirmation = false;
    this.isResetting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // 2. เรียกใช้ API resetAllUserStats()
    this.apiService.resetAllUserStats().pipe(
        catchError(err => {
            // ดักจับข้อผิดพลาดและแสดงใน errorMessage
            this.errorMessage = 'รีเซ็ตข้อมูลล้มเหลว: ' + (err.error?.message || 'โปรดตรวจสอบสิทธิ์การเข้าถึง');
            this.isResetting = false;
            return throwError(() => new Error(err));
        })
    ).subscribe({
        next: (response) => {
            this.successMessage = response.message || 'รีเซ็ตสถิติผู้ใช้ทั้งหมดสำเร็จแล้ว!';
            this.isResetting = false;
            // หลังจากรีเซ็ตสำเร็จ แนะนำให้รีโหลดโปรไฟล์หรือแจ้งให้ผู้ใช้ทราบ
            this.loadProfile(); 
            setTimeout(() => this.successMessage = '', 5000);
        }
    });
  }

  cancelReset(): void {
    this.showResetConfirmation = false;
  }

  // กลับไปหน้าเดิม (Go Back)
  goBack(): void {
    history.back();
  }
  
  // --- Logout Function ---
  logout(): void {
    localStorage.removeItem('authToken'); // ลบ token การยืนยันตัวตน
    this.router.navigate(['/welcome']); // นำทางไปยังหน้าเริ่มต้น
  }
}
