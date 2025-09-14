export interface ExerciseStep {
  name: string;
  type: 'hold' | 'reps';
  target: number;
  instructions: string;
  detector: string;
}

export const ROUTINE: ExerciseStep[] = [
  // --- Warm-up Stretches ---
  { name: 'ยืดลำตัว (ขึ้นตรง)', type: 'hold', target: 10, instructions: 'ยกแขนขึ้นตรง', detector: 'detectBodyStretchUp' },
  { name: 'ยืดลำตัว (เอียงขวา)', type: 'hold', target: 10, instructions: 'เอียงไปทางขวา', detector: 'detectBodyStretchRight' },
  { name: 'ยืดลำตัว (เอียงซ้าย)', type: 'hold', target: 10, instructions: 'เอียงไปทางซ้าย', detector: 'detectBodyStretchLeft' },
  { name: 'ยืดลำตัว (ดันไปหน้า)', type: 'hold', target: 10, instructions: 'ดันไปข้างหน้า', detector: 'detectBodyStretchForward' },
  { name: 'ยืดน่องขวา (หน้า)', type: 'hold', target: 10, instructions: 'ยืดน่องขวาไปหน้า', detector: 'detectRightLegStretchFront' },
  { name: 'ยืดน่องขวา (ข้าง)', type: 'hold', target: 10, instructions: 'ยืดน่องขวาไปข้าง', detector: 'detectRightLegStretchSide' },
  { name: 'ยืดน่องขวา (หลัง)', type: 'hold', target: 10, instructions: 'ยืดน่องขวาไปหลัง', detector: 'detectRightLegStretchBack' },
  { name: 'ยืดน่องซ้าย (หน้า)', type: 'hold', target: 10, instructions: 'ยืดน่องซ้ายไปหน้า', detector: 'detectLeftLegStretchFront' },
  { name: 'ยืดน่องซ้าย (ข้าง)', type: 'hold', target: 10, instructions: 'ยืดน่องซ้ายไปข้าง', detector: 'detectLeftLegStretchSide' },
  { name: 'ยืดน่องซ้าย (หลัง)', type: 'hold', target: 10, instructions: 'ยืดน่องซ้ายไปหลัง', detector: 'detectLeftLegStretchBack' },
  
  // --- Workout Set 1 ---
  { name: 'ย่ำเท้าอยู่กับที่', type: 'reps', target: 15, instructions: 'ย่ำเท้าสลับซ้ายขวา', detector: 'detectMarchInPlace' },
  { name: 'Step Touch', type: 'reps', target: 10, instructions: 'ก้าวแตะสลับข้าง', detector: 'detectStepTouch' },
  { name: 'Leg Curl', type: 'reps', target: 12, instructions: 'พับส้นเท้าไปด้านหลัง', detector: 'detectLegCurl' },
  { name: 'Heel Touch', type: 'reps', target: 8, instructions: 'แตะส้นเท้าด้านหน้า', detector: 'detectHeelTouch' },
  { name: 'Side Tap', type: 'reps', target: 20, instructions: 'แตะปลายเท้าด้านข้าง', detector: 'detectSideTap' },
  { name: 'Two Step', type: 'reps', target: 8, instructions: 'ก้าวชิดก้าวแตะ (ซ้าย-ขวา)', detector: 'detectTwoStep' },
  { name: 'ย่ำเท้าอยู่กับที่', type: 'reps', target: 24, instructions: 'ย่ำเท้าสลับซ้ายขวา', detector: 'detectMarchInPlace' },
  { name: 'Step Touch', type: 'reps', target: 10, instructions: 'ก้าวแตะสลับข้าง', detector: 'detectStepTouch' },
  { name: 'Leg Curl', type: 'reps', target: 11, instructions: 'พับส้นเท้าไปด้านหลัง', detector: 'detectLegCurl' },
  { name: 'Heel Touch', type: 'reps', target: 9, instructions: 'แตะส้นเท้าด้านหน้า', detector: 'detectHeelTouch' },
  { name: 'ย่ำเท้าอยู่กับที่', type: 'reps', target: 5, instructions: 'ย่ำเท้าสลับซ้ายขวา', detector: 'detectMarchInPlace' },

  // --- Workout Set 2 (New Song) ---
  { name: 'ย่ำเท้าอยู่กับที่', type: 'reps', target: 19, instructions: 'ย่ำเท้าสลับซ้ายขวา', detector: 'detectMarchInPlace' },
  { name: 'Front Tap', type: 'reps', target: 11, instructions: 'แตะปลายเท้าด้านหน้า', detector: 'detectFrontTap' },
  { name: 'Side Tap', type: 'reps', target: 12, instructions: 'แตะปลายเท้าด้านข้าง', detector: 'detectSideTap' },
  { name: 'Back Tap', type: 'reps', target: 26, instructions: 'แตะปลายเท้าด้านหลัง', detector: 'detectBackTap' },
  { name: 'Two Step', type: 'reps', target: 12, instructions: 'ก้าวชิดก้าวแตะ (ซ้าย-ขวา)', detector: 'detectTwoStep' },
  { name: 'Front Tap', type: 'reps', target: 9, instructions: 'แตะปลายเท้าด้านหน้า', detector: 'detectFrontTap' },
  { name: 'Side Tap', type: 'reps', target: 10, instructions: 'แตะปลายเท้าด้านข้าง', detector: 'detectSideTap' },
  { name: 'Back Tap', type: 'reps', target: 9, instructions: 'แตะปลายเท้าด้านหลัง', detector: 'detectBackTap' },
  { name: 'Two Step', type: 'reps', target: 12, instructions: 'ก้าวชิดก้าวแตะ (ซ้าย-ขวา)', detector: 'detectTwoStep' },

  // --- Cooldown Stretches ---
  { name: 'ยืดลำตัว (ขึ้นตรง)', type: 'hold', target: 10, instructions: 'ยกแขนขึ้นตรง', detector: 'detectBodyStretchUp' },
  { name: 'ยืดลำตัว (เอียงขวา)', type: 'hold', target: 10, instructions: 'เอียงไปทางขวา', detector: 'detectBodyStretchRight' },
  { name: 'ยืดลำตัว (เอียงซ้าย)', type: 'hold', target: 10, instructions: 'เอียงไปทางซ้าย', detector: 'detectBodyStretchLeft' },
  { name: 'ยืดลำตัว (ดันไปหน้า)', type: 'hold', target: 10, instructions: 'ดันไปข้างหน้า', detector: 'detectBodyStretchForward' },
  { name: 'ยืดน่องขวา (หน้า)', type: 'hold', target: 10, instructions: 'ยืดน่องขวาไปหน้า', detector: 'detectRightLegStretchFront' },
  { name: 'ยืดน่องขวา (ข้าง)', type: 'hold', target: 10, instructions: 'ยืดน่องขวาไปข้าง', detector: 'detectRightLegStretchSide' },
  { name: 'ยืดน่องขวา (หลัง)', type: 'hold', target: 10, instructions: 'ยืดน่องขวาไปหลัง', detector: 'detectRightLegStretchBack' },
  { name: 'ยืดน่องซ้าย (หน้า)', type: 'hold', target: 10, instructions: 'ยืดน่องซ้ายไปหน้า', detector: 'detectLeftLegStretchFront' },
  { name: 'ยืดน่องซ้าย (ข้าง)', type: 'hold', target: 10, instructions: 'ยืดน่องซ้ายไปข้าง', detector: 'detectLeftLegStretchSide' },
  { name: 'ยืดน่องซ้าย (หลัง)', type: 'hold', target: 10, instructions: 'ยืดน่องซ้ายไปหลัง', detector: 'detectLeftLegStretchBack' },
];