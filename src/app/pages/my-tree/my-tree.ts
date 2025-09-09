import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-tree.html',
  styleUrl: './my-tree.scss'
})
export class MyTree implements OnInit {
  // --- ตัวแปรสำหรับข้อมูลที่จะแสดงบน UI ---
  timeScore: number = 120;
  starScore: number = 910;
  
  // ใช้ currentProgress แทน minute เพื่อให้ตรงกับ UI
  currentProgress: number = 150; 
  maxProgress: number = 150;
  
  accumulatedTrees: number = 5;
  
  // ตัวแปรเก็บชื่อไฟล์รูปภาพต้นไม้
  treeImageName: string = '';

  // ตัวแปรเก็บชื่อไฟล์รูปบัวรดน้ำ
  wateringCanImage: string = 'water.png'; // เปลี่ยนเป็นชื่อไฟล์ของคุณ

  ngOnInit(): void {
    this.updateTreeImage();
  }

  // --- Logic สำหรับเปลี่ยนรูปต้นไม้ตาม Progress ---
  updateTreeImage(): void {
    if (this.currentProgress >= 150) {
      this.treeImageName = 't6.png'; // เปลี่ยนเป็นชื่อไฟล์ของคุณ
    } else if (this.currentProgress >= 120) {
      this.treeImageName = 't5.png';
    } else if (this.currentProgress >= 90) {
      this.treeImageName = 't4.png';
    } else if (this.currentProgress >= 60) {
      this.treeImageName = 't3.png';
    } else if (this.currentProgress >= 30) {
      this.treeImageName = 't2.png';
    } else {
      this.treeImageName = 't1.png';
    }
  }

  // --- ฟังก์ชันสำหรับคำนวณ % ของ Progress bar ---
  get progressPercentage(): number {
    if (this.maxProgress === 0) {
      return 0;
    }
    return (this.currentProgress / this.maxProgress) * 100;
  }
}

