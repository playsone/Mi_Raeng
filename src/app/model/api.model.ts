// สำหรับการตอบกลับหลังล็อกอินสำเร็จ
export interface LoginResponse {
  message: string;
  name: string;
  token: string;
  role: 'member' | 'admin'; // ✨ เพิ่มบรรทัดนี้
}

// สำหรับแสดงข้อมูลโปรไฟล์
export interface UserProfile {
  name: string;
  phone: string;
  age: number;
  gender: string;
  score: number;
  minute: number;
  number_tree: number; // <-- เพิ่ม field นี้
}

// สำหรับแสดงข้อมูลในหน้าจัดอันดับ
export interface LeaderboardEntry {
  rank: number;
  name: string;
  number_tree: number;
  score: number;
}