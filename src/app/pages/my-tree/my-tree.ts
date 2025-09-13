import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { UserProfile } from '../../model/api.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-tree.html',
  styleUrls: ['./my-tree.scss']
})
export class MyTree implements OnInit {

  private apiService = inject(ApiService);
  private router = inject(Router);

  // --- ตัวแปรสำหรับข้อมูลที่จะแสดงบน UI ---
  userProfile: UserProfile | null = null;
  isLoading: boolean = true;
  
  maxProgress: number = 150; // ค่าสูงสุดของ progress bar
  treeImageName: string = 't1.png'; // รูปเริ่มต้น
Math: any;

  ngOnInit(): void {
    this.loadProfileData();
  }

  // --- โหลดข้อมูลโปรไฟล์ ---
  loadProfileData(): void {
    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.updateTreeImage(); // อัปเดตรูปต้นไม้ตามข้อมูลที่ได้มา
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load profile, logging out.', err);
        // ถ้าโหลดข้อมูลไม่ได้ อาจเป็นเพราะ token หมดอายุ ให้ logout
        localStorage.removeItem('authToken');
        this.router.navigate(['/login']);
      }
    });
  }

  // --- Logic สำหรับเปลี่ยนรูปต้นไม้ตาม "นาที" ที่มี ---
  updateTreeImage(): void {
    if (!this.userProfile) return;

    const currentMinutes = this.userProfile.minute;
    if (currentMinutes >= 150) this.treeImageName = 't6.png';
    else if (currentMinutes >= 120) this.treeImageName = 't5.png';
    else if (currentMinutes >= 90) this.treeImageName = 't4.png';
    else if (currentMinutes >= 60) this.treeImageName = 't3.png';
    else if (currentMinutes >= 30) this.treeImageName = 't2.png';
    else this.treeImageName = 't1.png';
  }

  // --- ฟังก์ชันสำหรับ "รดน้ำต้นไม้" ---
  waterTree(): void {
    // ถ้า progress เต็มแล้ว ให้ไปเก็บต้นไม้ก่อน
    if (this.userProfile && this.userProfile.minute >= this.maxProgress) {
      this.collectTree();
      return;
    }

    // สร้างข้อมูลที่จะส่งไป: ใช้ 1 นาที เพิ่ม 10 คะแนน (ปรับค่าได้ตามต้องการ)
    const activityData = { minute: 1, score: 10 };

    this.apiService.updateActivity(activityData).subscribe({
      next: () => {
        console.log('Watered the tree!');
        this.loadProfileData(); // โหลดข้อมูลใหม่เพื่ออัปเดตหน้าจอ
      },
      error: (err) => console.error('Failed to water tree', err)
    });
  }
  
  // --- ฟังก์ชันสำหรับ "เก็บต้นไม้" ---
  collectTree(): void {
    if (!this.userProfile || this.userProfile.minute < this.maxProgress) {
        alert("นาทีของคุณยังไม่พอที่จะเก็บต้นไม้!");
        return;
    }
    
    // 1. เรียก API เพื่อเพิ่มจำนวนต้นไม้
    this.apiService.addTree().subscribe({
      next: () => {
        // 2. เรียก API เพื่อ "ใช้" นาทีที่สะสมไว้ (ลบ 150 นาที)
        const activityData = { minute: -this.maxProgress, score: 0 };
        this.apiService.updateActivity(activityData).subscribe({
            next: () => {
                console.log('Tree collected and minutes spent!');
                this.loadProfileData(); // โหลดข้อมูลใหม่ทั้งหมด
            },
            error: (err) => console.error('Failed to spend minutes', err)
        });
      },
      error: (err) => console.error('Failed to add tree', err)
    });
  }

  // --- ฟังก์ชันสำหรับคำนวณ % ของ Progress bar ---
  get progressPercentage(): number {
    if (!this.userProfile || this.maxProgress === 0) return 0;
    // ทำให้ progress ไม่เกิน 100%
    const progress = Math.min(this.userProfile.minute, this.maxProgress);
    return (progress / this.maxProgress) * 100;
  }
  
  // --- ฟังก์ชันสำหรับปุ่มย้อนกลับ ---
  goBack(): void {
    history.back();
  }
}