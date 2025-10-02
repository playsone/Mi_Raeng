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
  // 🔥 แก้ไข: กำหนดเป็นค่าคงที่ 60 คะแนน
  private readonly SCORE_PER_TREE = 60; 
  
  // 🔑 คีย์สำหรับ sessionStorage และ localStorage
  private readonly WELCOME_POPUP_SEEN_KEY = 'welcomePopupSeen'; 
  private readonly DAYS_LAPSED_KEY = 'daysLapsed'; // ต้องตรงกับ login.ts
  
  // ✨ ตัวแปรใหม่สำหรับเก็บข้อความและชื่อเรื่องส่วนตัว (เพื่อให้แสดงใน HTML)
  personalizedPopupMessage: string = ''; 
  welcomePopupTitle: string = '';
  // 🎯 เป้าหมายรายวัน (150 นาที)
  private readonly DAILY_MINUTE_GOAL = 150; 

  ngOnInit(): void {
    this.apiService.getMyProfile().subscribe({
      next: (data: any) => { 
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

  // ✨ ฟังก์ชันคำนวณและตั้งค่า Popup (New Personalized Logic)
  calculateAndShowPopup(): void {
    if (this.userProfile) {
      const popupSeen = sessionStorage.getItem(this.WELCOME_POPUP_SEEN_KEY);

      if (!popupSeen) {
        // --- ส่วนคำนวณคะแนน/ต้นไม้ ---
        const totalScore = this.userProfile.score;
        this.treeCount = Math.floor(totalScore / this.SCORE_PER_TREE);
        this.remainingScore = this.SCORE_PER_TREE - (totalScore % this.SCORE_PER_TREE);
        
        // --- ส่วนคำนวณข้อความส่วนตัว (ใหม่) ---
        
        // 1. 🔥 คำนวณนาทีที่ทำได้วันนี้: userProfile.minute * 2.5
        //    เราใช้ Math.round เพื่อให้ค่าที่แสดงเป็นจำนวนเต็มที่อ่านง่าย
        const dailyMins = Math.round(this.userProfile.minute * 2.5); 
        
        // 2. ดึงจำนวนวันที่ห่างหายไปจาก localStorage
        const daysLapsedStr = localStorage.getItem(this.DAYS_LAPSED_KEY);
        const daysLapsed = daysLapsedStr ? parseInt(daysLapsedStr) : 0; 
        
        this.welcomePopupTitle = `ยินดีต้อนรับคุณ, ${this.userProfile.name}`;
        let message = '';

        if (daysLapsed > 2) {
            // เงื่อนไข 3: ไม่เข้าสู่ระบบนาน (แสดงจำนวนวัน)
            message = `🚨 **คุณไม่ได้เข้ามาออกกำลังกายมา ${daysLapsed} วันแล้วนะคะ!** ร่างกายคุณรอการขยับอยู่ค่ะ มาเริ่มต้นเพื่อสุขภาพที่ดีกันเถอะ! 😉`;
        } else if (dailyMins >= this.DAILY_MINUTE_GOAL) {
            // เงื่อนไข 1: ทำครบ 150 นาที
            message = `🎉 **สุดยอดมาก!** วันนี้คุณทำสำเร็จตามเป้าหมาย ${this.DAILY_MINUTE_GOAL} นาทีแล้ว! ร่างกายแข็งแรง ได้คะแนนสะสมไปเต็มๆ เลยค่ะ! 🏆`;
        } else {
            // เงื่อนไข 2: เข้าสู่ระบบแล้ว แต่ยังไม่ครบ 150 นาที
            const minsLeft = this.DAILY_MINUTE_GOAL - dailyMins;
            
            // คำพูดให้กำลังใจตามความคืบหน้า
            if (dailyMins >= (this.DAILY_MINUTE_GOAL * 0.75)) { 
                 message = `💪 **ใกล้ถึงเป้าหมายแล้ว!** คุณทำไปแล้ว ${dailyMins} นาที เหลืออีกแค่ **${minsLeft} นาที** ก็จะถึง ${this.DAILY_MINUTE_GOAL} นาทีแล้ว! สู้! 🌟`;
            } else {
                 message = `ยอดเยี่ยมที่เข้ามาออกกำลังกายวันนี้ค่ะ! คุณทำไปแล้ว ${dailyMins} นาที! พยายามอีกนิดนะคะ เหลืออีก ${minsLeft} นาที เพื่อพิชิตเป้าหมาย ${this.DAILY_MINUTE_GOAL} นาทีค่ะ! 🚀`;
            }
        }
        
        this.personalizedPopupMessage = message;
        this.showWelcomePopup = true; // เปิด Popup
      }
    }
  }

  
  goToExerciseFromPopup(): void {
    this.closePopup(); 
    this.goTo('/exercise'); 
  }

  closePopup(): void {
    this.showWelcomePopup = false;
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
    sessionStorage.removeItem(this.WELCOME_POPUP_SEEN_KEY);
    localStorage.removeItem(this.DAYS_LAPSED_KEY); 
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']); 
  }
}
