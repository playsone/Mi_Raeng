import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // ✨ Import CommonModule
import { MatIconModule } from '@angular/material/icon'; // ✨ Import MatIconModule
import { ApiService } from '../../services/api';
import { UserProfile } from '../../model/api.model';

@Component({
  selector: 'app-home',
  standalone: true, // ✨ เพิ่ม standalone
  imports: [CommonModule, MatIconModule], // ✨ เพิ่ม imports
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements OnInit {
  
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  // ✨ สร้างตัวแปรเพื่อเก็บข้อมูลผู้ใช้
  userProfile: UserProfile | null = null;

  ngOnInit(): void {
    // ✨ เมื่อ component โหลดเสร็จ ให้ดึงข้อมูลโปรไฟล์
    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        console.log('Profile data loaded:', data);
      },
      error: (err) => {
        console.error('Failed to load profile, logging out.', err);
        this.logout(); // ถ้า token ไม่ถูกต้องหรือไม่เจอ ให้ logout
      }
    });
  }

  // ✨ สร้าง getter สำหรับเลือกรูปโปรไฟล์ตามเพศ
  get profilePictureUrl(): string {
    if (this.userProfile?.gender?.toLowerCase() === 'female') {
      return 'assets/images/profilefm.png'; // รูปผู้หญิง
    }
    return 'assets/images/profilem.png'; // รูปผู้ชาย (หรือค่าเริ่มต้น)
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  // ✨ สร้างฟังก์ชัน Logout
  logout(): void {
    localStorage.removeItem('authToken'); // ลบ token
    this.router.navigate(['/login']);     // กลับไปหน้า login
  }
}