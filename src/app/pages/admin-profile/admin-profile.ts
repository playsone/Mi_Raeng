import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { ApiService } from '../../services/api';
import { UserProfile } from '../../model/api.model';
import { MatIconModule } from '@angular/material/icon'; // เพิ่มกลับมาเพื่อรองรับ Material Icons

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

  // --- UI State (Read-Only Mode) ---
  isLoading = true;
  errorMessage = '';
  successMessage = ''; // ยังคงไว้เพื่อรองรับ HTML แม้จะไม่มีฟังก์ชัน saveChanges()

  // --- Data Models ---
  userProfile: UserProfile | null = null;
  
  ngOnInit(): void {
    // 1. ดึงข้อมูลโปรไฟล์ของ Admin เมื่อหน้าถูกโหลด
    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.isLoading = false;
        // Mock success message for display
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

  // กลับไปหน้าเดิม (Go Back)
  goBack(): void {
    history.back();
  }
  
  // --- Logout Function (ใหม่) ---
  logout(): void {
    localStorage.removeItem('authToken'); // ลบ token การยืนยันตัวตน
    this.router.navigate(['/welcome']); // นำทางไปยังหน้าเริ่มต้น
  }
}
