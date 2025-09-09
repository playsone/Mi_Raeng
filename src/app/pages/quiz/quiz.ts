import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.scss'],
})
export class Quiz {
  questions: string[] = [
    "1. คุณเคยได้รับทาบทามจากแพทย์ว่าเป็นโรคเกี่ยวกับโรคหัวใจหรือความดันโลหิตสูง",
    "2. คุณรู้สึกเจ็บที่หน้าอกในขณะพัก หรือระหว่างมีกิจกรรมในชีวิตประจำวัน หรือระหว่างออกกำลังกาย",
    "3. ในรอบ 12 เดือนที่ผ่านมา คุณเคยเวียนศีรษะจนจะเสียการทรงตัว หรือเป็นลมไปรู้สึกตัว หรือไม่",
    "4. คุณได้รับการวินิจฉัยว่าเป็นโรคเรื้อรังนอกเหนือจากโรคหัวใจหรือโรคความดันโลหิตสูง หรือไม่",
    "5. ปัจจุบันคุณได้รับประทานยาเพื่อรักษาโรคเรื้อรัง หรือไม่",
    "6. ปัจจุบัน หรือ ในรอบ 12 เดือนที่ผ่านมา คุณมีปัญหาเรื่องกระดูกและข้อหรือกล้ามเนื้อเส้นเอ็น ซึ่งอาการจะแย่ลงเมื่อมีกิจกรรมทางกายเพิ่มขึ้นหรือไม่",
    "7. แพทย์เคยบอกคุณว่า คุณควรได้รับคำแนะนำก่อนที่จะมีกิจกรรมทางกายหรือออกกำลังกาย"
  ];

  currentIndex = 0;
  answers: ('yes' | 'no' | null)[] = Array(this.questions.length).fill(null);

  get currentQuestion(): string {
    return this.questions[this.currentIndex];
  }

  onNext() {
    if (!this.answers[this.currentIndex]) return; // ต้องเลือกก่อน
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    } else {
      // ถึงข้อสุดท้ายแล้ว
      console.log('คำตอบทั้งหมด:', this.answers);
      alert('ทำแบบประเมินเสร็จแล้ว ขอบคุณครับ');
    }
  }
}
