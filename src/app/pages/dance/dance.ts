import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Pose, Results as PoseResults, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

@Component({
  selector: 'app-dance',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dance.html',
  styleUrls: ['./dance.scss']
})
// ✨ 1. ใช้ชื่อคลาสที่ถูกต้องตามมาตรฐาน
export class Dance implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  isLoading = false;
  statusMessage = 'คลิก "เปิดกล้อง" เพื่อเริ่ม';
  webcamRunning = false;

  private pose!: Pose;
  private canvasCtx!: CanvasRenderingContext2D;
  private videoStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  
  // Inject NgZone เพื่อให้แน่ใจว่าการอัปเดต UI จะเกิดขึ้นอย่างถูกต้อง
  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    // เตรียม MediaPipe ไว้ แต่ยังไม่เริ่มทำงาน
    this.initializeMediaPipe();
    this.canvasCtx = this.canvasElement.nativeElement.getContext('2d')!;
  }

  ngOnDestroy(): void {
    this.stopWebcam();
    if (this.pose) {
      this.pose.close();
    }
  }

  initializeMediaPipe(): void {
    this.pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.pose.onResults((results) => {
        // ✨ 2. ใช้ NgZone เพื่อให้ Angular รู้ว่ามีการเปลี่ยนแปลง
        this.zone.run(() => {
            this.onResults(results);
        });
    });
  }
  
  async toggleWebcam(): Promise<void> {
    if (this.webcamRunning) {
      this.stopWebcam();
    } else {
      await this.startWebcam();
    }
  }
  
  async startWebcam(): Promise<void> {
    this.isLoading = true;
    this.statusMessage = 'กรุณากด "อนุญาต" (Allow) เพื่อใช้กล้อง';
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      
      this.statusMessage = 'กำลังโหลดวิดีโอ...';
      const video = this.videoElement.nativeElement;
      video.srcObject = this.videoStream;
      
      video.onloadedmetadata = () => {
        video.play();
        this.webcamRunning = true;
        this.isLoading = false;
        this.statusMessage = '';
        
        const canvas = this.canvasElement.nativeElement;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        this.predictionLoop();
      };

    } catch (err) {
      console.error("ERROR: ไม่สามารถเข้าถึงกล้องได้!", err);
      this.isLoading = false;
      this.webcamRunning = false;
      this.statusMessage = 'ไม่สามารถเปิดกล้องได้! โปรดตรวจสอบการตั้งค่า';
      alert(this.statusMessage);
    }
  }

  stopWebcam(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.videoStream = null;
    this.webcamRunning = false;
    this.statusMessage = 'คลิก "เปิดกล้อง" เพื่อเริ่ม';
  }

  private predictionLoop(): void {
    if (this.webcamRunning && this.videoElement.nativeElement.readyState >= 3) {
      this.pose.send({ image: this.videoElement.nativeElement });
    }
    this.animationFrameId = requestAnimationFrame(() => this.predictionLoop());
  }

  private onResults(results: PoseResults): void {
    if (!this.canvasCtx || !this.webcamRunning) return;

    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    
    this.canvasCtx.translate(this.canvasElement.nativeElement.width, 0);
    this.canvasCtx.scale(-1, 1);
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    this.canvasCtx.restore();

    if (results.poseLandmarks) {
      const mirroredLandmarks = results.poseLandmarks.map(lm => ({...lm, x: 1 - lm.x }));
      drawConnectors(this.canvasCtx, mirroredLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
      drawLandmarks(this.canvasCtx, mirroredLandmarks, { color: '#FF0000', lineWidth: 2 });
    }
  }

  goBack() {
    this.stopWebcam();
    history.back();
  }
}

