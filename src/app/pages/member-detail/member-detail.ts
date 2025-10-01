import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api';
import { UserProfile } from '../../model/api.model';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './member-detail.html',
  styleUrls: ['./member-detail.scss']
})
export class MemberDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  user: UserProfile | null = null;

  ngOnInit(): void {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (uid) {
      this.apiService.getFullUserProfile(uid).subscribe({
        next: (data) => this.user = data,
        error: (err) => {
          console.error('โหลดข้อมูลสมาชิกไม่ได้', err);
          this.router.navigate(['/admin']);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
