// สำหรับการตอบกลับหลังล็อกอินสำเร็จ
export interface LoginResponse {
  message: string;
  name: string;
  token: string;
}

// สำหรับแสดงข้อมูลโปรไฟล์
export interface UserProfile {
  name: string;
  phone: string;
  age: number;
  gender: string;
}

// สำหรับแสดงข้อมูลในหน้าจัดอันดับ
export interface LeaderboardEntry {
  rank: number;
  name: string;
  number_tree: number;
  score: number;
}