import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class Quiz implements OnInit, OnDestroy {
  // --- Properties ---
  questions: string[] = [
    '1. แพทย์เคยบอก หรือไม่ว่า ท่านมีภาวะโรคหัวใจ และ ท่านควร ทำกิจกรรมทางกายตามคำแนะนำของแพทย์เท่านั้น',
    '2. ท่านรู้สึกเจ็บหน้าอกขณะทำกิจกรรมทางกายหรือไม่',
    '3. ในเดือนที่ผ่านมา ท่านมีอาการเจ็บหน้าอกขณะที่ไม่ได้ทำกิจกรรมทางกายหรือไม่',
    '4. ท่านเคยมีประวัติการหมดสติ หรือล้มจากอาการเวียนศีรษะหรือไม่',
    '5. ท่านมีปัญหาเรื่องกระดูกหรือข้อต่อ (เช่น หลัง เข่า หรือสะโพก) ที่อาจจะมีอาการแย่ลงจากการทำกิจกรรมทางกายหรือไม่',
    '6. แพทย์เคยสั่งยาสำหรับภาวะความดันโลหิตสูงหรือโรคหัวใจหรือไม่',
    '7. ท่านมีเหตุผลอื่นใดที่ท่านไม่ควรทำกิจกรรมทางกายหรือไม่',
  ];

  initialAnswers: ('yes' | 'no' | null)[];
  answers: ('yes' | 'no' | null)[];
  currentIndex = 0;
  isQuizFinished = false;
  quizResult: 'passed' | 'failed' | null = null;
  synth: SpeechSynthesis;

  // --- NEW: Speech Synthesis Settings ---
  speechRate: number = 1.0; // Property for speech rate
  speechPitch: number = 1.0; // Property for speech pitch
  thaiVoice: SpeechSynthesisVoice | null = null; // To store the selected Thai voice

  constructor(private router: Router) {
    this.initialAnswers = Array(this.questions.length).fill(null);
    this.answers = [...this.initialAnswers];
    this.synth = window.speechSynthesis;

    // --- NEW: Load voices when they are ready ---
    // Voices are loaded asynchronously, so we listen for the 'voiceschanged' event.
    this.synth.onvoiceschanged = () => {
      this.loadAndSetVoice();
    };
    // Also try to load them immediately in case they are already available.
    this.loadAndSetVoice();
  }

  /**
   * NEW: Finds and sets a preferred Thai female voice.
   */
  loadAndSetVoice(): void {
    const voices = this.synth.getVoices();
    if (!voices.length) {
      return; // Voices not ready yet.
    }
    // We prefer "Kanya" as it's a common high-quality Thai voice in Chrome.
    const preferredVoice = voices.find(
      (voice) => voice.lang === 'th-TH' && voice.name.includes('Kanya')
    );

    if (preferredVoice) {
      this.thaiVoice = preferredVoice;
    } else {
      // Fallback to the first available Thai voice if Kanya is not found.
      this.thaiVoice = voices.find((voice) => voice.lang === 'th-TH') || null;
    }
  }

  /**
   * UPDATED: Reads text using the selected voice and settings.
   * @param textToSpeak The text to be read.
   */
  speak(textToSpeak: string): void {
    if (!('speechSynthesis' in window) || !textToSpeak) {
      return;
    }

    if (this.synth.speaking) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'th-TH';
    utterance.rate = this.speechRate; // Use property for rate
    utterance.pitch = this.speechPitch; // Use property for pitch

    // **KEY CHANGE**: Assign the specific Thai voice we found.
    if (this.thaiVoice) {
      utterance.voice = this.thaiVoice;
    }

    this.synth.speak(utterance);
  }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    setTimeout(() => this.speak(this.currentQuestion), 200);
  }

  ngOnDestroy(): void {
    if (this.synth?.speaking) {
      this.synth.cancel();
    }
  }

  // --- Quiz Logic (No changes below this line) ---
  get currentQuestion(): string {
    return this.questions[this.currentIndex];
  }

  onBack(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.speak(this.currentQuestion);
    }
  }

  onNext(): void {
    if (!this.answers[this.currentIndex]) return;

    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.speak(this.currentQuestion);
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz(): void {
    const hasFailed = this.answers.includes('yes');
    let resultText = '';

    if (hasFailed) {
      this.quizResult = 'failed';
      resultText =
        'เสียใจด้วย สุขภาพของคุณยังไม่พร้อมสำหรับการใช้งานเเอพพลิเคชั่นไว้กลับมาใหม่เร็วๆนี้นะคะ';
    } else {
      this.quizResult = 'passed';
      resultText =
        'ยอดเยี่ยม! คุณพร้อมสำหรับการออกกำลังกาย กำลังนำคุณไปสู่หน้าถัดไป';
      setTimeout(() => {
        this.router.navigate(['/welcome']);
      }, 2500);
    }

    this.isQuizFinished = true;
    this.speak(resultText);
  }

  restartQuiz(): void {
    this.currentIndex = 0;
    this.answers = [...this.initialAnswers];
    this.isQuizFinished = false;
    this.quizResult = null;
    setTimeout(() => this.speak(this.currentQuestion), 200);
  }
}
