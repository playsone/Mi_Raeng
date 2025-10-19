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

  userProfile: UserProfile | null = null;
  isLoading: boolean = true;
  
  maxProgress: number = 1000;
  treeImageName: string = 't1.png';

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.apiService.getMyProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.updateTreeImage();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.router.navigate(['/login']);
      }
    });
  }

  updateTreeImage(): void {
    if (!this.userProfile) return;
    const currentProgress = this.userProfile.tree_progress;
    if (currentProgress >= 900) this.treeImageName = 't6.png';
    else if (currentProgress >= 800) this.treeImageName = 't5.png';
    else if (currentProgress >= 600) this.treeImageName = 't4.png';
    else if (currentProgress >= 400) this.treeImageName = 't3.png';
    else if (currentProgress >= 200) this.treeImageName = 't2.png';
    else this.treeImageName = 't1.png';
  }

  // ✨ --- นี่คือฟังก์ชันที่ถูกต้อง --- ✨
  waterTree(amount: number): void {
    if (!this.userProfile || this.userProfile.score < amount) {
        alert("คะแนนของคุณไม่เพียงพอ!");
        return;
    }
    
    // 1. เรียกใช้ API
    this.apiService.waterTree({ amount: amount }).subscribe({
      next: (response) => {
        console.log('Tree watered!', response);
        // 2. อัปเดตข้อมูลในหน้าเว็บทันทีด้วยข้อมูลที่ได้จาก Backend
        if(this.userProfile) {
            this.userProfile.score = response.new_score;
            this.userProfile.tree_progress = response.tree_progress;
            this.userProfile.number_tree = response.number_tree;
            this.updateTreeImage(); // อัปเดตรูปต้นไม้ตาม progress ใหม่
        }
      },
      error: (err) => console.error('Failed to water tree', err)
    });
  }

  get progressPercentage(): number {
    if (!this.userProfile) return 0;
    return (this.userProfile.tree_progress / this.maxProgress) * 100;
  }
  
  goBack(): void {
    history.back();
  }
}