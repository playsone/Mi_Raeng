import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import * as visionModule from '@mediapipe/tasks-vision';

@Component({
  selector: 'app-dance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dance.html',
  styleUrls: ['./dance.scss'],
})
export class Dance implements OnDestroy {
  private zone = inject(NgZone);
  private router = inject(Router);
  private apiService = inject(ApiService);
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  videoSourceUrl: string = 'assets/video/Rizz.mp4';

  private vision: any;
  private landmarker: any;
  private running = false;
  private rafId = 0;

  isLoading = true;
  statusMessage = 'กำลังโหลดโมเดล AI...';

  timer: number = 5 * 60;
  score: number = 0;
  isMoving: boolean = false;
  showPopup = false;
  workoutMinutes = 0;

  private lastLandmarks: any[] | null = null;
  private movementThreshold = 0.07;
  private pointsMultiplier = 2;

  private standingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  constructor() {
    this.init();
  }

  async init() {
    try {
      await this.loadPoseLandmarker();
      this.statusMessage = 'กำลังเปิดกล้อง...';
      await this.initCamera();
      this.isLoading = false;
      this.running = true;
      this.loop();
      this.startWorkoutTimer();
    } catch (error) {
      console.error('Initialization failed:', error);
      this.statusMessage = 'เกิดข้อผิดพลาดในการเริ่มต้น';
    }
  }

  ngOnDestroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    const stream = this.videoRef?.nativeElement?.srcObject as MediaStream;
    if (stream) stream.getTracks().forEach((track) => track.stop());
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  private async initCamera() {
    const video = this.videoRef.nativeElement;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 360 }, // ✅ ลดความกว้างลง
        height: { ideal: 480 }, // ✅ ลดความสูงลง
      },
      audio: false,
    });
    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        this.zone.run(() => {
          this.statusMessage = '';
          this.isLoading = false;
        });
        resolve(null);
      };
    });

    await video.play();
    const canvas = this.canvasRef.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    this.standingBox = {
      x: video.videoWidth * 0.1,
      y: video.videoHeight * 0.1,
      width: video.videoWidth * 0.8,
      height: video.videoHeight * 0.8,
    };
  }

  private async loadPoseLandmarker() {
    this.vision = visionModule;
    const filesetResolver = await this.vision.FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
    );

    this.landmarker = await this.vision.PoseLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        resultCallback: (results: any) => {},
      }
    );
  }

  private startWorkoutTimer() {
    const interval = setInterval(() => {
      if (!this.running) {
        clearInterval(interval);
        return;
      }
      this.timer--;
      if (this.timer <= 0) {
        clearInterval(interval);
        this.finishExercise();
      }
    }, 1000);
  }

  finishExercise() {
    this.running = false;
    this.workoutMinutes = 12;
    this.showPopup = true;

    this.apiService
      .updateActivity({ minute: 12, score: this.score })
      .subscribe({
        next: () => console.log('Activity updated successfully!'),
        error: (err) => console.error('Failed to update activity', err),
      });
  }

  private loop = () => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    this.zone.runOutsideAngular(() => this.processFrame());
  };

  private processFrame() {
    if (
      !this.landmarker ||
      !this.videoRef?.nativeElement ||
      this.videoRef.nativeElement.readyState < 3
    )
      return;

    const video = this.videoRef.nativeElement;
    const results = this.landmarker.detectForVideo(video, performance.now());
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ✅ --- คำนวณขนาด Font และระยะขอบให้เป็นแบบ Responsive ---
    const margin = canvas.width * 0.04; // ระยะขอบ 4%
    const mainFontSize = canvas.width * 0.05; // Font หลัก 5%
    const smallFontSize = canvas.width * 0.04; // Font เล็ก 4%

    if (this.standingBox) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 4;
      ctx.strokeRect(
        this.standingBox.x,
        this.standingBox.y,
        this.standingBox.width,
        this.standingBox.height
      );
      ctx.fillStyle = 'red';
      // ✅ ใช้ขนาด font ที่คำนวณไว้
      ctx.font = `${smallFontSize}px Kanit, Arial`;
      ctx.fillText(
        'ยืนในกรอบนี้!',
        this.standingBox.x + 10,
        this.standingBox.y - 10
      );
    }

    if (results.landmarks && results.landmarks.length > 0) {
      const currentLandmarks = results.landmarks[0];
      this.detectMovement(currentLandmarks, ctx);
      this.lastLandmarks = currentLandmarks;

      // ✅ --- ตั้งค่าการจัดวางและวาดคะแนน ---
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'yellow';
      ctx.font = `${mainFontSize}px Kanit, Arial`;
      ctx.fillText(
        `Score: ${Math.floor(this.score)}`,
        canvas.width - margin, // ✅ ใช้ระยะขอบที่คำนวณไว้
        margin
      );
    }

    // ✅ --- วาดเวลา ---
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'lime';
    ctx.font = `${mainFontSize}px Kanit, Arial`;
    const minutes = Math.floor(this.timer / 60);
    const seconds = this.timer % 60;
    ctx.fillText(
      `Time: ${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`,
      canvas.width - margin, // ✅ ใช้ระยะขอบที่คำนวณไว้
      margin + mainFontSize * 1.2 // ✅ จัดตำแหน่งให้อยู่ใต้คะแนน
    );
  }

  private detectMovement(
    currentLandmarks: any[],
    ctx: CanvasRenderingContext2D
  ) {
    if (!this.lastLandmarks) {
      this.isMoving = false;
      return;
    }

    const keypointIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    let insideBox = false;

    for (const i of keypointIndices) {
      const point = currentLandmarks[i];
      if (point) {
        const px = point.x * this.videoRef.nativeElement.videoWidth;
        const py = point.y * this.videoRef.nativeElement.videoHeight;
        if (
          this.standingBox &&
          px >= this.standingBox.x &&
          px <= this.standingBox.x + this.standingBox.width &&
          py >= this.standingBox.y &&
          py <= this.standingBox.y + this.standingBox.height
        ) {
          insideBox = true;
          break;
        }
      }
    }

    if (!insideBox) {
      this.isMoving = false;
      // ✅ ทำให้ข้อความแจ้งเตือน Responsive ด้วย
      const smallFontSize = ctx.canvas.width * 0.04;
      ctx.fillStyle = 'orange';
      ctx.font = `${smallFontSize}px Kanit, Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(
        'อยู่ในกรอบเพื่อให้คะแนน',
        ctx.canvas.width / 2, // จัดกลางจอ
        ctx.canvas.height * 0.2 // ตำแหน่ง Y
      );
      return;
    }

    let totalDistance = 0;
    let count = 0;
    for (const i of keypointIndices) {
      const p1 = this.lastLandmarks[i];
      const p2 = currentLandmarks[i];
      if (p1 && p2) {
        totalDistance += Math.hypot(p2.x - p1.x, p2.y - p1.y);
        count++;
      }
    }

    const averageDistance = totalDistance / count;
    this.isMoving = averageDistance > this.movementThreshold;
    if (this.isMoving) {
      this.score += averageDistance * this.pointsMultiplier;
    }
  }
}
