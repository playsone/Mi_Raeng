import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; 
import { ApiService } from '../../services/api';
import { UserProfile } from '../../model/api.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule], 
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements OnInit {
  
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  userProfile: UserProfile | null = null;
  // ✨ ตัวแปรควบคุมการแสดง Popup
  showWelcomePopup: boolean = false; 
  
  // ✨ ตัวแปรเก็บข้อมูลสำหรับ Popup
  treeCount: number = 0;
  remainingScore: number = 0;
  private readonly SCORE_PER_TREE = 60; // กำหนด 60 คะแนนต่อ 1 ต้นไม้

  ngOnInit(): void {
    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        console.log('Profile data loaded:', data);
        // ✨ คำนวณและแสดง Popup ทันที
        this.calculateAndShowPopup();
      },
      error: (err) => {
        console.error('Failed to load profile, logging out.', err);
        this.logout(); 
      }
    });
  }

  // ✨ ฟังก์ชันคำนวณและตั้งค่า Popup
  calculateAndShowPopup(): void {
    if (this.userProfile) {
      const totalScore = this.userProfile.score;
      this.treeCount = Math.floor(totalScore / this.SCORE_PER_TREE);
      this.remainingScore = this.SCORE_PER_TREE - (totalScore % this.SCORE_PER_TREE);
      this.showWelcomePopup = true; // เปิด Popup
    }
  }

  // ✨ ฟังก์ชันสำหรับกดปุ่ม 'ไปออกกำลังกายกัน'
  goToExerciseFromPopup(): void {
    this.showWelcomePopup = false; // ปิด Popup
    this.goTo('/exercise'); // นำทาง
  }

  // ✨ ฟังก์ชันสำหรับปิด Popup โดยไม่ไปไหน
  closePopup(): void {
    this.showWelcomePopup = false;
  }
  
  get profilePictureUrl(): string {
    if (this.userProfile?.gender?.toLowerCase() === 'female') {
      return 'assets/images/profilefm.png'; 
    }
    return 'assets/images/profilem.png'; 
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']); 
  }
}