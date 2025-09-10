import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.scss'],
})
export class Quiz {
  // --- Properties ---
 questions: string[] = [
    "1. แพทย์เคยบอกหรือไม่ว่าท่านมีภาวะโรคหัวใจ และท่านควรทำกิจกรรมทางกายตามคำแนะนำของแพทย์เท่านั้น",
    "2. ท่านรู้สึกเจ็บหน้าอกขณะทำกิจกรรมทางกายหรือไม่",
    "3. ในเดือนที่ผ่านมา ท่านมีอาการเจ็บหน้าอกขณะที่ไม่ได้ทำกิจกรรมทางกายหรือไม่",
    "4. ท่านเคยมีประวัติการหมดสติ หรือล้มจากอาการเวียนศีรษะหรือไม่",
    "5. ท่านมีปัญหาเรื่องกระดูกหรือข้อต่อ (เช่น หลัง เข่า หรือสะโพก) ที่อาจจะมีอาการแย่ลงจากการทำกิจกรรมทางกายหรือไม่",
    "6. แพทย์เคยสั่งยาสำหรับภาวะความดันโลหิตสูงหรือโรคหัวใจหรือไม่",
    "7. ท่านมีเหตุผลอื่นใดที่ท่านไม่ควรทำกิจกรรมทางกายหรือไม่"
  ];

  initialAnswers: ('yes' | 'no' | null)[];
  answers: ('yes' | 'no' | null)[];
  currentIndex = 0;
  isQuizFinished = false;
  quizResult: 'passed' | 'failed' | null = null;

  constructor(private router: Router) {
    this.initialAnswers = Array(this.questions.length).fill(null);
    this.answers = [...this.initialAnswers];
  }

  get currentQuestion(): string {
    return this.questions[this.currentIndex];
  }

  onBack(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  onNext(): void {
    if (!this.answers[this.currentIndex]) return;

    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    } else {
      this.finishQuiz();
    }
  }

  /**
   * REVERSED LOGIC: Check for 'yes' answers to fail the quiz.
   */
  finishQuiz(): void {
    // Check if any answer is 'yes'. If so, the user has a health risk.
    const hasFailed = this.answers.includes('yes'); // <-- The main logic change is here!

    if (hasFailed) {
      // If there is even one 'yes', the user fails and should consult a doctor.
      this.quizResult = 'failed';
    } else {
      // If all answers are 'no', the user passes and is ready.
      this.quizResult = 'passed';
      
      // Navigate to the welcome page after a short delay.
      setTimeout(() => {
        this.router.navigate(['/welcome']);
      }, 2500); 
    }

    this.isQuizFinished = true;
  }

  restartQuiz(): void {
    this.currentIndex = 0;
    this.answers = [...this.initialAnswers];
    this.isQuizFinished = false;
    this.quizResult = null;
  }
}