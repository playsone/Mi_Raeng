import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
   // ตัวแปรสำหรับช่อง "รหัสผ่าน"
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';

  // ตัวแปรสำหรับช่อง "ยืนยันรหัสผ่าน"
  confirmPasswordFieldType: string = 'password';
  confirmPasswordIcon: string = 'visibility';

  constructor() { }



}
