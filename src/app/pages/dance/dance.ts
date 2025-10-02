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

type Phase = 'loading' | 'precheck' | 'running' | 'finished';

@Component({
  selector: 'app-dance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dance.html',
  styleUrls: ['./dance.scss'],
})
export class Dance implements OnDestroy {
  /** ---------- Config ---------- */
  readonly WORKOUT_DURATION_MINUTES = 12;
  // --- V V V เพิ่ม 2 บรรทัดนี้ V V V ---
  private lastScoreTime = 0; // เวลาล่าสุดที่ได้คะแนน
  private readonly SCORE_COOLDOWN_MS = 400; // ดีเลย์ 400 มิลลิวินาที (0.4 วินาที)
  /** ต้อง “เห็นครบทั้งตัวในกรอบ” ต่อเนื่องกี่เฟรมจึงเริ่ม */
  private readonly PRECHECK_REQUIRED_FRAMES = 45; // ~1.5s ที่ ~30fps
  /** ต้องมี keypoints ครบกี่จุดจากชุดที่กำหนด */
  private readonly REQUIRED_KEYPOINT_COVERAGE = 0.85;
  /** ความต่างตำแหน่งระหว่างเฟรมเพื่อถือว่า “กำลังขยับ” */
  private readonly movementThreshold = 0.07;
  /** ตัวคูณคะแนน */
  private readonly pointsMultiplier = 2;
  /** ระยะ margin ด้านในของกรอบยืน (กันชิดขอบเกินไป) */
  private readonly BOX_INNER_PADDING = 0.02;

  /** ---------- Injections / Refs ---------- */
  private zone = inject(NgZone);
  private router = inject(Router);
  private apiService = inject(ApiService);

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>; // กล้อง
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>; // วาด HUD
  @ViewChild('refVideo') refVideo!: ElementRef<HTMLVideoElement>; // วิดีโอต้นแบบ

  /** ---------- UI State ---------- */
  videoSourceUrl: string = 'assets/video/Rizz.mp4';
  isLoading = true;
  statusMessage = 'กำลังโหลดโมเดล AI...';
  isMoving = false;
  showPopup = false;

  /** ---------- Workout State ---------- */
  phase: Phase = 'loading';
  timer: number = this.WORKOUT_DURATION_MINUTES * 60;
  score: number = 0;
  workoutMinutes = 0;

  /** ---------- Mediapipe ---------- */
  private vision: any;
  private landmarker: any;
  private running = false;
  private rafId = 0;

  /** ---------- Pose / Movement ---------- */
  private lastLandmarks: any[] | null = null;
  private standingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  /** ---------- Precheck ---------- */
  precheckFrames = 0; // นับเฟรมที่ “ผ่านเงื่อนไขเห็นครบทั้งตัวในกรอบ”
  precheckPassed = false;
  public formattedTime: string = 'Time: 00:00';
  constructor() {
    this.init();
  }

  /** ========== Lifecycle ========== */

  async init() {
    try {
      await this.loadPoseLandmarker();

      this.statusMessage = 'กำลังเปิดกล้อง...';
      await this.initCamera();

      // เตรียมวิดีโอต้นแบบ: ให้หยุดไว้ก่อน (ไม่ autoplay/loop)
      this.safePauseRefVideo();

      this.isLoading = false;
      this.phase = 'precheck';
      this.statusMessage =
        'ยืนให้เห็นครบทั้งตัวในกรอบ แล้วอยู่นิ่ง ๆ แป๊บหนึ่ง...';

      // เริ่ม loop อ่านเฟรม (แต่ยังไม่เริ่มนับเวลา/คะแนน)
      this.running = true;
      this.loop();
    } catch (error) {
      console.error('Initialization failed:', error);
      this.statusMessage = 'เกิดข้อผิดพลาดในการเริ่มต้น';
    }
  }

  ngOnDestroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);

    // ปิด stream กล้อง
    const stream = this.videoRef?.nativeElement?.srcObject as MediaStream;
    if (stream) stream.getTracks().forEach((track) => track.stop());

    // หยุดวิดีโอต้นแบบ
    this.safePauseRefVideo();
  }

  /** ========== Navigation / Buttons ========== */

  goHome() {
    this.router.navigate(['/home']);
  }

  quitExercise(): void {
    // กด “จบ” ก่อนเวลา -> ไม่บันทึกคะแนน/นาที
    console.log('User quit the exercise early.');
    this.running = false;
    this.phase = 'finished';
    this.safePauseRefVideo();
    this.router.navigate(['/home']);
  }

  /** ========== Setup Camera & Model ========== */

  private async initCamera() {
    const video = this.videoRef.nativeElement;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 360 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    video.srcObject = stream;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        this.zone.run(() => {
          this.statusMessage = '';
          this.isLoading = false;
        });
        resolve();
      };
    });

    await video.play();

    const canvas = this.canvasRef.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // สร้างกรอบยืน (80% ของเฟรม)
    // โค้ดใหม่ (กรอบขนาด 90% และมีขอบ 5%) ✨
    this.standingBox = {
      x: video.videoWidth * 0.05, // ลดระยะห่างเหลือ 5%
      y: video.videoHeight * 0.05, // ลดระยะห่างเหลือ 5%
      width: video.videoWidth * 0.9, // เพิ่มขนาดเป็น 90%
      height: video.videoHeight * 0.9, // เพิ่มขนาดเป็น 90%
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
        resultCallback: (_results: any) => {},
      }
    );
  }

  /** ========== Workout Timing / Finish ========== */

  private startWorkoutTimer() {
    const interval = setInterval(() => {
      if (!this.running || this.phase !== 'running') {
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

  private startWorkoutRun() {
    // รีเซ็ตเวลา+คะแนน แล้วเริ่มพร้อมกับเล่นวิดีโอต้นแบบ
    this.timer = this.WORKOUT_DURATION_MINUTES * 60;
    this.score = 0;
    this.phase = 'running';

    // เล่นวิดีโอต้นแบบ + เริ่มนับเวลา
    this.safePlayRefVideo();
    this.startWorkoutTimer();
  }

  finishExercise() {
    this.running = false;
    this.phase = 'finished';
    this.workoutMinutes = this.WORKOUT_DURATION_MINUTES;
    this.showPopup = true;

    // ปัดคะแนนเป็นจำนวนเต็มก่อนบันทึก
    const finalScore = Math.floor(this.score);

    this.apiService
      .updateActivity({
        minute: this.WORKOUT_DURATION_MINUTES,
        score: finalScore,
      })
      .subscribe({
        next: () => console.log('Activity updated successfully!'),
        error: (err) => console.error('Failed to update activity', err),
      });

    // หยุดวิดีโอต้นแบบ
    this.safePauseRefVideo();
  }

  /** ========== Main Loop ========== */

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
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const now = performance.now();

    // Detect pose
    const results = this.landmarker.detectForVideo(video, now);

    // Draw camera
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw camera
    ctx.clearRect(0, 0, canvas.width, canvas.height); // --- V V V เพิ่มโค้ดส่วนนี้เพื่อกลับด้านภาพ V V V ---

    ctx.save(); // 1. บันทึกสถานะของ canvas ไว้ก่อน
    ctx.scale(-1, 1); // 2. กลับด้านในแนวนอน (แกน X)
    ctx.translate(-canvas.width, 0); // 3. ย้ายจุดอ้างอิงกลับมาที่มุมซ้ายบน // วาดวิดีโอ (ซึ่งตอนนี้จะถูกกลับด้านแล้ว)

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.restore(); // 4. คืนสถานะเดิม เพื่อให้ข้อความ (คะแนน, เวลา) ไม่กลับด้านไปด้วย // --- ^ ^ ^ สิ้นสุดส่วนที่เพิ่ม ^ ^ ^ ---
    // Responsive font/margin
    const margin = canvas.width * 0.04;
    const mainFontSize = canvas.width * 0.05;
    const smallFontSize = canvas.width * 0.04;

    // Draw standing box
    if (this.standingBox) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 4;
      ctx.strokeRect(
        this.standingBox.x,
        this.standingBox.y,
        this.standingBox.width,
        this.standingBox.height
      );
    }

    const hasPose =
      results.landmarks &&
      Array.isArray(results.landmarks) &&
      results.landmarks.length > 0;

    if (this.phase === 'precheck') {
      if (hasPose) {
        const lm = results.landmarks[0];
        const pass = this.isFullBodyVisibleInBox(lm, canvas);
        if (pass) {
          this.precheckFrames++;
        } else {
          this.precheckFrames = 0;
        }

        // แสดง Progress Precheck
        const progress = Math.min(
          this.precheckFrames / this.PRECHECK_REQUIRED_FRAMES,
          1.0
        );
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(
          canvas.width * 0.2,
          canvas.height * 0.08,
          canvas.width * 0.6,
          14
        );
        ctx.fillStyle = 'lime';
        ctx.fillRect(
          canvas.width * 0.2,
          canvas.height * 0.08,
          canvas.width * 0.6 * progress,
          14
        );
        ctx.font = `${smallFontSize}px Kanit, Arial`;
        ctx.fillStyle = 'Black';
        ctx.textAlign = 'center';
        ctx.fillText(
          'ยืนให้เห็นครบทั้งตัวในกรอบสักครู่...',
          canvas.width / 2,
          canvas.height * 0.08 - 20
        );

        if (this.precheckFrames >= this.PRECHECK_REQUIRED_FRAMES) {
          this.precheckPassed = true;
          // เริ่มจริง: เวลา/คะแนน/วิดีโอต้นแบบ
          this.startWorkoutRun();
        }
      } else {
        this.precheckFrames = 0;
        ctx.font = `${smallFontSize}px Kanit, Arial`;
        ctx.fillStyle = 'orange';
        ctx.textAlign = 'center';
        ctx.fillText(
          'ไม่พบร่างกาย ให้ถอย/ขยับเพื่อให้เห็นครบในกรอบ',
          canvas.width / 2,
          canvas.height * 0.5
        );
      }
      return; // ยังไม่เก็บคะแนนใน Precheck
    }

    if (this.phase === 'running' && hasPose) {
      const currentLandmarks = results.landmarks[0];

      // ตรวจอยู่ในกรอบก่อน
      const inside = this.anyKeypointInsideBox(currentLandmarks, video);
      if (!inside) {
        this.isMoving = false;
        this.lastLandmarks = null; // เพิ่มบรรทัดนี้เพื่อรีเซ็ต!
        ctx.fillStyle = 'orange';
        ctx.font = `${smallFontSize}px Kanit, Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
          'อยู่ในกรอบเพื่อให้คะแนน',
          ctx.canvas.width / 2,
          ctx.canvas.height * 0.5
        );
      } else {
        // คำนวณการขยับ
        this.detectMovementAndScore(currentLandmarks);
      }
    }

    // วาดเวลา (ย้ายไปอัปเดตตัวแปรอย่างเดียว)
    if (this.phase !== 'finished') {
      const minutes = Math.floor(this.timer / 60);
      const seconds = this.timer % 60;
      // This line now correctly updates the public property
      this.formattedTime = `Time: ${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /** ========== Movement / Visibility Helpers ========== */

  /** เช็คว่า “เห็นครบทั้งตัวในกรอบ” อย่างคร่าว ๆ
   * - มี keypoints สำคัญครบ (หัว/ข้อมือ/ข้อเท้า/ไหล่/สะโพก)
   * - keypoints ส่วนใหญ่ต้องอยู่ “ในกรอบยืน”
   * - Bounding box ของร่างกายต้องไม่เตี้ยเกิน (เลี่ยงกรณีครอปครึ่งตัว)
   */
  private isFullBodyVisibleInBox(
    landmarks: any[],
    canvas: HTMLCanvasElement
  ): boolean {
    if (!this.standingBox) return false;

    // --- 1. แก้ไขตรงนี้: เอาข้อเท้า (27, 28) ออกจากจุดที่ต้องเช็ค ---
    const requiredIdx = [0, 11, 12, 15, 16, 23, 24]; // nose, shoulders, wrists, hips

    const existCount = requiredIdx.filter((i) => !!landmarks[i]).length;
    if (existCount / requiredIdx.length < this.REQUIRED_KEYPOINT_COVERAGE)
      return false;

    // ทุกจุดควรอยู่ในกรอบ (อนุโลมเล็กน้อย)
    const padX = this.standingBox.width * this.BOX_INNER_PADDING;
    const padY = this.standingBox.height * this.BOX_INNER_PADDING;

    const inBox = requiredIdx.every((i) => {
      const p = landmarks[i];
      const px = p.x * canvas.width;
      const py = p.y * canvas.height;
      return (
        px >= this.standingBox!.x + padX &&
        px <= this.standingBox!.x + this.standingBox!.width - padX &&
        py >= this.standingBox!.y + padY &&
        py <= this.standingBox!.y + this.standingBox!.height - padY
      );
    });

    if (!inBox) return false;

    // --- 2. แก้ไขตรงนี้: ลดความสูงขั้นต่ำที่ต้องการเห็นในกรอบ ---
    const pts = requiredIdx
      .map((i) => landmarks[i])
      .map((p) => ({
        x: p.x * canvas.width,
        y: p.y * canvas.height,
      }));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    const bodyHeight = maxY - minY;

    // ปรับจาก 0.55 เป็น 0.35 ให้เช็คแค่ "หัวถึงสะโพก" ก็พอ
    const minRequired = this.standingBox.height * 0.35;

    return bodyHeight >= minRequired;
  }

  /** อย่างน้อยหนึ่งจุดสำคัญต้องอยู่ในกรอบ (ใช้เป็น gate ก่อนคิดคะแนน) */
  private anyKeypointInsideBox(
    landmarks: any[],
    video: HTMLVideoElement
  ): boolean {
    if (!this.standingBox) return false;
    const idx = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

    for (const i of idx) {
      const p = landmarks[i];
      if (!p) continue;
      const px = p.x * video.videoWidth;
      const py = p.y * video.videoHeight;
      if (
        px >= this.standingBox.x &&
        px <= this.standingBox.x + this.standingBox.width &&
        py >= this.standingBox.y &&
        py <= this.standingBox.y + this.standingBox.height
      ) {
        return true;
      }
    }
    return false;
  }
  private detectMovementAndScore(currentLandmarks: any[]) {
    if (!this.lastLandmarks) {
      this.isMoving = false;
      this.lastLandmarks = currentLandmarks;
      return;
    }

    // ฟังก์ชันคำนวณระยะทางรวม (2D)
    const calculateDistance = (indices: number[]): number => {
      let totalDistance = 0;
      let count = 0;
      for (const i of indices) {
        const p1 = this.lastLandmarks![i];
        const p2 = currentLandmarks[i];
        if (p1 && p2) {
          totalDistance += Math.hypot(p2.x - p1.x, p2.y - p1.y);
          count++;
        }
      }
      return count > 0 ? totalDistance / count : 0;
    };

    // ✨ เพิ่ม: ฟังก์ชันคำนวณระยะทางเฉพาะ "แนวตั้ง" สำหรับการย่ำเท้า
    const calculateVerticalDistance = (indices: number[]): number => {
      let totalDistance = 0;
      let count = 0;
      for (const i of indices) {
        const p1 = this.lastLandmarks![i];
        const p2 = currentLandmarks[i];
        if (p1 && p2) {
          totalDistance += Math.abs(p2.y - p1.y); // ใช้แค่แกน Y
          count++;
        }
      }
      return count > 0 ? totalDistance / count : 0;
    };

    // 1. แยกกลุ่มข้อต่อ
    const bodyIndices = [11, 12, 23, 24]; // ไหล่, สะโพก
    const armIndices = [13, 14, 15, 16]; // ข้อศอก, ข้อมือ
    const ankleIndices = [27, 28]; // ✨ เพิ่ม: ข้อเท้าอย่างเดียวสำหรับย่ำเท้า

    // 2. คำนวณระยะการขยับของแต่ละส่วน
    const bodyMovement = calculateDistance(bodyIndices);
    const armMovement = calculateDistance(armIndices);
    const footStompMovement = calculateVerticalDistance(ankleIndices); // ✨ เพิ่ม: คำนวณการขยับย่ำเท้า

    // 3. คำนวณคะแนนที่จะได้ในรอบนี้
    let scoreToAdd = 0;
    if (bodyMovement > 0.06) {
      scoreToAdd += 0.5;
    }
    if (armMovement > 0.08) {
      scoreToAdd += 0.5;
    }
    // ✨ เพิ่ม: เกณฑ์การให้คะแนนสำหรับการย่ำเท้า
    if (footStompMovement > 0.04) {
      scoreToAdd += 0.5;
    }

    this.isMoving = scoreToAdd > 0;

    // 4. เช็ค Cooldown ก่อนบวกคะแนน
    const now = performance.now();
    if (scoreToAdd > 0 && now - this.lastScoreTime > this.SCORE_COOLDOWN_MS) {
      this.score += scoreToAdd;
      this.lastScoreTime = now;
    }

    this.lastLandmarks = currentLandmarks;
  }

  /** ========== Ref Video Controls ========== */
  private safePlayRefVideo() {
    const v = this.refVideo?.nativeElement;
    if (!v) return;
    try {
      v.currentTime = 0;
      v.play().catch(() => {});
    } catch {}
  }

  private safePauseRefVideo() {
    const v = this.refVideo?.nativeElement;
    if (!v) return;
    try {
      v.pause();
    } catch {}
  }
}
