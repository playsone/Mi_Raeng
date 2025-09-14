import { Component, OnInit, inject } from '@angular/core'; // ✨ 1. เพิ่ม OnInit และ inject
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api'; // ✨ 2. Import ApiService
import { UserProfile } from '../../model/api.model';   // ✨ 3. Import UserProfile model

@Component({
  selector: 'app-exercise',
  standalone: true, // ✨ 4. เพิ่ม standalone: true
  imports: [CommonModule],
  templateUrl: './exercise.html',
  styleUrls: ['./exercise.scss']
})
export class Exercise implements OnInit { // ✨ 5. Implement OnInit

  // --- Inject Services ---
  private router = inject(Router);
  private apiService = inject(ApiService);

  // ✨ 6. สร้างตัวแปรสำหรับเก็บข้อมูลผู้ใช้
  userProfile: UserProfile | null = null;
  isLoading = true;

  ngOnInit(): void {
    // ✨ 7. เมื่อหน้าโหลดเสร็จ ให้ดึงข้อมูลโปรไฟล์
    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.isLoading = false;
        // หากโหลดไม่สำเร็จ อาจจะกลับไปหน้า login
        this.router.navigate(['/login']);
      }
    });
  }
  
  // ฟังก์ชันเดิม ไม่ต้องแก้ไข
  selectSong(songId: number): void {
    console.log(`Navigating to dance page with song ID: ${songId}`);
    this.router.navigate(['/dance']);
  }
  
  // ✨ 8. เพิ่มฟังก์ชันสำหรับปุ่ม Back
  goBack(): void {
    history.back();
  }
}