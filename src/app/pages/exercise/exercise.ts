import { Component } from '@angular/core';
import { Router } from '@angular/router'; // 1. Import Router
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exercise',
   imports: [CommonModule],
  templateUrl: './exercise.html',
  styleUrl: './exercise.scss'
})
export class Exercise {
   // 2. Inject Router เข้าไปใน constructor
  constructor(private router: Router) {}
  // 3. ✨ สร้างฟังก์ชันใหม่สำหรับนำทางไปยังหน้า dance ✨
  selectSong(songId: number): void {
    console.log(`Navigating to dance page with song ID: ${songId}`);
    // คุณสามารถส่ง ID ของเพลงไปกับ URL ได้ในอนาคต
    // แต่ตอนนี้ เราจะไปที่หน้า /dance ก่อน
    this.router.navigate(['/dance']);
  }

}
