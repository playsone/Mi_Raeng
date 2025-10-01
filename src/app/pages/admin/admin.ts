import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, MatButtonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent implements OnInit {

  private router = inject(Router);
  private apiService = inject(ApiService);

  users: { uid: string; name: string }[] = [];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.apiService.getAllUsersSummary().subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error('โหลดสมาชิกไม่ได้', err)
    });
  }

  viewUser(user: { uid: string; name: string }): void {
    this.router.navigate(['/member-detail', user.uid]);
  }

  goToAdminProfile(): void {
    this.router.navigate(['/admin-profile']);
  }
}
