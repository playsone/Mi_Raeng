// สำหรับการตอบกลับหลังล็อกอินสำเร็จ
export interface LoginResponse {
  message: string;
  name: string;
  token: string;
  role: 'member' | 'admin'; // ✨ เพิ่มบรรทัดนี้
  days_since_last_login: number;
}

// สำหรับแสดงข้อมูลโปรไฟล์
export interface UserProfile {
  name: string;
  phone: string;
  age: number;
  gender: string;
  score: number;
  minute: number;
  number_tree: number; 
  tree_progress: number;
}

// สำหรับแสดงข้อมูลในหน้าจัดอันดับ
export interface LeaderboardEntry {
  name: string;
  number_tree: number;
  score: number;
  // เราจะสร้าง rank ขึ้นมาเองในฝั่ง Frontend
  rank?: number; 
}

