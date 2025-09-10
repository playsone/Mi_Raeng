import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // สำคัญมากสำหรับ [(ngModel)]
import { MatIconModule } from '@angular/material/icon'; // สำหรับ Material Icons

@Component({
  selector: 'app-profile',
  standalone: true,
  // เพิ่ม Module ที่จำเป็นทั้งหมดที่นี่
  imports: [CommonModule, FormsModule, MatIconModule], 
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile {

  // ตัวแปรสำหรับสลับโหมด (true = โหมดแก้ไข, false = โหมดแสดงผล)
  isEditing = false;
  
  // ตัวแปรสำหรับฟังก์ชันเปิด/ปิดรหัสผ่าน
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';

  // สมมติว่านี่คือข้อมูลผู้ใช้ที่ดึงมาจาก Server
  userData = {
    fullName: 'สมศรี รักดี',
    phone: '081-234-5678',
    password: 'password123',

    age: 28,
    gender: 'หญิง'
  };
  
  // ฟังก์ชันสำหรับปุ่มย้อนกลับ
  goBack(): void {
    history.back();
  }

  // ฟังก์ชันสำหรับสลับระหว่างโหมดแสดงผลและโหมดแก้ไข
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
  
  // ฟังก์ชันสำหรับสลับการแสดงผลรหัสผ่าน
  togglePasswordVisibility(): void {
    if (this.passwordFieldType === 'password') {
      this.passwordFieldType = 'text';
      this.passwordIcon = 'visibility_off';
    } else {
      this.passwordFieldType = 'password';
      this.passwordIcon = 'visibility';
    }
  }

  // ฟังก์ชันสำหรับออกจากระบบ
  logout(): void {
    // --- ใส่โค้ดออกจากระบบของคุณที่นี่ ---
    console.log('ออกจากระบบแล้ว');
  }
}

