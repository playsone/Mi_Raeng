import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from "jwt-decode";

// สร้าง interface สำหรับ Claims ใน Token ของเรา
interface TokenClaims {
  user_id: number;
  role: 'member' | 'admin';
  exp: number;
}

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('authToken');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decodedToken: TokenClaims = jwtDecode(token);
    const userRole = decodedToken.role;
    const expectedRole = route.data['role']; // ดึง role ที่ต้องการจาก routing

    if (userRole === expectedRole) {
      return true; // สิทธิ์ถูกต้อง ผ่านได้
    } else {
      router.navigate(['/home']); // สิทธิ์ไม่ถูกต้อง ส่งกลับหน้า home
      return false;
    }
  } catch (error) {
    router.navigate(['/login']); // Token ไม่ถูกต้อง
    return false;
  }
};