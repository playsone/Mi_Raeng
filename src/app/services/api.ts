import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Constants } from '../config/constants';
import { LeaderboardEntry, LoginResponse, UserProfile } from '../model/api.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Inject สิ่งที่ต้องใช้เข้ามา
  private http = inject(HttpClient);
  private constants = inject(Constants);

  private readonly API_ENDPOINT = this.constants.API_ENDPOINT;

  // --- Public Routes ---

  // POST /register
  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_ENDPOINT}/register`, userData);
  }

  // POST /login
  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_ENDPOINT}/login`, credentials);
  }

  // GET /leaderboard
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.API_ENDPOINT}/leaderboard`);
  }

  // --- Protected Routes (ต้องใช้ Token) ---

  // GET /profile/me
  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_ENDPOINT}/profile/me`);
  }

  // PUT /profile/me
  updateMyProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.API_ENDPOINT}/profile/me`, profileData);
  }

  // POST /profile/activity
  updateActivity(activityData: { minute: number, score: number }): Observable<any> {
    return this.http.post(`${this.API_ENDPOINT}/profile/activity`, activityData);
  }

  // POST /profile/tree
  addTree(): Observable<any> {
    return this.http.post(`${this.API_ENDPOINT}/profile/tree`, {}); // ไม่ต้องส่ง body
  }

  // --- Admin Routes (ต้องใช้ Token และ Role 'admin') ---

  /**
   * ดึงข้อมูลสำหรับ Admin Dashboard
   * @returns Observable with admin data
   */
  getAdminDashboardData(): Observable<any> {
    return this.http.get(`${this.API_ENDPOINT}/admin/dashboard`);
  }
}