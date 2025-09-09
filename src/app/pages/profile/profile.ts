import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- สำคัญมาก! ต้อง import FormsModule

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- และเพิ่ม FormsModule ที่นี่
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile {

  // ตัวแปรสำหรับสลับโหมด (true = โหมดแก้ไข, false = โหมดแสดงผล)
  isEditing = false;

  // สมมติว่านี่คือข้อมูลผู้ใช้ที่ดึงมาจาก Server
  userData = {
    fullName: 'สมศรี รักดี',
    phone: '081-234-5678',
    password: 'password123',
    age: 28,
    gender: 'หญิง'
  };

  // ฟังก์ชันสำหรับสลับโหมด
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  // ฟังก์ชันสำหรับบันทึกข้อมูล
  saveChanges(): void {
    // --- ในอนาคต คุณสามารถใส่โค้ดสำหรับส่งข้อมูลไปบันทึกที่ Server ตรงนี้ ---
    console.log('ข้อมูลที่บันทึก:', this.userData);

    // หลังจากบันทึกเสร็จ ให้สลับกลับไปโหมดแสดงผล
    this.isEditing = false;
  }

  // ฟังก์ชันสำหรับออกจากระบบ
  logout(): void {
    // --- ใส่โค้ดออกจากระบบของคุณที่นี่ ---
    console.log('ออกจากระบบแล้ว');
  }
}
