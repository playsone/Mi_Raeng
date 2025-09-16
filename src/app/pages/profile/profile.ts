import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { UserProfile } from '../../model/api.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {

  // --- Inject Services ---
  private router = inject(Router);
  private apiService = inject(ApiService);

  // --- UI State ---
  isEditing = false;
  isLoading = true;
  successMessage = '';
  errorMessage = '';
  
  // --- Data Models ---
  userProfile: UserProfile | null = null; // สำหรับแสดงผล (ข้อมูลจริง)
  editData: any = {}; // สำหรับเก็บข้อมูลในฟอร์มแก้ไข

  // --- Password Visibility ---
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';
  
  ngOnInit(): void {
    // 1. ดึงข้อมูลโปรไฟล์เมื่อหน้าถูกโหลด
    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.errorMessage = 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้';
        this.isLoading = false;
      }
    });
  }
  
  goBack(): void {
    history.back();
  }

  // 2. เมื่อกด "แก้ไข" ให้คัดลอกข้อมูลปัจจุบันไปที่ฟอร์ม
  toggleEdit(): void {
    if (this.userProfile) {
      // คัดลอกข้อมูลจาก userProfile ไปยัง editData เพื่อแก้ไข
      // และตั้งค่ารหัสผ่านเป็นค่าว่าง รอรับข้อมูลใหม่
      this.editData = { ...this.userProfile, password: '' };
    }
    this.isEditing = !this.isEditing;
    this.errorMessage = ''; // ล้างข้อความ error เก่า
  }

  // 3. เมื่อกด "บันทึก"
  saveChanges(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // สร้าง payload ที่จะส่งไป (ไม่ต้องส่ง phone เพราะ backend ไม่ได้ให้แก้)
    const payload = {
        name: this.editData.name,
        phone: this.editData.phone,
        password: this.editData.password,
        age: this.editData.age,
        gender: this.editData.gender
    };

    this.apiService.updateMyProfile(payload).subscribe({
      next: (response) => {
        // อัปเดตข้อมูลที่แสดงผลให้ตรงกับที่แก้ไขไป
        this.userProfile = { ...this.userProfile!, ...this.editData };
        this.isEditing = false; // กลับไปโหมดแสดงผล
        this.isLoading = false;
        this.successMessage = 'บันทึกข้อมูลสำเร็จ!';
        // ทำให้ข้อความหายไปใน 3 วินาที
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Failed to save profile', err);
        this.errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        this.isLoading = false;
      }
    });
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
    localStorage.removeItem('authToken'); // ลบแค่ token
    this.router.navigate(['/welcome']);
  }
}