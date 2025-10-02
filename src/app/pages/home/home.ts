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
  showWelcomePopup: boolean = false; 
  
  treeCount: number = 0;
  remainingScore: number = 0;
  private readonly SCORE_PER_TREE = 60; // กำหนด 60 คะแนนต่อ 1 ต้นไม้
  
  // 🔑 เปลี่ยนไปใช้ sessionStorage เพื่อให้ข้อมูลถูกลบเมื่อปิดเซสชัน
  private readonly WELCOME_POPUP_SEEN_KEY = 'welcomePopupSeen'; 

  ngOnInit(): void {
    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        console.log('Profile data loaded:', data);
        this.calculateAndShowPopup();
      },
      error: (err) => {
        console.error('Failed to load profile, logging out.', err);
        this.logout(); 
      }
    });
  }

  // ✨ ฟังก์ชันคำนวณและตั้งค่า Popup (แก้ไข: ตรวจสอบ sessionStorage)
  calculateAndShowPopup(): void {
    if (this.userProfile) {
      // 1. ตรวจสอบว่าเคยปิด Popup ในเซสชันปัจจุบันหรือไม่
      // ใช้ sessionStorage.getItem แทน localStorage.getItem
      const popupSeen = sessionStorage.getItem(this.WELCOME_POPUP_SEEN_KEY);
      
      // ถ้ายังไม่เคยเห็น (ค่าเป็น null)
      if (!popupSeen) { 
        const totalScore = this.userProfile.score;
        this.treeCount = Math.floor(totalScore / this.SCORE_PER_TREE);
        this.remainingScore = this.SCORE_PER_TREE - (totalScore % this.SCORE_PER_TREE);
        this.showWelcomePopup = true; // เปิด Popup
      }
    }
  }

  goToExerciseFromPopup(): void {
    this.closePopup(); 
    this.goTo('/exercise'); 
  }

  // ✨ ฟังก์ชันสำหรับปิด Popup โดยไม่ไปไหน (แก้ไข: บันทึกสถานะลง sessionStorage)
  closePopup(): void {
    this.showWelcomePopup = false;
    // 2. บันทึกสถานะลง sessionStorage เมื่อผู้ใช้กดปิด
    // ใช้ sessionStorage.setItem แทน localStorage.setItem
    sessionStorage.setItem(this.WELCOME_POPUP_SEEN_KEY, 'true');
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
    // เมื่อทำการ logout ควรลบข้อมูลใน sessionStorage เพื่อให้ Popup แสดงขึ้นมาเมื่อ login ใหม่อีกครั้ง
    sessionStorage.removeItem(this.WELCOME_POPUP_SEEN_KEY);
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']); 
  }
}