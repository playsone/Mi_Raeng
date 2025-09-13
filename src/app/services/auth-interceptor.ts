import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ดึง Token จาก Local Storage
  const token = localStorage.getItem('authToken');

  // ถ้ามี Token อยู่ ให้สร้าง Request ใหม่โดยใส่ Authorization Header
  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  // ถ้าไม่มี Token ก็ส่ง Request เดิมออกไป
  return next(req);
};