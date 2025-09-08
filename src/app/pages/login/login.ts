import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  constructor(private router: Router) {}

  login(event: Event) {
    event.preventDefault(); // ป้องกัน form submit ปกติ
    // สามารถเพิ่ม logic ตรวจสอบเบอร์โทร/รหัสผ่านก่อน
    this.router.navigate(['/home']); // ไปหน้า home
  }
}
