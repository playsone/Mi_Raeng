import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dance.html',
  styleUrls: ['./dance.scss'],
})
export class Dance implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // --- Properties for MediaPipe ---
  private landmarker: any;
  private filesetResolver: any;
  private rafId = 0;
  private running = false;
  private lastTs = -1;

  // --- Properties for UI & State ---
  state = 'up';
  reps = 0;
  warnBack = false;
  isLoading = true;
  webcamRunning = false;
  statusMessage: string | null = null;
  safeYouTubeUrl: SafeResourceUrl;

  // --- Properties for Movement Logic ---
  private kneeEMA = new EMA(0.25);
  private backEMA = new EMA(0.25);
  private bottomHold = 0;
  private downThresh = 150;
  private bottomThresh = 135;
  private upThresh = 165;
  private holdFrames = 3;
  private backOkThresh = 165;
  private backBadFrames = 6;
  private backBadCount = 0;

  constructor(private zone: NgZone, private sanitizer: DomSanitizer) {
    // **เปลี่ยน ID วิดีโอ YouTube ของคุณที่นี่**
    const videoUrl = 'https://www.youtube.com/embed/-rUD9jpq8Qo';
    this.safeYouTubeUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  async ngAfterViewInit() {
    try {
      await this.initCamera();
      await this.loadPose();
      this.running = true;
      this.webcamRunning = true;
      this.loop();
    } catch (error: any) {
      console.error('Failed to initialize component:', error);
      this.isLoading = false;
      this.statusMessage =
        'ไม่สามารถเริ่มกล้องได้ โปรดตรวจสอบว่าคุณได้อนุญาตการเข้าถึงกล้องในเบราว์เซอร์แล้ว';
    }
  }

  ngOnDestroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    if (this.videoRef?.nativeElement?.srcObject) {
      const stream = this.videoRef.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  private async initCamera() {
    this.statusMessage = 'กำลังขออนุญาตใช้กล้อง...';
    const video = this.videoRef.nativeElement;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    video.srcObject = stream;
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve(true);
      };
    });

    const canvas = this.canvasRef.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    this.statusMessage = null;
  }

  private async loadPose() {
    this.isLoading = true;
    this.statusMessage = 'กำลังโหลดโมเดล AI...';
    // @ts-ignore
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest');
    this.filesetResolver = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');

    this.landmarker = await vision.PoseLandmarker.createFromOptions(
      this.filesetResolver,
      {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }
    );
    this.isLoading = false;
    this.statusMessage = null;
  }

  private loop = () => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    this.zone.runOutsideAngular(() => this.process());
  };

  private process() {
    if (!this.landmarker || !this.videoRef) return;
    const video = this.videoRef.nativeElement;
    if (video.readyState < 2) return;
    const now = performance.now();
    if (this.lastTs === now) return;
    this.lastTs = now;
    const res = this.landmarker.detectForVideo(video, now);
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (!res || !res.landmarks || res.landmarks.length === 0) return;
    const lm = res.landmarks[0];
    drawSkeleton(ctx, lm);
    const w = canvas.width,
      h = canvas.height;
    const getPx = (i: number) => ({
      x: lm[i].x * w,
      y: lm[i].y * h,
      v: lm[i].visibility ?? 1,
    });
    const IDX = {
      LEFT_SHOULDER: 11,
      RIGHT_SHOULDER: 12,
      LEFT_HIP: 23,
      RIGHT_HIP: 24,
      LEFT_KNEE: 25,
      RIGHT_KNEE: 26,
      LEFT_ANKLE: 27,
      RIGHT_ANKLE: 28,
    };
    const lp = {
      left_shoulder: getPx(IDX.LEFT_SHOULDER),
      right_shoulder: getPx(IDX.RIGHT_SHOULDER),
      left_hip: getPx(IDX.LEFT_HIP),
      right_hip: getPx(IDX.RIGHT_HIP),
      left_knee: getPx(IDX.LEFT_KNEE),
      right_knee: getPx(IDX.RIGHT_KNEE),
      left_ankle: getPx(IDX.LEFT_ANKLE),
      right_ankle: getPx(IDX.RIGHT_ANKLE),
    };
    const leftKnee = angle3(lp.left_hip, lp.left_knee, lp.left_ankle);
    const rightKnee = angle3(lp.right_hip, lp.right_knee, lp.right_ankle);
    const kneeRaw = minIgnoreNone(leftKnee, rightKnee);
    const leftBack = angle3(lp.left_shoulder, lp.left_hip, lp.left_knee);
    const rightBack = angle3(lp.right_shoulder, lp.right_hip, lp.right_knee);
    const backRaw = maxIgnoreNone(leftBack, rightBack);
    const kneeAngle = this.kneeEMA.update(kneeRaw ?? undefined);
    const backAngle = this.backEMA.update(backRaw ?? undefined);
    let nextState = this.state;
    let nextReps = this.reps;
    if (kneeAngle != null) {
      if (this.state === 'up' && kneeAngle < this.downThresh)
        nextState = 'down';
      if (this.state === 'down' || this.state === 'bottom') {
        if (kneeAngle < this.bottomThresh) {
          this.bottomHold += 1;
          nextState = 'bottom';
        } else {
          this.bottomHold = 0;
        }
      }
      if (
        (this.state === 'down' || this.state === 'bottom') &&
        kneeAngle > this.upThresh
      ) {
        if (this.bottomHold >= this.holdFrames) nextReps += 1;
        nextState = 'up';
        this.bottomHold = 0;
      }
    }
    let warn = this.warnBack;
    if (backAngle != null) {
      if (backAngle < this.backOkThresh) this.backBadCount += 1;
      else this.backBadCount = 0;
      warn = this.backBadCount >= this.backBadFrames;
    }
    const rows = [
      `Knee: ${num(kneeAngle)}°`,
      `Back: ${num(backAngle)}°`,
      `State: ${nextState}`,
      `Reps: ${nextReps}`,
      warn ? `⚠ Back: keep straight` : `Back: OK`,
    ];
    drawPanel(ctx, rows);
    this.zone.run(() => {
      this.state = nextState;
      this.reps = nextReps;
      this.warnBack = warn;
    });
  }
}

// --- Helper Functions and Classes (วางไว้นอก Class แต่ในไฟล์เดียวกัน) ---

class EMA {
  private v: number | null = null;
  constructor(private alpha = 0.2) {}
  update(x?: number): number | null {
    if (x == null) return this.v;
    if (this.v == null) this.v = x;
    else this.v = this.alpha * x + (1 - this.alpha) * this.v;
    return this.v;
  }
}

function angle3(
  a?: { x: number; y: number },
  b?: { x: number; y: number },
  c?: { x: number; y: number }
) {
  if (!a || !b || !c) return null;
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const nba = Math.hypot(ba.x, ba.y);
  const nbc = Math.hypot(bc.x, bc.y);
  if (nba === 0 || nbc === 0) return null;
  let cos = (ba.x * bc.x + ba.y * bc.y) / (nba * nbc);
  cos = Math.max(-1, Math.min(1, cos));
  return (Math.acos(cos) * 180) / Math.PI;
}

function minIgnoreNone(a: number | null, b: number | null) {
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}

function maxIgnoreNone(a: number | null, b: number | null) {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.closePath();
}

function drawPanel(ctx: CanvasRenderingContext2D, lines: string[]) {
  const x = 10,
    y0 = 26;
  ctx.save();
  ctx.font = '16px system-ui, sans-serif';
  const w = 260,
    h = 28 * lines.length + 12;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(x - 6, y0 - 24, w, h);
  ctx.fillStyle = '#111';
  lines.forEach((t, i) => ctx.fillText(t, x, y0 + i * 28));
  ctx.restore();
}

function num(v: number | null) {
  return v == null ? '-' : v.toFixed(1);
}

const SKELETON_PAIRS: [number, number][] = [
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  lm: Array<{ x: number; y: number; visibility?: number }>
) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'lime';
  SKELETON_PAIRS.forEach(([a, b]) => {
    const pa = lm[a],
      pb = lm[b];
    if (!pa || !pb) return;
    const va = (pa.visibility ?? 1) > 0.3;
    const vb = (pb.visibility ?? 1) > 0.3;
    if (!va || !vb) return;
    ctx.beginPath();
    ctx.moveTo(pa.x * ctx.canvas.width, pa.y * ctx.canvas.height);
    ctx.lineTo(pb.x * ctx.canvas.width, pb.y * ctx.canvas.height);
    ctx.stroke();
  });
  ctx.restore();
}

