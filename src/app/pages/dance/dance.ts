import { Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api';
import { ROUTINE, ExerciseStep } from './routine';
import * as visionModule from '@mediapipe/tasks-vision';

@Component({
  selector: 'app-dance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dance.html',
  styleUrls: ['./dance.scss'],
})
export class Dance implements OnDestroy {
  // --- Services and View Elements ---
  private zone = inject(NgZone);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // --- MediaPipe and Camera State ---
  private landmarker: any;
  private vision: any;   // 👈 ใช้เก็บ vision module
  private running = false;
  private rafId = 0;

  // --- Exercise Engine State ---
  routine = ROUTINE;
  currentStepIndex = 0;

  // UI State
  isLoading = true;
  statusMessage = 'กำลังโหลดโมเดล AI...';
  safeYouTubeUrl: SafeResourceUrl;

  // Progress Trackers
  progressCounter = 0;
  holdStartTime = 0;
  totalWorkoutSeconds = 0;
  repState = 'neutral';

  constructor() {
    const videoUrl = 'https://www.youtube.com/embed/-rUD9jpq8Qo?autoplay=1&mute=1&controls=0&loop=1';
    this.safeYouTubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
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
      this.startTotalTimer();
    } catch (error) {
      console.error("Initialization failed:", error);
      this.statusMessage = 'เกิดข้อผิดพลาดในการเริ่มต้น';
    }
  }

  ngOnDestroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    const stream = this.videoRef?.nativeElement?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  private async initCamera() {
  const video = this.videoRef.nativeElement;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  });
  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      this.zone.run(() => {
        this.statusMessage = '';    // 👈 เคลียร์ข้อความ
        this.isLoading = false;     // 👈 ปิด loading state
      });
      resolve(null);
    };
  });

  await video.play();
  const canvas = this.canvasRef.nativeElement;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}


  private async loadPoseLandmarker() {
  this.vision = visionModule; // ✅ เก็บไว้ใช้งาน

  const filesetResolver = await this.vision.FilesetResolver.forVisionTasks(
    // ใช้ path wasm จาก node_modules หรือ CDN ก็ได้
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
  );

  this.landmarker = await this.vision.PoseLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    resultCallback: (results: any) => {
      this.handleResults(results);
    }
  });
}
  handleResults(results: any) {
    throw new Error('Method not implemented.');
  }

  private startTotalTimer() {
    const interval = setInterval(() => {
      if (!this.running) {
        clearInterval(interval);
        return;
      }
      this.totalWorkoutSeconds++;
    }, 1000);
  }

  finishExercise() {
    this.running = false;
    const minutes = Math.ceil(this.totalWorkoutSeconds / 60);
    const score = this.calculateScore();
    this.statusMessage = `เยี่ยมมาก! คุณใช้เวลาไป ${minutes} นาที ได้ ${score} คะแนน`;
    this.apiService.updateActivity({ minute: minutes, score: score }).subscribe({
      next: () => {
        console.log("Activity updated successfully!");
        setTimeout(() => this.router.navigate(['/home']), 3000);
      },
      error: (err) => {
        console.error("Failed to update activity", err);
        setTimeout(() => this.router.navigate(['/home']), 3000);
      }
    });
  }

  private calculateScore(): number {
    const baseScore = (this.currentStepIndex + 1) * 100;
    const timePenalty = this.totalWorkoutSeconds;
    return Math.max(0, baseScore - timePenalty);
  }

  private loop = () => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    this.zone.runOutsideAngular(() => this.processFrame());
  };

  private processFrame() {
    if (!this.landmarker || !this.videoRef?.nativeElement || this.videoRef.nativeElement.readyState < 2) return;
    const video = this.videoRef.nativeElement;
    const results = this.landmarker.detectForVideo(video, performance.now());
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.landmarks && results.landmarks.length > 0) {
      const lm = results.landmarks[0];
      if (this.currentStepIndex < this.routine.length) {
        const currentStep = this.routine[this.currentStepIndex];
        this.detectPose(currentStep, lm);
      }
    }
  }

  private detectPose(step: ExerciseStep, lm: any[]) {
    let isPoseCorrect = false;
    const w = this.canvasRef.nativeElement.width, h = this.canvasRef.nativeElement.height;
    const getPx = (i: number) => ({ x: lm[i].x * w, y: lm[i].y * h, visibility: lm[i].visibility });

    const p = {
      leftShoulder: getPx(11), rightShoulder: getPx(12),
      leftElbow: getPx(13), rightElbow: getPx(14),
      leftWrist: getPx(15), rightWrist: getPx(16),
      leftHip: getPx(23), rightHip: getPx(24),
      leftKnee: getPx(25), rightKnee: getPx(26),
      leftAnkle: getPx(27), rightAnkle: getPx(28),
      leftHeel: getPx(29), rightHeel: getPx(30),
      leftFootIndex: getPx(31), rightFootIndex: getPx(32)
    };

    const detectorFunction = (this as any)[step.detector];
    if (typeof detectorFunction === 'function') {
      if (step.type === 'hold') {
        isPoseCorrect = detectorFunction.call(this, p);
      } else {
        detectorFunction.call(this, p);
      }
    } else {
      console.warn(`Detector function ${step.detector} not implemented! Skipping.`);
      this.advanceToNextStep();
    }

    if (step.type === 'hold') {
      if (isPoseCorrect) {
        if (this.holdStartTime === 0) this.holdStartTime = performance.now();
        const elapsedSeconds = Math.floor((performance.now() - this.holdStartTime) / 1000);
        this.zone.run(() => this.progressCounter = elapsedSeconds);
        if (this.progressCounter >= step.target) {
          this.advanceToNextStep();
        }
      } else {
        this.holdStartTime = 0;
        this.zone.run(() => this.progressCounter = 0);
      }
    }
  }

  private advanceToNextStep() {
    this.progressCounter = 0;
    this.holdStartTime = 0;
    this.repState = 'neutral';
    if (this.currentStepIndex < this.routine.length - 1) {
      this.currentStepIndex++;
    } else {
      this.finishExercise();
    }
    this.zone.run(() => { });
  }

  // --- Detector Functions (เหมือนเดิม) ---
  private detectBodyStretchUp = (p: any): boolean => {
    const leftShoulderAngle = angle3(p.leftHip, p.leftShoulder, p.leftElbow);
    const rightShoulderAngle = angle3(p.rightHip, p.rightShoulder, p.rightElbow);
    const leftElbowAngle = angle3(p.leftShoulder, p.leftElbow, p.leftWrist);
    const rightElbowAngle = angle3(p.rightShoulder, p.rightElbow, p.rightWrist);
    return leftShoulderAngle > 150 && rightShoulderAngle > 150 && leftElbowAngle > 150 && rightElbowAngle > 150;
  }

  private detectBodyStretchRight = (p: any): boolean => {
    const isStretchingUp = this.detectBodyStretchUp(p);
    const leftTorsoAngle = angle3(p.leftKnee, p.leftHip, p.leftShoulder);
    return isStretchingUp && leftTorsoAngle < 165;
  }

  private detectBodyStretchLeft = (p: any): boolean => {
    const isStretchingUp = this.detectBodyStretchUp(p);
    const rightTorsoAngle = angle3(p.rightKnee, p.rightHip, p.rightShoulder);
    return isStretchingUp && rightTorsoAngle < 165;
  }
  
  private detectBodyStretchForward = (p: any): boolean => {
    return this.detectBodyStretchUp(p) && p.leftWrist.y < p.leftShoulder.y && p.rightWrist.y < p.rightShoulder.y;
  }

  private detectRightLegStretchFront = (p: any): boolean => {
    const hipAngle = angle3(p.rightShoulder, p.rightHip, p.rightKnee);
    const kneeAngle = angle3(p.rightHip, p.rightKnee, p.rightAnkle);
    return hipAngle < 120 && kneeAngle > 160;
  }

  private detectRightLegStretchSide = (p: any): boolean => {
    const hipAngle = angle3(p.leftHip, p.rightHip, p.rightKnee);
    const kneeAngle = angle3(p.rightHip, p.rightKnee, p.rightAnkle);
    return hipAngle > 150 && kneeAngle > 160;
  }

  private detectRightLegStretchBack = (p: any): boolean => {
    const hipAngle = angle3(p.rightShoulder, p.rightHip, p.rightKnee);
    const kneeAngle = angle3(p.rightHip, p.rightKnee, p.rightAnkle);
    return hipAngle > 190 && kneeAngle > 160;
  }
  
  private detectLeftLegStretchFront = (p: any): boolean => {
    const hipAngle = angle3(p.leftShoulder, p.leftHip, p.leftKnee);
    const kneeAngle = angle3(p.leftHip, p.leftKnee, p.leftAnkle);
    return hipAngle < 120 && kneeAngle > 160;
  }

  private detectLeftLegStretchSide = (p: any): boolean => {
    const hipAngle = angle3(p.rightHip, p.leftHip, p.leftKnee);
    const kneeAngle = angle3(p.leftHip, p.leftKnee, p.leftAnkle);
    return hipAngle > 150 && kneeAngle > 160;
  }

  private detectLeftLegStretchBack = (p: any): boolean => {
    const hipAngle = angle3(p.leftShoulder, p.leftHip, p.leftKnee);
    const kneeAngle = angle3(p.leftHip, p.leftKnee, p.leftAnkle);
    return hipAngle > 190 && kneeAngle > 160;
  }

  private detectMarchInPlace = (p: any) => {
    const hipY = (p.leftHip.y + p.rightHip.y) / 2;
    if (this.repState === 'neutral' && p.leftKnee.y < hipY) this.repState = 'left_up';
    if (this.repState === 'left_up' && p.rightKnee.y < hipY) {
      this.repState = 'neutral';
      this.progressCounter++;
      this.zone.run(() => {});
      if (this.progressCounter >= this.routine[this.currentStepIndex].target) this.advanceToNextStep();
    }
  }
  
  private detectStepTouch = (p: any) => {
    const ankleDist = Math.abs(p.leftAnkle.x - p.rightAnkle.x);
    const shoulderDist = Math.abs(p.leftShoulder.x - p.rightShoulder.x);
    const isWide = ankleDist > shoulderDist * 1.5;
    const isNarrow = ankleDist < shoulderDist * 0.8;
    
    if (this.repState === 'neutral' && isWide) this.repState = 'out';
    if (this.repState === 'out' && isNarrow) {
        this.repState = 'neutral';
        this.progressCounter++;
        this.zone.run(() => {});
        if (this.progressCounter >= this.routine[this.currentStepIndex].target) this.advanceToNextStep();
    }
  }

  private detectLegCurl = (p: any) => {
    const leftKneeAngle = angle3(p.leftHip, p.leftKnee, p.leftAnkle);
    const rightKneeAngle = angle3(p.rightHip, p.rightKnee, p.rightAnkle);
    const curlThreshold = 70;
    if (this.repState === 'neutral' && leftKneeAngle < curlThreshold) this.repState = 'left_curled';
    if (this.repState === 'left_curled' && rightKneeAngle < curlThreshold) {
      this.repState = 'neutral';
      this.progressCounter++;
      this.zone.run(() => {});
      if (this.progressCounter >= this.routine[this.currentStepIndex].target) this.advanceToNextStep();
    }
  }
  
  private detectHeelTouch = (p: any) => {
    const isLeftHeelForward = p.leftHeel.y > p.rightAnkle.y;
    const isRightHeelForward = p.rightHeel.y > p.leftAnkle.y;
    if (this.repState === 'neutral' && isLeftHeelForward) this.repState = 'left_touched';
    if (this.repState === 'left_touched' && isRightHeelForward) {
      this.repState = 'neutral';
      this.progressCounter++;
      this.zone.run(() => {});
      if (this.progressCounter >= this.routine[this.currentStepIndex].target) this.advanceToNextStep();
    }
  }

  private detectSideTap = (p: any) => this.detectStepTouch(p);
  private detectFrontTap = (p: any) => this.detectHeelTouch(p);

  private detectBackTap = (p: any) => {
    const isLeftFootBack = p.leftAnkle.y > p.rightAnkle.y;
    const isRightFootBack = p.rightAnkle.y > p.leftAnkle.y;
    if (this.repState === 'neutral' && isLeftFootBack) this.repState = 'left_tapped';
    if (this.repState === 'left_tapped' && isRightFootBack) {
      this.repState = 'neutral';
      this.progressCounter++;
      this.zone.run(() => {});
      if (this.progressCounter >= this.routine[this.currentStepIndex].target) this.advanceToNextStep();
    }
  }
  
  private detectTwoStep = (p: any) => this.detectStepTouch(p);
}

/* --- Helper Functions --- */
function angle3(a: { x: number, y: number }, b: { x: number, y: number }, c: { x: number, y: number }) {
  if (!a || !b || !c) return 0;
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dotProduct = ba.x * bc.x + ba.y * bc.y;
  const magnitudeBA = Math.hypot(ba.x, ba.y);
  const magnitudeBC = Math.hypot(bc.x, bc.y);
  if (magnitudeBA === 0 || magnitudeBC === 0) return 0;
  let cos = dotProduct / (magnitudeBA * magnitudeBC);
  cos = Math.max(-1, Math.min(1, cos));
  return (Math.acos(cos) * 180) / Math.PI;
}
