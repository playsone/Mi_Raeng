import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✨ Import CommonModule
import { ApiService } from '../../services/api';
import { LeaderboardEntry } from '../../model/api.model';

@Component({
  selector: 'app-ranking',
  standalone: true, // ✨ เพิ่ม standalone
  imports: [CommonModule], // ✨ เพิ่ม imports
  templateUrl: './ranking.html',
  styleUrls: ['./ranking.scss']
})
export class Ranking implements OnInit {

  private apiService = inject(ApiService);

  // ✨ สร้างตัวแปรเพื่อเก็บข้อมูล
  leaderboard: LeaderboardEntry[] = [];
  top1: LeaderboardEntry | null = null;
  top2: LeaderboardEntry | null = null;
  top3: LeaderboardEntry | null = null;
  
  isLoading: boolean = true; // ✨ สำหรับสถานะ Loading

  ngOnInit(): void {
    // ✨ เมื่อ component โหลดเสร็จ ให้ดึงข้อมูล Leaderboard
    this.apiService.getLeaderboard().subscribe({
      next: (data) => {
        this.leaderboard = data;
        // ✨ แยกข้อมูล 3 อันดับแรกสำหรับ Podium
        this.top1 = data.length > 0 ? data[0] : null;
        this.top2 = data.length > 1 ? data[1] : null;
        this.top3 = data.length > 2 ? data[2] : null;
        this.isLoading = false; // ✨ โหลดเสร็จแล้ว
      },
      error: (err) => {
        console.error('Failed to load leaderboard', err);
        this.isLoading = false; // ✨ เกิดข้อผิดพลาด
      }
    });
  }

  // ✨ ฟังก์ชันสำหรับปุ่มย้อนกลับ
  goBack(): void {
    history.back();
  }
}