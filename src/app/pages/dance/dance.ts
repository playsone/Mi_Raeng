import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
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
export class Dance implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  isLoading = false;
  webcamRunning = false;
  
  private pose!: Pose;
  private canvasCtx!: CanvasRenderingContext2D;
  private videoStream: MediaStream | null = null;

  ngOnInit(): void {
    this.pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.pose.onResults(this.onResults.bind(this));
  }

  ngOnDestroy(): void {
    this.stopWebcam();
    this.pose.close();
  }

  async toggleWebcam(): Promise<void> {
    if (this.webcamRunning) {
      this.stopWebcam();
    } else {
      await this.startWebcam();
    }
  }

  private async startWebcam(): Promise<void> {
    this.isLoading = true;
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      this.videoElement.nativeElement.srcObject = this.videoStream;
      this.videoElement.nativeElement.play();
      this.webcamRunning = true;

      this.videoElement.nativeElement.onloadedmetadata = () => {
        this.isLoading = false;
        // ปรับขนาด canvas ให้เท่ากับ video
        this.canvasElement.nativeElement.width = this.videoElement.nativeElement.videoWidth;
        this.canvasElement.nativeElement.height = this.videoElement.nativeElement.videoHeight;
        this.canvasCtx = this.canvasElement.nativeElement.getContext('2d')!;
        this.predictionLoop();
      };
    } catch (err) {
      console.error("Error accessing webcam:", err);
      this.isLoading = false;
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาต");
    }
  }

  private stopWebcam(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.webcamRunning = false;
  }

  private predictionLoop(): void {
    if (this.webcamRunning) {
      this.pose.send({ image: this.videoElement.nativeElement });
      requestAnimationFrame(this.predictionLoop.bind(this));
    }
  }

  private onResults(results: PoseResults): void {
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    
    // พลิกภาพแนวนอน (mirror) ให้เหมือนกล้องส่องกระจก
    this.canvasCtx.translate(this.canvasElement.nativeElement.width, 0);
    this.canvasCtx.scale(-1, 1);
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    
    // พลิกภาพกลับเพื่อวาด skeleton ให้ถูกต้อง
    this.canvasCtx.translate(this.canvasElement.nativeElement.width, 0);
    this.canvasCtx.scale(-1, 1);

    if (results.poseLandmarks) {
      // วาดเส้นเชื่อม
      drawConnectors(this.canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
      // วาดจุด
      drawLandmarks(this.canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });

      // คำนวณและแสดงผล (เหมือนใน Python)
      const landmarks = results.poseLandmarks;
      const h = this.canvasElement.nativeElement.height;
      const w = this.canvasElement.nativeElement.width;

      const getCoords = (id: number) => [landmarks[id].x * w, landmarks[id].y * h];

      // มุมเข่าซ้าย
      const leftHip = getCoords(23);
      const leftKnee = getCoords(25);
      const leftAnkle = getCoords(27);
      const leftKneeAngle = this.calcAngle(leftHip, leftKnee, leftAnkle);
      
      this.drawLabel(`Knee Angle (L): ${leftKneeAngle.toFixed(1)}`, {x: 10, y: 30}, leftKneeAngle > 160);

      // มุมเข่าขวา
      const rightHip = getCoords(24);
      const rightKnee = getCoords(26);
      const rightAnkle = getCoords(28);
      const rightKneeAngle = this.calcAngle(rightHip, rightKnee, rightAnkle);
      this.drawLabel(`Knee Angle (R): ${rightKneeAngle.toFixed(1)}`, {x: 10, y: 60}, rightKneeAngle > 160);
    }
    this.canvasCtx.restore();
  }

  // --- Helper Functions (แปลงมาจาก Python) ---
  private calcAngle(a: number[], b: number[], c: number[]): number {
    const rad = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let angle = Math.abs(rad * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }
  
  private drawLabel(text: string, org: {x: number, y: number}, good: boolean): void {
    const color = good ? 'rgb(0, 200, 0)' : 'rgb(220, 0, 0)';
    this.canvasCtx.font = 'bold 24px Nunito';
    this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.canvasCtx.fillRect(org.x - 5, org.y - 25, 300, 35);
    this.canvasCtx.fillStyle = color;
    this.canvasCtx.fillText(text, org.x, org.y);
  }

  goBack() {
    history.back();
  }
}
