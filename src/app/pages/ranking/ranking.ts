import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✨ Import CommonModule
import { ApiService } from '../../services/api';
import { LeaderboardEntry, UserProfile } from '../../model/api.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-ranking',
  standalone: true, // ✨ เพิ่ม standalone
  imports: [CommonModule], // ✨ เพิ่ม imports
  templateUrl: './ranking.html',
  styleUrls: ['./ranking.scss']
})
export class Ranking implements OnInit {

  private apiService = inject(ApiService);

  leaderboard: LeaderboardEntry[] = [];
  top1: LeaderboardEntry | null = null;
  top2: LeaderboardEntry | null = null;
  top3: LeaderboardEntry | null = null;
  
  isLoading: boolean = true;

  // --- V V V ส่วนที่เพิ่มเข้ามาสำหรับ Popup V V V ---
  currentUserProfile: UserProfile | null = null;
  showRankPopup = false;
  popupTitle = '';
  popupMessage = '';
  // --- ^ ^ ^ สิ้นสุดส่วนที่เพิ่มเข้ามา ^ ^ ^ ---

  ngOnInit(): void {
    this.isLoading = true;
    
    // ✨ เรียก API 2 ตัวพร้อมกัน: Leaderboard และข้อมูลผู้ใช้ปัจจุบัน
    forkJoin({
      leaderboard: this.apiService.getLeaderboard(),
      profile: this.apiService.getMyProfile() // สมมติว่ามีฟังก์ชันนี้ใน service
    }).subscribe({
      next: ({ leaderboard, profile }) => {
        this.leaderboard = leaderboard;
        this.currentUserProfile = profile;
        
        this.top1 = leaderboard.length > 0 ? leaderboard[0] : null;
        this.top2 = leaderboard.length > 1 ? leaderboard[1] : null;
        this.top3 = leaderboard.length > 2 ? leaderboard[2] : null;
        
        this.isLoading = false;

        // ✨ เรียกฟังก์ชันเพื่อตรวจสอบอันดับและเตรียมแสดง Popup
        this.findUserRankAndShowPopup();
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.isLoading = false;
      }
    });
  }

  // ✨ ฟังก์ชันสำหรับค้นหาอันดับและตั้งค่าข้อความใน Popup
  private findUserRankAndShowPopup(): void {
    if (!this.currentUserProfile) return;

    const userIndex = this.leaderboard.findIndex(user => user.name === this.currentUserProfile!.name);

    if (userIndex !== -1) {
      const rank = userIndex + 1;
      if (rank === 1) {
        this.popupTitle = "สุดยอดไปเลย!";
        this.popupMessage = "คุณคืออันดับ 1 ของตาราง! ไม่มีใครเทียบได้จริงๆ ความพยายามของคุณน่าทึ่งมาก!";
      } else {
        this.popupTitle = `คุณอยู่อันดับที่ ${rank}`;
        this.popupMessage = "ยอดเยี่ยมมาก! อันดับของคุณสุดยอดเลย พยายามอีกนิดเพื่อขึ้นเป็นที่หนึ่งนะ สู้ๆ!";
      }
    } else {
      this.popupTitle = "คุณยังไม่อยู่ใน 10 อันดับแรก";
      this.popupMessage = "เข้ามาออกกำลังกายบ่อยๆ สะสมคะแนน แล้วมาติดอันดับท็อป 10 ด้วยกันนะ!";
    }

    // หน่วงเวลาเล็กน้อยเพื่อให้หน้าจอหลักแสดงผลก่อน Popup จะเด้งขึ้นมา
    setTimeout(() => {
      this.showRankPopup = true;
    }, 600);
  }

  // ✨ ฟังก์ชันสำหรับปิด Popup
  closePopup(): void {
    this.showRankPopup = false;
  }

  goBack(): void {
    history.back();
  }
}
