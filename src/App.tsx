import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Star, 
  Brain, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Gamepad2,
  BookOpen,
  User,
  Settings,
  Home,
  ChevronRight,
  Lightbulb,
  Leaf,
  Scale,
  Gift,
  Wind,
  ShoppingCart,
  Puzzle,
  Lock,
  Play,
  Gamepad,
  Target,
  Castle,
  Rocket,
  Ship,
  Clock,
  Shapes,
  ClipboardCheck,
  Box,
  Volume2,
  Loader2
} from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { Grade, UserProfile, MathProblem, AppState, TopicSubState } from './types';
import { generateMathProblem, explainConcept, generateSpeech } from './services/gemini';

// --- Components ---

const ProgressBar = ({ current, total, color = "bg-brand-yellow" }: { current: number, total: number, color?: string }) => (
  <div className="w-full h-6 bg-slate-200 rounded-full border-2 border-slate-800 overflow-hidden">
    <motion.div 
      className={`h-full ${color}`}
      initial={{ width: 0 }}
      animate={{ width: `${(current / total) * 100}%` }}
      transition={{ type: "spring", stiffness: 50 }}
    />
  </div>
);

const TopicCard = ({ title, icon: Icon, color, onClick, completed, locked, emoji }: { title: string, icon: any, color: string, onClick: () => void, completed?: boolean, locked?: boolean, emoji?: string, key?: any }) => (
  <button 
    onClick={locked ? undefined : onClick}
    disabled={locked}
    className={`kid-card p-4 flex flex-col items-center gap-3 text-center group relative overflow-hidden ${locked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
  >
    <div className={`p-3 rounded-xl ${color} border-2 border-slate-800 group-hover:scale-110 transition-transform`}>
      <Icon size={32} className="text-slate-800" />
    </div>
    <div className="flex items-center gap-2">
      {emoji && <span className="text-xl">{emoji}</span>}
      <h3 className="font-display font-bold text-lg leading-tight">{title}</h3>
    </div>
    {completed && (
      <div className="absolute top-2 right-2 bg-brand-green p-1 rounded-full border-2 border-slate-800">
        <CheckCircle2 size={16} className="text-white" />
      </div>
    )}
    {locked && (
      <div className="absolute top-2 right-2 bg-slate-400 p-1 rounded-full border-2 border-slate-800">
        <Lock size={16} className="text-white" />
      </div>
    )}
  </button>
);

// --- Constants ---

const FIXED_QUIZ_QUESTIONS: MathProblem[] = [
  { id: 'q1', question: 'Câu 1. Số nào đứng sau số 4?', answer: '5', options: ['3', '5', '6', '2'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q2', question: 'Câu 2. Số nào bé nhất?', answer: '0', options: ['2', '1', '0', '3'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q3', question: 'Câu 3. Số nào lớn hơn 7?', answer: '8', options: ['6', '5', '8', '4'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q4', question: 'Câu 4. Dãy số đúng từ bé đến lớn là:', answer: '1, 2, 3, 4, 5', options: ['1, 2, 3, 4, 5', '1, 3, 2, 4, 5', '5, 4, 3, 2, 1', '2, 1, 3, 4, 5'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q5', question: 'Câu 5. Số nào đứng trước số 6?', answer: '5', options: ['4', '5', '7', '3'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q6', question: 'Câu 6. Trong các số sau, số nào lớn nhất?', answer: '10', options: ['8', '6', '10', '9'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q7', question: 'Câu 7. 3 < ?', answer: '4', options: ['2', '4', '1', '0'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q8', question: 'Câu 8. Số nào bằng với số lượng 5 đồ vật?', answer: '5', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q9', question: 'Câu 9. Số nào đứng giữa 2 và 4?', answer: '3', options: ['1', '3', '5', '6'], difficulty: 'easy', topic: 'Thử sức' },
  { id: 'q10', question: 'Câu 10. Trong các số sau, số nào bằng không?', answer: '0', options: ['1', '0', '2', '3'], difficulty: 'easy', topic: 'Thử sức' },
];

const FIXED_GEOMETRY_QUIZ_QUESTIONS: MathProblem[] = [
  { id: 'g1', question: 'Câu 1: Tổng ba góc của một tam giác bằng', answer: '180°', options: ['90°', '180°', '270°', '360°'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g2', question: 'Câu 2: Tam giác có 3 cạnh bằng nhau là', answer: 'Tam giác đều', options: ['Tam giác vuông', 'Tam giác cân', 'Tam giác đều', 'Tam giác tù'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g3', question: 'Câu 3: Hai đường thẳng song song thì', answer: 'Không bao giờ cắt nhau', options: ['Cắt nhau tại 1 điểm', 'Không bao giờ cắt nhau', 'Trùng nhau', 'Vuông góc'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g4', question: 'Câu 4: Hình vuông có bao nhiêu trục đối xứng?', answer: '4', options: ['2', '3', '4', '1'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g5', question: 'Câu 5: Góc vuông có số đo', answer: '90°', options: ['45°', '60°', '90°', '120°'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g6', question: 'Câu 6: Hình chữ nhật có', answer: '4 góc vuông', options: ['4 cạnh bằng nhau', '4 góc vuông', '2 đường chéo không bằng nhau', 'Không có trục đối xứng'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g7', question: 'Câu 7: Tam giác vuông là tam giác có', answer: '1 góc 90°', options: ['3 góc bằng nhau', '1 góc 90°', '1 cạnh bằng nhau', '3 cạnh khác nhau'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g8', question: 'Câu 8: Hai góc kề bù có tổng bằng', answer: '180°', options: ['90°', '180°', '360°', '270°'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g9', question: 'Câu 9: Trong tam giác cân, hai góc ở đáy', answer: 'Bằng nhau', options: ['Bằng nhau', 'Khác nhau', 'Vuông', 'Bù nhau'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g10', question: 'Câu 10: Hình tròn có tâm O, bán kính là', answer: 'Khoảng cách từ tâm đến điểm trên đường tròn', options: ['Khoảng cách giữa 2 điểm bất kỳ', 'Đường kính', 'Khoảng cách từ tâm đến điểm trên đường tròn', 'Chu vi'], difficulty: 'easy', topic: 'Hình phẳng' },
];

const FIXED_GEOMETRY_FUN_QUESTIONS: MathProblem[] = [
  { id: 'gf1', question: 'Câu 11: Trong tam giác ABC, nếu ∠A = 60°, ∠B = 50° thì ∠C =', answer: '70°', options: ['60°', '50°', '70°', '80°'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf2', question: 'Câu 12: Hai đường thẳng song song bị cắt bởi một đường thẳng thì', answer: 'Góc đồng vị bằng nhau', options: ['Góc đồng vị bằng nhau', 'Góc so le trong không bằng nhau', 'Góc kề bù bằng nhau', 'Không có liên hệ'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf3', question: 'Câu 13: Trong hình bình hành, hai đường chéo', answer: 'Cắt nhau tại trung điểm', options: ['Bằng nhau', 'Vuông góc', 'Cắt nhau tại trung điểm', 'Không cắt nhau'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf4', question: 'Câu 14: Nếu một tam giác có 2 góc bằng 45° thì là tam giác', answer: 'Vuông cân', options: ['Vuông cân', 'Đều', 'Thường', 'Tù'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf5', question: 'Câu 15: Hình thang cân có', answer: 'Hai góc kề một đáy bằng nhau', options: ['Hai cạnh bên song song', 'Hai góc kề một đáy bằng nhau', 'Không có trục đối xứng', 'Hai đường chéo không bằng nhau'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf6', question: 'Câu 16: Góc ngoài của tam giác bằng', answer: 'Tổng 2 góc trong không kề', options: ['Tổng 3 góc trong', 'Hiệu 2 góc trong', 'Tổng 2 góc trong không kề', '90°'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf7', question: 'Câu 17: Nếu hai đường chéo hình thoi vuông góc thì', answer: 'Luôn đúng', options: ['Luôn đúng', 'Không đúng', 'Chỉ đúng khi là hình vuông', 'Không xác định'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf8', question: 'Câu 18: Trong tam giác vuông, cạnh huyền là', answer: 'Cạnh đối diện góc vuông', options: ['Cạnh nhỏ nhất', 'Cạnh đối diện góc vuông', 'Cạnh kề góc vuông', 'Đường cao'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf9', question: 'Câu 19: Hai tam giác bằng nhau khi', answer: 'Có 3 cạnh tương ứng bằng nhau', options: ['Có 1 cạnh bằng nhau', 'Có 3 cạnh tương ứng bằng nhau', 'Có 1 góc bằng nhau', 'Có diện tích bằng nhau'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf10', question: 'Câu 20: Hình vuông là', answer: 'Cả A và B đúng', options: ['Hình thoi đặc biệt', 'Hình chữ nhật đặc biệt', 'Cả A và B đúng', 'Không đúng'], difficulty: 'easy', topic: 'Hình phẳng' },
];

const FIXED_GEOMETRY_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'gc1', question: 'Câu 21: Cho tam giác ABC có AB = AC, suy ra', answer: '∠B = ∠C', options: ['∠B = ∠C', '∠A = ∠B', '∠A = ∠C', 'Không xác định'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc2', question: 'Câu 22: Hai đường thẳng vuông góc tạo thành góc', answer: '90°', options: ['45°', '60°', '90°', '120°'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc3', question: 'Câu 23: Nếu một tứ giác có 4 góc vuông thì là', answer: 'Hình chữ nhật', options: ['Hình vuông', 'Hình chữ nhật', 'Hình thang', 'Hình bình hành'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc4', question: 'Câu 24: Hình có hai cặp cạnh đối song song là', answer: 'Hình bình hành', options: ['Hình thang', 'Hình bình hành', 'Hình tam giác', 'Hình tròn'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc5', question: 'Câu 25: Trong tam giác, cạnh lớn nhất đối diện với', answer: 'Góc lớn nhất', options: ['Góc nhỏ nhất', 'Góc lớn nhất', 'Góc vuông', 'Góc tù'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc6', question: 'Câu 26: Cho tam giác ABC có ∠A = 50°, ∠B = 60°. Tính ∠C.', answer: '70°', options: [], difficulty: 'hard', topic: 'Hình phẳng', explanation: 'Lời giải: ∠C = 180° - 50° - 60° = 70°' },
  { id: 'gc7', question: 'Câu 27: Chứng minh rằng trong tam giác cân, hai góc ở đáy bằng nhau.', answer: 'Dùng định nghĩa tam giác cân (2 cạnh bằng nhau) → suy ra 2 góc đối diện bằng nhau.', options: [], difficulty: 'hard', topic: 'Hình phẳng', explanation: 'Gợi ý: Dùng định nghĩa tam giác cân (2 cạnh bằng nhau) → suy ra 2 góc đối diện bằng nhau.' },
  { id: 'gc8', question: 'Câu 28: Cho hình chữ nhật ABCD, chứng minh AC = BD.', answer: 'Xét hai tam giác vuông ABC và BAD → cạnh – góc – cạnh.', options: [], difficulty: 'hard', topic: 'Hình phẳng', explanation: 'Gợi ý: Xét hai tam giác vuông ABC và BAD → cạnh – góc – cạnh.' },
  { id: 'gc9', question: 'Câu 29: Cho tam giác vuông ABC vuông tại A, biết AB = 3, AC = 4. Tính BC.', answer: '5', options: [], difficulty: 'hard', topic: 'Hình phẳng', explanation: 'Lời giải: BC = 5 (định lý Pitago)' },
  { id: 'gc10', question: 'Câu 30: Chứng minh tổng ba góc trong một tam giác bằng 180°.', answer: 'Vẽ đường thẳng song song với một cạnh qua đỉnh đối diện, dùng tính chất góc so le trong.', options: [], difficulty: 'hard', topic: 'Hình phẳng', explanation: 'Gợi ý: Vẽ đường thẳng song song với một cạnh qua đỉnh đối diện, dùng tính chất góc so le trong.' },
];

const FIXED_FUN_QUESTIONS: MathProblem[] = [
  { id: 'f1', question: 'Câu 1. Số nào đứng giữa 0 và 2?', answer: '1', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f2', question: 'Câu 2. Điền số thích hợp: 1, 2, 3, ___, 5', answer: '4', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f3', question: 'Câu 3. Điền số thích hợp: 6, ___, 8, 9', answer: '7', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f4', question: 'Câu 4. Sắp xếp các số sau theo thứ tự từ bé đến lớn: 5, 2, 4, 1, 3', answer: '1, 2, 3, 4, 5', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f5', question: 'Câu 5. Sắp xếp các số sau theo thứ tự từ lớn đến bé: 7, 3, 6, 2', answer: '7, 6, 3, 2', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f6', question: 'Câu 6. Điền dấu >, < hoặc =: 5 ___ 3', answer: '>', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f7', question: 'Câu 7. Điền dấu >, < hoặc =: 4 ___ 4', answer: '=', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f8', question: 'Câu 8. Điền số thích hợp: 8 > ___', answer: '7', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f9', question: 'Câu 9. Điền số thích hợp: ___ < 6', answer: '5', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
  { id: 'f10', question: 'Câu 10. Hãy viết 3 số nhỏ hơn 5.', answer: '1, 2, 3', options: [], difficulty: 'easy', topic: 'CHƠI  VUI' },
];

const FIXED_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'c1', question: 'Câu 1. Số nào lớn hơn 7?', answer: '8', options: ['6', '5', '8', '4'], difficulty: 'easy', topic: 'CHINH PHỤC' },
  { id: 'c2', question: 'Câu 2. Số nào đứng giữa 3 và 5?', answer: '4', options: ['2', '4', '6', '1'], difficulty: 'easy', topic: 'CHINH PHỤC' },
  { id: 'c3', question: 'Câu 3. Trong các số sau, số nào bé nhất?', answer: '0', options: ['1', '0', '2', '3'], difficulty: 'easy', topic: 'CHINH PHỤC' },
  { id: 'c4', question: 'Câu 4. Dãy số nào viết đúng theo thứ tự từ bé đến lớn?', answer: '1, 2, 3, 4, 5', options: ['1, 2, 3, 4, 5', '2, 1, 3, 4, 5', '5, 4, 3, 2, 1', '1, 3, 2, 4, 5'], difficulty: 'easy', topic: 'CHINH PHỤC' },
  { id: 'c5', question: 'Câu 5. (Nâng cao) Số nào thích hợp điền vào chỗ trống: 3 < ___ < 6', answer: '4', options: ['2', '4', '7', '8'], difficulty: 'medium', topic: 'CHINH PHỤC' },
  { id: 'c6', question: 'Câu 6. Viết các số từ 0 đến 10 theo thứ tự từ bé đến lớn.', answer: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10', options: [], difficulty: 'easy', topic: 'CHINH PHỤC' },
  { id: 'c7', question: 'Câu 7. Điền số thích hợp: a) 2, 3, ___, 5, 6; b) 7, ___, 9', answer: '4; 8', options: [], difficulty: 'easy', topic: 'CHINH PHỤC' },
  { id: 'c8', question: 'Câu 8. Điền dấu >, <, = vào chỗ trống: a) 5 ___ 3; b) 4 ___ 4; c) 7 ___ 9', answer: '>; =; <', options: [], difficulty: 'easy', topic: 'CHINH PHỤC' },
  { id: 'c9', question: 'Câu 9. Sắp xếp các số sau theo thứ tự từ lớn đến bé: 8, 3, 6, 1, 5', answer: '8, 6, 5, 3, 1', options: [], difficulty: 'easy', topic: 'CHINH PHỤC' },
  { id: 'c10', question: 'Câu 10. (Nâng cao) Tìm số thích hợp điền vào ô trống: a) 5 > ___ > 2; b) ___ < 4 < ___', answer: '4; 3, 5', options: [], difficulty: 'hard', topic: 'CHINH PHỤC' },
];

const CORRECT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
const INCORRECT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';

const playAudio = (url: string) => {
  if (!url) return;
  const audio = new Audio(url);
  audio.play().catch(e => {
    // Only log if it's not a user-interaction related error (though in many browsers, play() requires interaction)
    if (e.name !== 'NotAllowedError') {
      console.warn("Audio play failed, possibly due to source issue or browser policy:", e.message);
    }
  });
};

const playBase64Audio = (dataUrl: string) => {
  if (!dataUrl) return;
  const audio = new Audio(dataUrl);
  audio.play().catch(e => {
    if (e.name !== 'NotAllowedError') {
      console.warn("Speech audio play failed:", e.message);
    }
  });
};

const GRADE_1_TOPICS = [
  { id: 'topic1', title: 'Các số từ 0 đến 10', icon: Leaf, color: 'bg-emerald-400', emoji: '🔢', prompt: 'Các số từ 0 đến 10, so sánh số, tách và gộp số', x: 20, y: 10 },
  { id: 'topic2', title: 'Hình phẳng', icon: Shapes, color: 'bg-orange-400', emoji: '📐', prompt: 'Hình vuông, hình tròn, hình tam giác, hình chữ nhật', x: 75, y: 15 },
  { id: 'topic3', title: 'Cộng, trừ phạm vi 10', icon: Gift, color: 'bg-pink-400', emoji: '➕', prompt: 'Phép cộng và phép trừ trong phạm vi 10', x: 25, y: 32 },
  { id: 'topic4', title: 'Hình khối & Vị trí', icon: Box, color: 'bg-blue-400', emoji: '📦', prompt: 'Khối lập phương, khối hộp chữ nhật, vị trí trong không gian', x: 70, y: 40 },
  { id: 'topic6', title: 'Các số đến 100', icon: Star, color: 'bg-yellow-400', emoji: '💯', prompt: 'Các số đến 100, số có hai chữ số, cấu tạo số', x: 20, y: 58 },
  { id: 'topic7', title: 'Độ dài & Đo lường', icon: Scale, color: 'bg-purple-400', emoji: '📏', prompt: 'Dài hơn, ngắn hơn, đơn vị cm, gang tay, sải tay', x: 75, y: 65 },
  { id: 'topic8', title: 'Cộng, trừ phạm vi 100', icon: Brain, color: 'bg-red-400', emoji: '🧮', prompt: 'Cộng, trừ không nhớ trong phạm vi 100', x: 30, y: 82 },
  { id: 'topic9', title: 'Thời gian & Lịch', icon: Clock, color: 'bg-indigo-400', emoji: '⏰', prompt: 'Xem giờ đúng trên đồng hồ, các ngày trong tuần', x: 70, y: 85 },
];

const GRADE_2_TOPICS = [
  { id: 'topic1', title: 'Ôn tập & Bổ sung', icon: ClipboardCheck, color: 'bg-emerald-400', emoji: '🔄', prompt: 'Ôn tập các số đến 100, số hạng, tổng, số bị trừ, số trừ, hiệu', x: 20, y: 10 },
  { id: 'topic2', title: 'Cộng, trừ phạm vi 20', icon: Sparkles, color: 'bg-orange-400', emoji: '✨', prompt: 'Phép cộng và phép trừ qua 10 trong phạm vi 20', x: 75, y: 15 },
  { id: 'topic3', title: 'kg & Lít', icon: Scale, color: 'bg-pink-400', emoji: '⚖️', prompt: 'Làm quen với Ki-lô-gam và Lít', x: 25, y: 32 },
  { id: 'topic4', title: 'Cộng, trừ có nhớ (100)', icon: Brain, color: 'bg-blue-400', emoji: '🧠', prompt: 'Phép cộng và phép trừ có nhớ trong phạm vi 100', x: 70, y: 40 },
  { id: 'topic5', title: 'Hình học & Thời gian', icon: Shapes, color: 'bg-yellow-400', emoji: '📐', prompt: 'Điểm, đoạn thẳng, đường cong, đường gấp khúc, xem đồng hồ, ngày tháng', x: 20, y: 58 },
  { id: 'topic6', title: 'Phép nhân & Phép chia', icon: Rocket, color: 'bg-purple-400', emoji: '🚀', prompt: 'Làm quen với phép nhân, phép chia, bảng nhân 2, 5, bảng chia 2, 5', x: 75, y: 65 },
  { id: 'topic7', title: 'Các số đến 1000', icon: Star, color: 'bg-red-400', emoji: '🌟', prompt: 'Đơn vị, chục, trăm, nghìn. So sánh và cấu tạo số trong phạm vi 1000', x: 30, y: 82 },
  { id: 'topic8', title: 'Thống kê & Xác suất', icon: Target, color: 'bg-indigo-400', emoji: '🎯', prompt: 'Thu thập, phân loại, kiểm đếm số liệu. Chắc chắn, có thể, không thể', x: 70, y: 85 },
];

const GRADE_3_TOPICS = [
  { id: 'topic1', title: 'Ôn tập & Bảng nhân chia', icon: ClipboardCheck, color: 'bg-emerald-400', emoji: '🔄', prompt: 'Ôn tập các số đến 1000, bảng nhân và bảng chia từ 2 đến 9', x: 20, y: 10 },
  { id: 'topic2', title: 'Hình học & Khối', icon: Shapes, color: 'bg-orange-400', emoji: '📐', prompt: 'Trung điểm, hình tròn, góc vuông, khối lập phương, khối hộp chữ nhật', x: 75, y: 15 },
  { id: 'topic3', title: 'Nhân chia (100, 1000)', icon: Sparkles, color: 'bg-pink-400', emoji: '✖️', prompt: 'Nhân, chia số có 2, 3 chữ số với số có 1 chữ số. Biểu thức số', x: 25, y: 32 },
  { id: 'topic4', title: 'Đơn vị đo lường', icon: Scale, color: 'bg-blue-400', emoji: '📏', prompt: 'Mi-li-mét, gam, mi-li-lít, nhiệt độ độ C', x: 70, y: 40 },
  { id: 'topic5', title: 'Số đến 100 000', icon: Star, color: 'bg-yellow-400', emoji: '🔢', prompt: 'Các số đến 10 000 and 100 000. Cấu tạo số, so sánh, làm tròn', x: 20, y: 58 },
  { id: 'topic6', title: 'Chu vi & Diện tích', icon: Box, color: 'bg-purple-400', emoji: '🔳', prompt: 'Chu vi và diện tích hình chữ nhật, hình vuông. Xăng-ti-mét vuông', x: 75, y: 65 },
  { id: 'topic7', title: 'Thời gian & Tiền tệ', icon: Clock, color: 'bg-red-400', emoji: '⏰', prompt: 'Xem đồng hồ, tháng - năm, tiền Việt Nam', x: 30, y: 82 },
  { id: 'topic8', title: 'Thống kê & Xác suất', icon: Target, color: 'bg-indigo-400', emoji: '📊', prompt: 'Thu thập, phân loại số liệu. Khả năng xảy ra của một sự kiện', x: 70, y: 85 },
];

const GRADE_4_TOPICS = [
  { id: 'topic1', title: 'Ôn tập & Số đến 100 000', icon: ClipboardCheck, color: 'bg-emerald-400', emoji: '🔄', prompt: 'Ôn tập các số đến 100 000, biểu thức chữ, giải toán 3 bước tính', x: 20, y: 10 },
  { id: 'topic2', title: 'Góc & Hình học', icon: Shapes, color: 'bg-orange-400', emoji: '📐', prompt: 'Góc nhọn, tù, bẹt. Đường thẳng vuông góc, song song', x: 75, y: 15 },
  { id: 'topic3', title: 'Số có nhiều chữ số', icon: Star, color: 'bg-pink-400', emoji: '🔢', prompt: 'Số đến lớp triệu, hàng và lớp, so sánh, làm tròn số', x: 25, y: 32 },
  { id: 'topic4', title: 'Đơn vị đo đại lượng', icon: Scale, color: 'bg-blue-400', emoji: '⚖️', prompt: 'Yến, tạ, tấn. dm2, m2, mm2. Giây, thế kỷ', x: 70, y: 40 },
  { id: 'topic5', title: 'Cộng, trừ, nhân, chia', icon: Sparkles, color: 'bg-yellow-400', emoji: '➕', prompt: 'Phép tính với số có nhiều chữ số, tính chất phép tính, trung bình cộng', x: 20, y: 58 },
  { id: 'topic6', title: 'Hình bình hành & Thoi', icon: Box, color: 'bg-purple-400', emoji: '💎', prompt: 'Đặc điểm và vẽ hình bình hành, hình thoi', x: 75, y: 65 },
  { id: 'topic7', title: 'Phân số', icon: BookOpen, color: 'bg-red-400', emoji: '🍰', prompt: 'Khái niệm, rút gọn, quy đồng, so sánh và các phép tính phân số', x: 30, y: 82 },
  { id: 'topic8', title: 'Thống kê & Xác suất', icon: Target, color: 'bg-indigo-400', emoji: '📊', prompt: 'Dãy số liệu, biểu đồ cột, khả năng xảy ra của sự kiện', x: 70, y: 85 },
];

const GRADE_5_TOPICS = [
  { id: 'topic1', title: 'Ôn tập phân số & Hỗn số', icon: ClipboardCheck, color: 'bg-emerald-400', emoji: '🔄', prompt: 'Ôn tập phân số, tính chất cơ bản, so sánh phân số, hỗn số', x: 20, y: 10 },
  { id: 'topic2', title: 'Số thập phân', icon: Star, color: 'bg-orange-400', emoji: '🔢', prompt: 'Khái niệm, cấu tạo, so sánh và viết số thập phân', x: 75, y: 15 },
  { id: 'topic3', title: 'Cộng, trừ số thập phân', icon: Sparkles, color: 'bg-pink-400', emoji: '➕', prompt: 'Phép cộng và phép trừ các số thập phân', x: 25, y: 32 },
  { id: 'topic4', title: 'Nhân, chia số thập phân', icon: Rocket, color: 'bg-blue-400', emoji: '✖️', prompt: 'Phép nhân và phép chia các số thập phân', x: 70, y: 40 },
  { id: 'topic5', title: 'Hình học phẳng', icon: Shapes, color: 'bg-yellow-400', emoji: '📐', prompt: 'Diện tích hình tam giác, hình thang, chu vi và diện tích hình tròn', x: 20, y: 58 },
  { id: 'topic6', title: 'Hình khối & Thể tích', icon: Box, color: 'bg-purple-400', emoji: '📦', prompt: 'Hình hộp chữ nhật, hình lập phương, diện tích và thể tích', x: 75, y: 65 },
  { id: 'topic7', title: 'Chuyển động đều', icon: Wind, color: 'bg-red-400', emoji: '🏃', prompt: 'Vận tốc, quãng đường, thời gian và các bài toán chuyển động', x: 30, y: 82 },
  { id: 'topic8', title: 'Thống kê & Biểu đồ', icon: Target, color: 'bg-indigo-400', emoji: '📊', prompt: 'Biểu đồ hình quạt tròn, số trung bình cộng nâng cao', x: 70, y: 85 },
];

const Grade1Map = ({ topics, user, onSelect }: { topics: typeof GRADE_1_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="relative w-full aspect-[16/10] max-w-3xl mx-auto bg-white/50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4">
      {/* Island Background Decor */}
      <div className="absolute top-10 left-10 w-40 h-40 map-island" />
      <div className="absolute bottom-20 right-10 w-60 h-60 map-island" />
      
      {/* Path SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none map-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d="M 20 10 Q 50 10 75 15 T 25 32 T 70 40 T 20 58 T 75 65 T 30 82 T 70 85" 
          fill="none" 
          stroke="#E2E8F0" 
          strokeWidth="4" 
          strokeDasharray="2 4"
          strokeLinecap="round"
        />
      </svg>

      {topics.map((topic, index) => {
        const isLocked = false; // All topics unlocked as per user request
        const isCompleted = user.completedTopics.includes(topic.id);
        
        return (
          <motion.button
            key={topic.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={!isLocked ? { scale: 1.1 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            onClick={() => onSelect(topic)}
            className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2`}
            style={{ left: `${topic.x}%`, top: `${topic.y}%` }}
          >
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-lg transition-all ${topic.color}`}>
              <topic.icon size={28} className="text-slate-800" />
              
              {/* Number Badge */}
              <div className="absolute -top-2 -left-2 w-7 h-7 bg-white rounded-full border-2 border-slate-800 flex items-center justify-center font-display font-bold text-sm text-slate-800 shadow-sm">
                {index + 1}
              </div>

              {/* Status Badge */}
              {isCompleted && (
                <div className="absolute -bottom-1 -right-1 bg-brand-green p-1 rounded-full border-2 border-slate-800 shadow-sm">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
              )}
            </div>
            <span className="font-display font-bold text-[10px] sm:text-xs px-2 py-0.5 bg-white/90 rounded-full border-2 border-slate-800 shadow-sm whitespace-nowrap text-slate-800 max-w-[120px] overflow-hidden text-ellipsis">
              {topic.title}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

const Grade2Map = ({ topics, user, onSelect }: { topics: typeof GRADE_2_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="relative w-full aspect-[16/10] max-w-3xl mx-auto bg-blue-50/50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 blur-3xl rounded-full" />
      </div>
      
      {/* Castle Icon Decor */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-10">
        <Castle size={120} className="text-slate-800" />
      </div>

      {/* Island Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Path SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d="M 20 10 Q 50 10 75 15 T 25 32 T 70 40 T 20 58 T 75 65 T 30 82 T 70 85" 
          fill="none" 
          stroke="#94A3B8" 
          strokeWidth="3" 
          strokeDasharray="4 6"
          strokeLinecap="round"
          className="opacity-40"
        />
      </svg>

      {topics.map((topic, index) => {
        const isCompleted = user.completedTopics.includes(topic.id);
        
        return (
          <motion.button
            key={topic.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(topic)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
            style={{ left: `${topic.x}%`, top: `${topic.y}%` }}
          >
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-3xl border-4 border-slate-800 flex items-center justify-center shadow-xl transition-all ${topic.color} rotate-3 hover:rotate-0`}>
              <topic.icon size={28} className="text-slate-800" />
              
              {/* Number Badge */}
              <div className="absolute -top-2 -left-2 w-7 h-7 bg-white rounded-full border-2 border-slate-800 flex items-center justify-center font-display font-bold text-sm text-slate-800 shadow-md">
                {index + 1}
              </div>

              {/* Status Badge */}
              {isCompleted && (
                <div className="absolute -bottom-2 -right-2 bg-brand-green p-1.5 rounded-full border-4 border-slate-800 shadow-md">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
              )}
            </div>
            <span className="font-display font-bold text-[10px] sm:text-xs px-2 py-0.5 bg-white rounded-2xl border-2 border-slate-800 shadow-md whitespace-nowrap text-slate-800 max-w-[120px] overflow-hidden text-ellipsis">
              {topic.title}
            </span>
          </motion.button>
        );
      })}

      {/* Extra floating icons for "vibe" */}
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-20 right-20 opacity-20"
      >
        <Rocket size={48} className="text-blue-600" />
      </motion.div>
      <motion.div 
        animate={{ x: [0, 10, 0] }} 
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-20 left-20 opacity-20"
      >
        <Ship size={48} className="text-emerald-600" />
      </motion.div>
    </div>
  );
};

const Grade3Map = ({ topics, user, onSelect }: { topics: typeof GRADE_3_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="relative w-full aspect-[16/10] max-w-3xl mx-auto bg-emerald-50/50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-blue-400 blur-3xl rounded-full" />
      </div>
      
      {/* Castle Icon Decor */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-10">
        <Castle size={120} className="text-slate-800" />
      </div>

      {/* Island Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Path SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d="M 20 10 Q 50 10 75 15 T 25 32 T 70 40 T 20 58 T 75 65 T 30 82 T 70 85" 
          fill="none" 
          stroke="#10B981" 
          strokeWidth="3" 
          strokeDasharray="4 6"
          strokeLinecap="round"
          className="opacity-40"
        />
      </svg>

      {topics.map((topic, index) => {
        const isCompleted = user.completedTopics.includes(topic.id);
        
        return (
          <motion.button
            key={topic.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(topic)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
            style={{ left: `${topic.x}%`, top: `${topic.y}%` }}
          >
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-3xl border-4 border-slate-800 flex items-center justify-center shadow-xl transition-all ${topic.color} -rotate-3 hover:rotate-0`}>
              <topic.icon size={28} className="text-slate-800" />
              
              {/* Number Badge */}
              <div className="absolute -top-2 -left-2 w-7 h-7 bg-white rounded-full border-2 border-slate-800 flex items-center justify-center font-display font-bold text-sm text-slate-800 shadow-md">
                {index + 1}
              </div>

              {/* Status Badge */}
              {isCompleted && (
                <div className="absolute -bottom-2 -right-2 bg-brand-green p-1.5 rounded-full border-4 border-slate-800 shadow-md">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
              )}
            </div>
            <span className="font-display font-bold text-[10px] sm:text-xs px-2 py-0.5 bg-white rounded-2xl border-2 border-slate-800 shadow-md whitespace-nowrap text-slate-800 max-w-[120px] overflow-hidden text-ellipsis">
              {topic.title}
            </span>
          </motion.button>
        );
      })}

      {/* Extra floating icons for "vibe" */}
      <motion.div 
        animate={{ y: [0, 15, 0] }} 
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-40 left-10 opacity-20"
      >
        <Leaf size={48} className="text-emerald-600" />
      </motion.div>
      <motion.div 
        animate={{ rotate: [0, 360] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-40 right-10 opacity-20"
      >
        <Sparkles size={48} className="text-yellow-600" />
      </motion.div>
    </div>
  );
};

const Grade4Map = ({ topics, user, onSelect }: { topics: typeof GRADE_4_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="relative w-full aspect-[16/10] max-w-3xl mx-auto bg-pink-50/50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 blur-3xl rounded-full" />
      </div>
      
      {/* Castle Icon Decor */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-10">
        <Castle size={120} className="text-slate-800" />
      </div>

      {/* Island Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Path SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d="M 20 10 Q 50 10 75 15 T 25 32 T 70 40 T 20 58 T 75 65 T 30 82 T 70 85" 
          fill="none" 
          stroke="#EC4899" 
          strokeWidth="3" 
          strokeDasharray="4 6"
          strokeLinecap="round"
          className="opacity-40"
        />
      </svg>

      {topics.map((topic, index) => {
        const isCompleted = user.completedTopics.includes(topic.id);
        
        return (
          <motion.button
            key={topic.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(topic)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
            style={{ left: `${topic.x}%`, top: `${topic.y}%` }}
          >
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-[2rem] border-4 border-slate-800 flex items-center justify-center shadow-xl transition-all ${topic.color} rotate-2 hover:rotate-0`}>
              <topic.icon size={28} className="text-slate-800" />
              
              {/* Number Badge */}
              <div className="absolute -top-2 -left-2 w-7 h-7 bg-white rounded-full border-2 border-slate-800 flex items-center justify-center font-display font-bold text-sm text-slate-800 shadow-md">
                {index + 1}
              </div>

              {/* Status Badge */}
              {isCompleted && (
                <div className="absolute -bottom-2 -right-2 bg-brand-green p-1.5 rounded-full border-4 border-slate-800 shadow-md">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
              )}
            </div>
            <span className="font-display font-bold text-[10px] sm:text-xs px-2 py-0.5 bg-white rounded-2xl border-2 border-slate-800 shadow-md whitespace-nowrap text-slate-800 max-w-[120px] overflow-hidden text-ellipsis">
              {topic.title}
            </span>
          </motion.button>
        );
      })}

      {/* Extra floating icons for "vibe" */}
      <motion.div 
        animate={{ y: [0, -20, 0] }} 
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute top-20 left-20 opacity-20"
      >
        <Rocket size={48} className="text-pink-600" />
      </motion.div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }} 
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute bottom-20 right-20 opacity-20"
      >
        <Gift size={48} className="text-purple-600" />
      </motion.div>
    </div>
  );
};

const Grade5Map = ({ topics, user, onSelect }: { topics: typeof GRADE_5_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="relative w-full aspect-[16/10] max-w-3xl mx-auto bg-indigo-950 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4">
      {/* Space Background Decor */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-75" />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse delay-150" />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-300" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
      </div>
      
      {/* Rainbow Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 opacity-30 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-red-500 via-yellow-500 to-blue-500 blur-3xl rounded-full" />
      </div>

      {/* Rocket Icon Decor */}
      <motion.div 
        animate={{ x: [0, 100, 0], y: [0, -50, 0], rotate: [0, 45, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 opacity-40"
      >
        <Rocket size={80} className="text-white" />
      </motion.div>

      {/* Path SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d="M 20 10 Q 50 10 75 15 T 25 32 T 70 40 T 20 58 T 75 65 T 30 82 T 70 85" 
          fill="none" 
          stroke="white" 
          strokeWidth="3" 
          strokeDasharray="4 6"
          strokeLinecap="round"
          className="opacity-30"
        />
      </svg>

      {topics.map((topic, index) => {
        const isCompleted = user.completedTopics.includes(topic.id);
        
        return (
          <motion.button
            key={topic.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(topic)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
            style={{ left: `${topic.x}%`, top: `${topic.y}%` }}
          >
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all ${topic.color}`}>
              <topic.icon size={28} className="text-slate-800" />
              
              {/* Number Badge */}
              <div className="absolute -top-2 -left-2 w-7 h-7 bg-white rounded-full border-2 border-indigo-950 flex items-center justify-center font-display font-bold text-sm text-indigo-950 shadow-md">
                {index + 1}
              </div>

              {/* Status Badge */}
              {isCompleted && (
                <div className="absolute -bottom-2 -right-2 bg-brand-green p-1.5 rounded-full border-4 border-white shadow-md">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
              )}
            </div>
            <span className="font-display font-bold text-[10px] sm:text-xs px-2 py-0.5 bg-white/90 rounded-2xl border-2 border-indigo-950 shadow-md whitespace-nowrap text-indigo-950 max-w-[120px] overflow-hidden text-ellipsis">
              {topic.title}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>('onboarding');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{ title: string; content: string } | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [topicSubState, setTopicSubState] = useState<TopicSubState>('learn');
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [essayAnswer, setEssayAnswer] = useState('');
  const [isFunPlayMode, setIsFunPlayMode] = useState(false);
  const [isConquerMode, setIsConquerMode] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<MathProblem[]>([]);

  const playQuestionAudio = async (text: string) => {
    if (audioLoading) return;
    setAudioLoading(true);
    try {
      const dataUrl = await generateSpeech(text);
      playBase64Audio(dataUrl);
    } catch (error) {
      console.error("Speech generation failed", error);
    } finally {
      setAudioLoading(false);
    }
  };

  // Auto-play question audio when a new problem is loaded
  useEffect(() => {
    if (currentProblem && state === 'playing') {
      playQuestionAudio(currentProblem.question);
    }
  }, [currentProblem?.id, state]);

  // Load user from local storage
  useEffect(() => {
    const savedUser = localStorage.getItem('math_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setState('dashboard');
    }
  }, []);

  // Save user to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('math_user', JSON.stringify(user));
    }
  }, [user]);

  // Timer for Quiz Mode
  useEffect(() => {
    let timer: any;
    if (state === 'playing' && isQuizMode && timeLeft > 0 && isCorrect === null) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isQuizMode && isCorrect === null) {
      handleAnswer('TIMEOUT_NO_ANSWER');
    }
    return () => clearInterval(timer);
  }, [state, isQuizMode, timeLeft, isCorrect]);

  const handleExit = () => {
    localStorage.removeItem('math_user');
    setUser(null);
    setState('goodbye');
    // After a short delay, go back to onboarding to allow "re-entry"
    setTimeout(() => {
      setState('onboarding');
    }, 3000);
  };

  const handleStartOnboarding = (name: string, grade: Grade) => {
    const newUser: UserProfile = {
      name,
      grade,
      points: 0,
      level: 1,
      completedTopics: []
    };
    setUser(newUser);
    setState('dashboard');
  };

  const selectTopic = (topic: any) => {
    setSelectedTopic(topic);
    setState('topic_menu');
  };

  const [activeTopicName, setActiveTopicName] = useState<string>('');

  const startTopic = async (topic: string, difficulty: 'easy' | 'medium' | 'hard' = 'easy') => {
    if (!user) return;
    setActiveTopicName(topic);

    // Check if it's the fixed "Chinh phục" for Grade 1
    if (user.grade === 1 && (topic.includes("CHINH PHỤC") || topic.includes("Chinh phục"))) {
      setIsConquerMode(true);
      setIsQuizMode(false);
      setIsFunPlayMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setEssayAnswer('');
      const questions = (selectedTopic?.title === 'Hình phẳng') ? FIXED_GEOMETRY_CONQUER_QUESTIONS : FIXED_CONQUER_QUESTIONS;
      setActiveQuestions(questions);
      setCurrentProblem(questions[0]);
      setIsCorrect(null);
      setSelectedOption(null);
      setExplanation(null);
      setState('playing');
      setLoading(false);
      return;
    }

    // Check if it's the fixed "Chơi vui" for Grade 1
    if (user.grade === 1 && (topic.includes("CHƠI VUI") || topic.includes("Chơi vui") || topic.includes("vui nhộn"))) {
      setIsFunPlayMode(true);
      setIsQuizMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setEssayAnswer('');
      const questions = (selectedTopic?.title === 'Hình phẳng') ? FIXED_GEOMETRY_FUN_QUESTIONS : FIXED_FUN_QUESTIONS;
      setActiveQuestions(questions);
      setCurrentProblem(questions[0]);
      setIsCorrect(null);
      setSelectedOption(null);
      setExplanation(null);
      setState('playing');
      setLoading(false);
      return;
    }

    // Check if it's the fixed quiz for Grade 1 "Thử sức"
    if (user.grade === 1 && (topic.toUpperCase().includes("THỬ SỨC") || topic.toUpperCase().includes("TRẮC NGHIỆM"))) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      const questions = (selectedTopic?.title === 'Hình phẳng') ? FIXED_GEOMETRY_QUIZ_QUESTIONS : FIXED_QUIZ_QUESTIONS;
      setActiveQuestions(questions);
      setCurrentProblem(questions[0]);
      setIsCorrect(null);
      setSelectedOption(null);
      setExplanation(null);
      setState('playing');
      setLoading(false);
      return;
    }

    setIsQuizMode(false);
    setIsFunPlayMode(false);
    setIsConquerMode(false);
    setQuizIndex(0);
    setQuizScore(0);
    setLoading(true);
    setState('playing');
    try {
      const problem = await generateMathProblem(user.grade, topic, difficulty);
      setCurrentProblem(problem);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: any) => {
    if (!currentProblem || isCorrect !== null || !user) return;
    
    setSelectedOption(option);
    let correct = false;

    const isEssay = isFunPlayMode || (isConquerMode && currentProblem.options.length === 0);

    if (isEssay) {
      const cleanInput = String(option).toLowerCase().replace(/\s+/g, '');
      const cleanAnswer = String(currentProblem.answer).toLowerCase().replace(/\s+/g, '');
      
      // Special handling for flexible answers
      if (currentProblem.id === 'f8') { // 8 > ___
        const val = parseInt(cleanInput);
        correct = !isNaN(val) && val < 8;
      } else if (currentProblem.id === 'f9') { // ___ < 6
        const val = parseInt(cleanInput);
        correct = !isNaN(val) && val < 6;
      } else if (currentProblem.id === 'f10') { // 3 số nhỏ hơn 5
        const nums = cleanInput.split(/[,.\s]+/).filter(s => s !== '').map(s => parseInt(s));
        correct = nums.length >= 3 && nums.every(n => !isNaN(n) && n < 5);
      } else if (currentProblem.id === 'c10') { // 5 > ___ > 2; ___ < 4 < ___
        // Expected "4; 3, 5"
        const parts = cleanInput.split(';');
        if (parts.length >= 2) {
          const p1 = parseInt(parts[0].trim());
          const p2 = parts[1].split(',').map(s => parseInt(s.trim()));
          correct = (p1 === 3 || p1 === 4) && p2.includes(3) && p2.includes(5);
        } else {
          correct = cleanInput.includes('4') && cleanInput.includes('3') && cleanInput.includes('5');
        }
      } else if (currentProblem.id === 'gc6') { // ∠C = 70°
        correct = cleanInput.includes('70');
      } else if (currentProblem.id === 'gc9') { // BC = 5
        correct = cleanInput.includes('5');
      } else if (['gc7', 'gc8', 'gc10'].includes(currentProblem.id as string)) { // Proof questions
        correct = cleanInput.length > 0;
      } else {
        correct = cleanInput === cleanAnswer;
      }
    } else {
      correct = option === currentProblem.answer;
    }

    setIsCorrect(correct);

    if (correct) {
      playAudio(CORRECT_SOUND);
      setQuizScore(prev => prev + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD93D', '#6BCB77', '#4D96FF']
      });
      const newStreak = streak + 1;
      setStreak(newStreak);
      setUser(prev => {
        if (!prev) return null;
        const newPoints = prev.points + 10 + (streak * 2);
        const newLevel = Math.floor(newPoints / 100) + 1;
        
        let newCompletedTopics = [...prev.completedTopics];
        if (newStreak >= 5 && selectedTopic && !newCompletedTopics.includes(selectedTopic.id)) {
          newCompletedTopics.push(selectedTopic.id);
        }

        return { ...prev, points: newPoints, level: newLevel, completedTopics: newCompletedTopics };
      });
    } else {
      playAudio(INCORRECT_SOUND);
      setStreak(0);
    }
  };

  const nextProblem = async () => {
    if (!user || !currentProblem) return;

    if (isQuizMode || isFunPlayMode || isConquerMode) {
      const questions = activeQuestions;
      const nextIndex = quizIndex + 1;
      if (nextIndex < questions.length) {
        setQuizIndex(nextIndex);
        setCurrentProblem(questions[nextIndex]);
        setTimeLeft(20);
        setIsCorrect(null);
        setSelectedOption(null);
        setExplanation(null);
        setEssayAnswer('');
      } else {
        setState('quiz_results');
      }
      return;
    }

    const nextIndex = quizIndex + 1;
    if (nextIndex >= 10) {
      setState('quiz_results');
      return;
    }

    setQuizIndex(nextIndex);
    setLoading(true);
    setIsCorrect(null);
    setSelectedOption(null);
    setExplanation(null);
    setEssayAnswer('');
    
    // Difficulty progression based on streak
    let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
    if (streak >= 6) difficulty = 'hard';
    else if (streak >= 3) difficulty = 'medium';

    try {
      const problem = await generateMathProblem(user.grade, currentProblem.topic, difficulty);
      setCurrentProblem(problem);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!user || !currentProblem) return;
    setLoading(true);
    try {
      const text = await explainConcept(currentProblem.topic, user.grade);
      setExplanation(text);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- Screens ---

  if (state === 'onboarding') {
    return <OnboardingScreen onComplete={handleStartOnboarding} />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 py-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-pink border-4 border-slate-800 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl">Chào, {user.name}!</h2>
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Star size={16} className="text-brand-yellow fill-brand-yellow" />
              <span>Lớp {user.grade} • Cấp độ {user.level}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
            <Trophy size={20} className="text-brand-yellow" />
            <span className="font-display font-bold">{user.points} điểm</span>
          </div>
          <div className="w-32">
            <ProgressBar current={user.points % 100} total={100} />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {state === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-8"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-display font-bold text-4xl text-slate-800 mb-2">Hôm nay học gì nhỉ?</h1>
                  <p className="text-slate-600 text-lg">Chọn một chủ đề để bắt đầu cuộc phiêu lưu!</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowExamModal(true)}
                    className="kid-button bg-brand-blue text-white text-sm py-2 px-4 flex items-center gap-2"
                  >
                    <ClipboardCheck size={18} />
                    Kiểm tra học kỳ
                  </button>
                  <button 
                    onClick={() => setShowExitConfirm(true)}
                    className="kid-button bg-brand-pink text-white text-sm py-2 px-4"
                  >
                    Thoát
                  </button>
                </div>
              </div>

              {user.grade === 1 ? (
                <Grade1Map topics={GRADE_1_TOPICS} user={user} onSelect={selectTopic} />
              ) : user.grade === 2 ? (
                <Grade2Map topics={GRADE_2_TOPICS} user={user} onSelect={selectTopic} />
              ) : user.grade === 3 ? (
                <Grade3Map topics={GRADE_3_TOPICS} user={user} onSelect={selectTopic} />
              ) : user.grade === 4 ? (
                <Grade4Map topics={GRADE_4_TOPICS} user={user} onSelect={selectTopic} />
              ) : user.grade === 5 ? (
                <Grade5Map topics={GRADE_5_TOPICS} user={user} onSelect={selectTopic} />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {user.grade === 3 && (
                    <>
                      <TopicCard title="Cộng Trừ 4 Chữ Số" icon={Brain} color="bg-brand-green" onClick={() => startTopic("Phép cộng và trừ các số có 3, 4 chữ số")} />
                      <TopicCard title="Nhân Chia 1 Chữ Số" icon={Gamepad2} color="bg-brand-blue" onClick={() => startTopic("Nhân và chia với số có 1 chữ số (nhẩm và không nhẩm)")} />
                      <TopicCard title="Số Có 5 Chữ Số" icon={Sparkles} color="bg-brand-pink" onClick={() => startTopic("Làm quen với các số có 5 chữ số")} />
                    </>
                  )}

                  {user.grade === 4 && (
                    <>
                      <TopicCard title="Số Nhiều Chữ Số" icon={Brain} color="bg-brand-green" onClick={() => startTopic("Làm quen với các số có nhiều chữ số")} />
                      <TopicCard title="Nhân Chia Nâng Cao" icon={Gamepad2} color="bg-brand-blue" onClick={() => startTopic("Phép nhân và chia với số có một hoặc nhiều chữ số")} />
                      <TopicCard title="Phân Số" icon={BookOpen} color="bg-brand-orange" onClick={() => startTopic("Thực hiện các phép tính với phân số")} />
                    </>
                  )}

                  {user.grade === 5 && (
                    <>
                      <TopicCard title="Số Thập Phân" icon={Brain} color="bg-brand-green" onClick={() => startTopic("Làm quen với số thập phân")} />
                      <TopicCard title="Tính Số Thập Phân" icon={Sparkles} color="bg-brand-pink" onClick={() => startTopic("Các phép tính từ đơn giản đến phức tạp với số thập phân")} />
                    </>
                  )}

                  <TopicCard 
                    title="Giải Toán" 
                    icon={Lightbulb} 
                    color="bg-brand-yellow" 
                    onClick={() => startTopic("Giải toán có lời văn vui nhộn")} 
                  />
                  <TopicCard 
                    title="Thử Thách" 
                    icon={Trophy} 
                    color="bg-slate-800" 
                    onClick={() => startTopic("Tổng hợp các bài toán khó")} 
                  />
                </div>
              )}

              {/* Knowledge to Remember Section */}
              <div className="kid-card bg-brand-yellow/10 border-brand-yellow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-brand-yellow rounded-lg border-2 border-slate-800">
                    <BookOpen size={24} className="text-slate-800" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-slate-800">Trung tâm kiến thức - Lớp {user.grade}</h2>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getGradeKnowledge(user.grade).map((item, idx) => (
                    <li 
                      key={idx} 
                      className="flex items-start gap-2 text-slate-700 cursor-pointer hover:bg-brand-yellow/20 p-2 rounded-lg transition-colors group"
                      onClick={() => setSelectedReview(item)}
                    >
                      <span className="text-brand-yellow font-bold group-hover:scale-125 transition-transform">•</span>
                      <span className="group-hover:text-slate-900 font-medium">{item.title}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-500 italic">* Nhấn vào từng mục để xem chi tiết kiến thức nhé!</p>
              </div>
            </motion.div>
          )}

          {state === 'topic_menu' && selectedTopic && (
            <motion.div 
              key="topic_menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setState('dashboard')}
                    className="p-3 bg-white hover:bg-slate-100 rounded-2xl border-4 border-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <Home size={24} className="text-slate-800" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${selectedTopic.color} border-4 border-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]`}>
                      <selectedTopic.icon size={32} className="text-slate-800" />
                    </div>
                    <h1 className="font-display font-bold text-3xl text-slate-800">{selectedTopic.emoji} {selectedTopic.title}</h1>
                  </div>
                </div>
                <div className="hidden md:block">
                  <h2 className="font-display font-bold text-xl text-brand-orange uppercase tracking-widest">Chọn Chủ Đề</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {(user.grade === 1 ? [
                  { title: "1️⃣ KHÁM PHÁ 🔍", icon: BookOpen, color: "bg-brand-blue", desc: "Xem hình, nghe đọc & ví dụ", prompt: "Khám phá kiến thức qua hình ảnh và âm thanh" },
                  { title: "2️⃣ THỬ SỨC 💪", icon: Target, color: "bg-brand-green", desc: "Bài tập từ dễ đến khó", prompt: "Thử sức với bài tập có giải thích chi tiết" },
                  { title: "3️⃣ CHƠI  VUI 🎮", icon: Gamepad2, color: "bg-purple-500", desc: "Học toán qua trò chơi", prompt: "Chơi game toán học vui nhộn" },
                  { title: "4️⃣ CHINH PHỤC 🏆", icon: Trophy, color: "bg-brand-pink", desc: "10 câu hỏi tổng hợp", prompt: "Chinh phục thử thách cuối bài" },
                ] : [
                  { title: "LÝ THUYẾT", icon: BookOpen, color: "bg-brand-blue", desc: "Ôn tập kiến thức trọng tâm", prompt: "Học lý thuyết" },
                  { title: "TRẮC NGHIỆM", icon: ClipboardCheck, color: "bg-brand-yellow", desc: "Câu hỏi trắc nghiệm nhanh", prompt: "Câu hỏi trắc nghiệm" },
                  { title: "TỰ LUẬN", icon: Brain, color: "bg-brand-green", desc: "Luyện tập bài tập tự luận", prompt: "Luyện tập tự luận" },
                  { title: "ỨNG DỤNG", icon: Lightbulb, color: "bg-orange-500", desc: "Toán học trong thực tế", prompt: "Ứng dụng thực tế" },
                ]).map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      if (item.title.includes("LÝ THUYẾT") || item.title.includes("KHÁM PHÁ")) {
                        const knowledge = getGradeKnowledge(user!.grade);
                        const relevant = knowledge.find(k => k.title.toLowerCase().includes(selectedTopic.title.toLowerCase())) || knowledge[0];
                        setSelectedReview(relevant);
                      } else if (item.title.includes("CHƠI VUI")) {
                        startTopic("CHƠI VUI", 'medium');
                      } else if (item.title.includes("THỬ SỨC")) {
                        startTopic("THỬ SỨC", 'medium');
                      } else if (item.title.includes("CHINH PHỤC")) {
                        startTopic("CHINH PHỤC", 'medium');
                      } else {
                        startTopic(`${selectedTopic.prompt} - ${item.prompt}`, 'medium');
                      }
                    }}
                    className="kid-card p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 group hover:scale-[1.02] transition-all bg-white"
                  >
                    <div className={`p-3 sm:p-4 ${item.color} rounded-2xl border-4 border-slate-800 text-white group-hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]`}>
                      <item.icon size={32} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-display font-bold text-lg sm:text-xl mb-1">{user.grade === 1 ? "" : "✔ "}{item.title}</h3>
                      <p className="text-slate-500 text-xs sm:text-sm">{item.desc}</p>
                    </div>
                    <div className={`mt-auto w-full py-2 ${item.color} text-white rounded-xl border-2 border-slate-800 font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]`}>
                      Bắt đầu
                    </div>
                  </button>
                ))}
              </div>

              {/* Bottom Banner Decor */}
              <div className="mt-8 relative overflow-hidden rounded-[2rem] border-4 border-slate-800 bg-brand-blue/10 p-8 flex items-center justify-between">
                <div className="relative z-10">
                  <h4 className="font-display font-bold text-2xl text-slate-800 mb-2">Sẵn sàng chưa nào?</h4>
                  <p className="text-slate-600">Chọn một chặng để bắt đầu cuộc phiêu lưu!</p>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-20 rotate-12">
                  <Trophy size={200} />
                </div>
              </div>
            </motion.div>
          )}

          {state === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setState(selectedTopic ? 'topic_menu' : 'dashboard')}
                  className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-800 transition-colors group"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  Quay lại danh sách
                </button>
                <div className="flex items-center gap-2 bg-white px-4 py-1 rounded-full border-2 border-slate-800 font-bold text-slate-800">
                  Câu {quizIndex + 1} / 10
                </div>
                <div className="flex items-center gap-2 text-brand-orange font-bold">
                  <Sparkles size={20} />
                  Đúng: {quizScore}
                </div>
              </div>

              {isQuizMode && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden border-2 border-slate-800">
                    <motion.div 
                      className={`h-full ${timeLeft <= 5 ? 'bg-brand-pink' : 'bg-brand-blue'}`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${(timeLeft / 20) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                  <span className={`font-display font-bold text-xl w-10 ${timeLeft <= 5 ? 'text-brand-pink animate-pulse' : 'text-slate-600'}`}>
                    {timeLeft}s
                  </span>
                </div>
              )}

              {loading && !currentProblem ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 border-8 border-brand-yellow border-t-slate-800 rounded-full animate-spin" />
                  <p className="font-display font-bold text-2xl text-slate-600">Đang tạo thử thách cho bạn...</p>
                </div>
              ) : currentProblem && (
                <div className="flex flex-col gap-8">
                  <div className="kid-card p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 bg-brand-yellow/10 rounded-bl-3xl">
                      <Brain size={40} className="text-brand-yellow opacity-20" />
                    </div>
                    <div className="flex items-start gap-4 mb-6">
                      <p className="text-2xl md:text-3xl font-medium leading-relaxed flex-1">
                        {currentProblem.question}
                      </p>
                      <button 
                        onClick={() => playQuestionAudio(currentProblem.question)}
                        disabled={audioLoading}
                        className="p-3 bg-brand-blue text-white rounded-2xl border-4 border-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] hover:scale-110 transition-all active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50"
                        title="Nghe câu hỏi"
                      >
                        {audioLoading ? <Loader2 size={24} className="animate-spin" /> : <Volume2 size={24} />}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentProblem.options.length > 0 ? (
                        currentProblem.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(option)}
                            disabled={isCorrect !== null}
                            className={`
                              kid-button text-2xl py-6
                              ${selectedOption === option ? (
                                isCorrect ? 'bg-brand-green text-white' : 'bg-brand-pink text-white'
                              ) : 'bg-white text-slate-800'}
                              ${isCorrect !== null && option === currentProblem.answer ? 'bg-brand-green text-white' : ''}
                            `}
                          >
                            {option}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                          <input 
                            type="text"
                            placeholder="Nhập câu trả lời của bạn..."
                            className="kid-input text-center text-3xl py-6"
                            value={essayAnswer}
                            onChange={(e) => setEssayAnswer(e.target.value)}
                            disabled={isCorrect !== null}
                            onKeyDown={(e) => e.key === 'Enter' && essayAnswer && handleAnswer(essayAnswer)}
                          />
                          <button 
                            disabled={!essayAnswer || isCorrect !== null}
                            onClick={() => handleAnswer(essayAnswer)}
                            className="kid-button-primary py-6 text-2xl"
                          >
                            Nộp bài
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isCorrect !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`kid-card p-6 flex flex-col gap-4 ${isCorrect ? 'bg-brand-green/10 border-brand-green' : 'bg-brand-pink/10 border-brand-pink'}`}
                    >
                      <div className="flex items-center gap-4">
                        {isCorrect ? (
                          <CheckCircle2 size={40} className="text-brand-green" />
                        ) : (
                          <XCircle size={40} className="text-brand-pink" />
                        )}
                        <div>
                          <h3 className="font-display font-bold text-2xl">
                            {isCorrect ? 'Tuyệt vời! Bạn giỏi quá!' : (timeLeft === 0 ? 'Hết giờ rồi! Tiếc quá!' : 'Ồ, chưa đúng rồi! Thử lại nhé?')}
                          </h3>
                          <p className="text-lg text-slate-700">{currentProblem.explanation || (isCorrect ? "" : `Đáp án đúng là: ${currentProblem.answer}`)}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 mt-2">
                        <button 
                          onClick={nextProblem}
                          className="kid-button-primary flex-1 flex items-center justify-center gap-2"
                        >
                          {(isQuizMode || isFunPlayMode || isConquerMode) && quizIndex === (isQuizMode ? FIXED_QUIZ_QUESTIONS : (isFunPlayMode ? FIXED_FUN_QUESTIONS : FIXED_CONQUER_QUESTIONS)).length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'} <ChevronRight />
                        </button>
                        {!isCorrect && !isQuizMode && !isFunPlayMode && !isConquerMode && (
                          <button 
                            onClick={handleExplain}
                            className="kid-button-secondary flex-1 flex items-center justify-center gap-2"
                          >
                            <Lightbulb size={20} /> Giải thích thêm
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {explanation && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="kid-card p-6 bg-brand-blue/10 border-brand-blue"
                    >
                      <h4 className="font-display font-bold text-xl mb-2 flex items-center gap-2">
                        <Sparkles size={20} className="text-brand-blue" />
                        Gợi ý từ AI:
                      </h4>
                      <p className="text-lg leading-relaxed">{explanation}</p>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {state === 'quiz_results' && (
            <motion.div 
              key="quiz_results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center py-10 gap-8 text-center"
            >
              <div className="w-32 h-32 bg-brand-yellow rounded-full flex items-center justify-center border-8 border-white shadow-2xl animate-bounce">
                <Trophy size={64} className="text-slate-800" />
              </div>
              <div>
                <h1 className="font-display font-bold text-4xl text-slate-800 mb-2">Hoàn thành thử thách!</h1>
                <div className="flex flex-col items-center gap-2 my-6">
                  <p className="text-slate-600 text-xl font-medium uppercase tracking-wider">Điểm số của bạn:</p>
                  <div className="relative">
                    <div className="text-8xl font-display font-bold text-brand-orange drop-shadow-[0_4px_0_rgba(30,41,59,1)]">
                      {quizScore}
                    </div>
                    <div className="absolute -bottom-4 -right-8 bg-brand-blue text-white px-3 py-1 rounded-xl border-4 border-slate-800 font-display font-bold text-xl rotate-12">
                      / 10
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 text-lg mb-4">Bạn đã trả lời đúng {quizScore} / 10 câu hỏi</p>
                <div className="mb-6 inline-block px-6 py-2 rounded-full border-4 border-slate-800 font-display font-bold text-2xl bg-white shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
                  Xếp loại: <span className={
                    quizScore === 10 ? 'text-brand-orange' : 
                    quizScore >= 8 ? 'text-brand-green' : 
                    quizScore >= 6 ? 'text-brand-blue' : 
                    quizScore >= 5 ? 'text-yellow-500' : 'text-brand-pink'
                  }>
                    {quizScore === 10 ? 'Xuất sắc 🏆' : 
                     quizScore >= 8 ? 'Giỏi 🌟' : 
                     quizScore >= 6 ? 'Khá 👍' : 
                     quizScore >= 5 ? 'Trung bình 💪' : 'Cần cố gắng ❤️'}
                  </span>
                </div>
                <p className="text-slate-500 max-w-md mx-auto italic">
                  {quizScore === 10 ? 'Tuyệt vời! Bạn là thiên tài toán học! 🌟' : 
                   quizScore >= 8 ? 'Rất tốt! Cố gắng phát huy nhé! 👍' : 
                   quizScore >= 5 ? 'Khá lắm! Luyện tập thêm sẽ giỏi ngay thôi! 💪' :
                   'Đừng nản lòng! Hãy thử lại để đạt điểm cao hơn nhé! ❤️'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button 
                  onClick={() => setState(selectedTopic ? 'topic_menu' : 'dashboard')}
                  className="kid-button-primary flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} /> Quay lại danh sách
                </button>
                <button 
                  onClick={() => startTopic(activeTopicName, 'medium')}
                  className="kid-button-secondary flex-1"
                >
                  Làm lại bài
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Nav */}
      <footer className="mt-12 flex justify-center gap-8">
          <button 
            onClick={() => setState('dashboard')}
            className={`flex flex-col items-center gap-1 ${state === 'dashboard' ? 'text-brand-blue' : 'text-slate-400'}`}
          >
            <Home size={28} />
            <span className="text-xs font-bold uppercase tracking-wider">Trang chủ</span>
          </button>
          <button 
            onClick={() => {
              // Open the first item of knowledge center as a shortcut or just a general view
              const firstItem = getGradeKnowledge(user!.grade)[0];
              setSelectedReview(firstItem);
            }}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <BookOpen size={28} />
            <span className="text-xs font-bold uppercase tracking-wider">Kiến thức</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-slate-400"
            onClick={() => setShowExitConfirm(true)}
          >
            <Settings size={28} />
            <span className="text-xs font-bold uppercase tracking-wider">Cài đặt</span>
          </button>
        </footer>
      
      {/* Review Modal */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="kid-card p-8 max-w-2xl w-full bg-white flex flex-col gap-6 max-h-[85vh] overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-blue rounded-lg border-2 border-slate-800">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-slate-800">{selectedReview.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={isTtsLoading}
                    onClick={async () => {
                      window.speechSynthesis.cancel();
                      setIsTtsLoading(true);
                      try {
                        const cleanText = selectedReview.content.replace(/[#*`]/g, '');
                        const dataUrl = await generateSpeech(cleanText);
                        if (dataUrl) {
                          playBase64Audio(dataUrl);
                        } else {
                          throw new Error("No audio data");
                        }
                      } catch (error) {
                        console.error("Gemini TTS failed, falling back to browser TTS:", error);
                        const utterance = new SpeechSynthesisUtterance(selectedReview.content.replace(/[#*`]/g, ''));
                        utterance.lang = 'vi-VN';
                        window.speechSynthesis.speak(utterance);
                      } finally {
                        setIsTtsLoading(false);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 bg-brand-yellow rounded-xl border-2 border-slate-800 font-bold text-sm hover:scale-105 transition-transform ${isTtsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isTtsLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Wind size={18} />
                    )}
                    Nghe đọc
                  </button>
                  <button 
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      setSelectedReview(null);
                    }}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <XCircle size={32} className="text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="markdown-body prose prose-slate max-w-none">
                  <Markdown>{selectedReview.content}</Markdown>
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setSelectedReview(null);
                  }}
                  className="kid-button bg-brand-blue text-white"
                >
                  Đã hiểu rồi!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exam Modal */}
      <AnimatePresence>
        {showExamModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="kid-card max-w-md w-full p-8 bg-white"
            >
              <h2 className="font-display font-bold text-3xl text-slate-800 mb-6 text-center">Kiểm tra học kỳ</h2>
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => {
                    setShowExamModal(false);
                    startTopic(`Bài kiểm tra Học kì 1 - Lớp ${user.grade}`, 'hard');
                  }}
                  className="kid-card p-6 flex items-center gap-4 hover:border-brand-blue transition-all bg-brand-blue/5 group"
                >
                  <div className="p-3 bg-brand-blue rounded-xl text-white group-hover:scale-110 transition-transform">
                    <ClipboardCheck size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-xl">Bài kiểm tra Học kì 1</h3>
                    <p className="text-slate-500 text-sm">Tổng hợp kiến thức nửa đầu năm học</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setShowExamModal(false);
                    startTopic(`Bài kiểm tra Học kì 2 - Lớp ${user.grade}`, 'hard');
                  }}
                  className="kid-card p-6 flex items-center gap-4 hover:border-brand-pink transition-all bg-brand-pink/5 group"
                >
                  <div className="p-3 bg-brand-pink rounded-xl text-white group-hover:scale-110 transition-transform">
                    <ClipboardCheck size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-xl">Bài kiểm tra Học kì 2</h3>
                    <p className="text-slate-500 text-sm">Tổng hợp kiến thức cả năm học</p>
                  </div>
                </button>
              </div>
              <button 
                onClick={() => setShowExamModal(false)}
                className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
              >
                Quay lại
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="kid-card p-8 max-w-sm w-full bg-white flex flex-col gap-6 text-center"
            >
              <div className="mx-auto w-20 h-20 bg-brand-pink/20 rounded-full flex items-center justify-center border-4 border-brand-pink">
                <XCircle size={48} className="text-brand-pink" />
              </div>
              <div>
                <h3 className="font-display font-bold text-2xl mb-2">Bạn muốn thoát sao?</h3>
                <p className="text-slate-600">Mọi tiến trình học tập của bạn sẽ được lưu lại. Hẹn gặp lại bạn sớm nhé!</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleExit}
                  className="kid-button bg-brand-pink text-white w-full"
                >
                  Đồng ý, thoát ngay
                </button>
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="kid-button bg-slate-200 text-slate-800 w-full"
                >
                  Ở lại học tiếp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Goodbye Screen */}
      <AnimatePresence>
        {state === 'goodbye' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-blue">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-white p-8"
            >
              <h2 className="font-display font-bold text-4xl mb-4">Tạm biệt!</h2>
              <p className="text-xl opacity-90">Hẹn gặp lại bạn lần sau nhé!</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getGradeKnowledge(grade: Grade) {
  const knowledge: Record<Grade, { title: string; content: string }[]> = {
    1: [
      {
        title: "Chủ đề 1: 🔢 Các số từ 0 đến 10",
        content: `### 1. Làm quen các số
- Các số cơ bản: **0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10**.
- Bé hãy tập đếm các đồ vật xung quanh mình nhé! 🍎🍎🍎

### 2. So sánh số
- **Nhiều hơn, ít hơn, bằng nhau**.
- Sử dụng các dấu: **> (lớn hơn)**, **< (bé hơn)**, **= (bằng nhau)**.

### 3. Tách và gộp số
- Ví dụ: 5 gồm 2 và 3. Gộp 2 và 3 được 5. 💡`
      },
      {
        title: "Chủ đề 2: 📐 Hình phẳng",
        content: `### 1. Các hình cơ bản
- **Hình vuông**: Có 4 cạnh bằng nhau.
- **Hình tròn**: Tròn xoe như ông mặt trời. ☀️
- **Hình tam giác**: Có 3 cạnh.
- **Hình chữ nhật**: Giống như cái bảng lớp mình.

### 2. Lắp ghép hình
- Bé có thể dùng các hình phẳng để ghép thành ngôi nhà, con thuyền... 🏠⛵`
      },
      {
        title: "Chủ đề 3: ➕ Cộng, trừ phạm vi 10",
        content: `### 1. Phép cộng (+)
- Là gộp lại. Ví dụ: 3 con cá thêm 2 con cá là 5 con cá.
- **3 + 2 = 5**.

### 2. Phép trừ (-)
- Là bớt đi. Ví dụ: 5 quả bóng bay mất 2 quả còn 3 quả.
- **5 - 2 = 3**.

### 3. Số 0 trong phép tính
- Số nào cộng hoặc trừ với 0 cũng bằng chính nó. ✨`
      },
      {
        title: "Chủ đề 4: 📦 Hình khối & Vị trí",
        content: `### 1. Các hình khối
- **Khối lập phương**: Giống như con xúc xắc. 🎲
- **Khối hộp chữ nhật**: Giống như hộp quà hoặc viên gạch. 🎁

### 2. Vị trí và định hướng
- **Trên - Dưới**
- **Trước - Sau**
- **Trái - Phải**
- Ở giữa.`
      },
      {
        title: "Chủ đề 6: 💯 Các số đến 100",
        content: `### 1. Số có hai chữ số
- Từ 10 đến 99.
- Số **100** là số có ba chữ số.

### 2. Chục và Đơn vị
- Ví dụ: Số **24** gồm **2 chục** và **4 đơn vị**.
- Các số tròn chục: 10, 20, 30, 40, 50, 60, 70, 80, 90.`
      },
      {
        title: "Chủ đề 7: 📏 Độ dài & Đo lường",
        content: `### 1. So sánh độ dài
- **Dài hơn - Ngắn hơn**.
- **Cao hơn - Thấp hơn**.

### 2. Đơn vị đo
- **Xăng-ti-mét (cm)**: Dùng thước kẻ để đo.
- Các đơn vị khác: Gang tay, sải tay, bước chân. 👣`
      },
      {
        title: "Chủ đề 8: 🧮 Cộng, trừ phạm vi 100",
        content: `### 1. Cộng, trừ không nhớ
- Cộng/trừ số có hai chữ số với số có một chữ số.
- Cộng/trừ số có hai chữ số với số có hai chữ số.

### 2. Cách tính
- Tính hàng đơn vị trước, hàng chục sau.
- Ví dụ: 41 + 5 = 46. (1+5=6, hạ 4).`
      },
      {
        title: "Chủ đề 9: ⏰ Thời gian & Lịch",
        content: `### 1. Xem đồng hồ
- Kim ngắn chỉ giờ, kim dài chỉ phút.
- Bé tập xem **giờ đúng** (ví dụ: 7 giờ sáng). 🕒

### 2. Các ngày trong tuần
- Một tuần có **7 ngày**: Thứ Hai, Thứ Ba, Thứ Tư, Thứ Năm, Thứ Sáu, Thứ Bảy, Chủ Nhật.`
      }
    ],
    2: [
      {
        title: "Chủ đề 1: 🔄 Ôn tập & Bổ sung",
        content: `### 1. Ôn tập các số đến 100
- Bé nhớ lại cách đọc, viết và so sánh các số từ 0 đến 99 nhé.

### 2. Các thành phần của phép tính
- **Phép cộng**: Số hạng + Số hạng = Tổng.
- **Phép trừ**: Số bị trừ - Số trừ = Hiệu.

### 3. Tia số
- Số đứng trước bé hơn số đứng sau trên tia số.`
      },
      {
        title: "Chủ đề 2: ✨ Cộng, trừ phạm vi 20",
        content: `### 1. Phép cộng qua 10
- Mẹo: Tách số để tạo thành 10 rồi cộng tiếp.
- Ví dụ: 9 + 5 = 9 + 1 + 4 = 10 + 4 = 14.

### 2. Phép trừ qua 10
- Ví dụ: 11 - 5 = 11 - 1 - 4 = 10 - 4 = 6.`
      },
      {
        title: "Chủ đề 3: ⚖️ kg & Lít",
        content: `### 1. Ki-lô-gam (kg)
- Là đơn vị đo khối lượng (độ nặng nhẹ).
- Ví dụ: Túi gạo nặng 2 kg. 🎒

### 2. Lít (l)
- Là đơn vị đo dung tích (lượng nước, sữa...).
- Ví dụ: Ca nước chứa được 1 lít nước. 🥛`
      },
      {
        title: "Chủ đề 4: 🧠 Cộng, trừ có nhớ (100)",
        content: `### 1. Phép cộng có nhớ
- Cộng hàng đơn vị trước, nếu ≥ 10 thì nhớ 1 sang hàng chục.
- Ví dụ: 35 + 7 = 42.

### 2. Phép trừ có nhớ
- Nếu hàng đơn vị không trừ được, mượn 1 chục ở hàng chục.
- Ví dụ: 32 - 7 = 25.`
      },
      {
        title: "Chủ đề 5: 📐 Hình học & Thời gian",
        content: `### 1. Hình học
- **Đường gấp khúc**: Gồm nhiều đoạn thẳng nối tiếp nhau.
- **Hình tứ giác**: Hình có 4 cạnh.

### 2. Thời gian
- Một ngày có **24 giờ**. Một giờ có **60 phút**. 🕒
- Bé tập xem giờ đúng và giờ rưỡi (ví dụ: 8 giờ 30 phút).`
      },
      {
        title: "Chủ đề 8: 🚀 Phép nhân & Phép chia",
        content: `### 1. Phép nhân (x)
- Là tổng của các số hạng bằng nhau.
- **Thừa số x Thừa số = Tích**.
- Bé học bảng nhân 2 và bảng nhân 5.

### 2. Phép chia (:)
- Là phép tính ngược của phép nhân.
- **Số bị chia : Số chia = Thương**.
- Bé học bảng chia 2 và bảng chia 5.`
      },
      {
        title: "Chủ đề 10: 🌟 Các số đến 1000",
        content: `### 1. Đơn vị, Chục, Trăm, Nghìn
- 10 đơn vị = 1 chục.
- 10 chục = 1 trăm.
- 10 trăm = **1 nghìn (1000)**.

### 2. Số có ba chữ số
- Gồm hàng Trăm, hàng Chục và hàng Đơn vị.
- Ví dụ: 465 gồm 4 trăm, 6 chục và 5 đơn vị.`
      },
      {
        title: "Chủ đề 13: 🎯 Thống kê & Xác suất",
        content: `### 1. Thống kê
- Bé tập thu thập, phân loại và kiểm đếm các đồ vật.
- Xem biểu đồ tranh đơn giản. 📊

### 2. Xác suất
- Làm quen với các khả năng: **Chắc chắn**, **Có thể**, **Không thể**.`
      }
    ],
    3: [
      {
        title: "Chủ đề 1: 🔄 Ôn tập & Bảng nhân chia",
        content: `### 1. Ôn tập số đến 1000
- Đọc, viết và so sánh các số trong phạm vi 1000.
- Cộng, trừ các số có 3 chữ số.

### 2. Bảng nhân & Bảng chia
- Bé cần thuộc lòng bảng nhân và chia từ 2 đến 9.
- **Một phần mấy**: Làm quen với 1/2, 1/3, 1/4... 🍰`
      },
      {
        title: "Chủ đề 3: 📐 Hình học & Khối",
        content: `### 1. Điểm và Đoạn thẳng
- **Trung điểm** của đoạn thẳng: Là điểm nằm chính giữa đoạn thẳng đó.
- **Hình tròn**: Có tâm, bán kính và đường kính.

### 2. Góc và Hình phẳng
- **Góc vuông** và góc không vuông (dùng ê ke để kiểm tra).
- Nhận biết tam giác, tứ giác, hình chữ nhật, hình vuông.

### 3. Hình khối
- Khối lập phương và khối hộp chữ nhật (đều có 8 đỉnh, 6 mặt, 12 cạnh). 📦`
      },
      {
        title: "Chủ đề 4: ✖️ Nhân chia (100, 1000)",
        content: `### 1. Nhân, chia phạm vi 100
- Nhân/chia số có 2 chữ số với số có 1 chữ số.
- **Phép chia có dư**: Số dư luôn bé hơn số chia.

### 2. Nhân, chia phạm vi 1000
- Nhân/chia số có 3 chữ số với số có 1 chữ số.

### 3. Biểu thức số
- Quy tắc: Nhân chia trước, cộng trừ sau. Nếu có ngoặc thì làm trong ngoặc trước. 🧮`
      },
      {
        title: "Chủ đề 5: 📏 Đơn vị đo lường",
        content: `### 1. Độ dài & Khối lượng
- **Mi-li-mét (mm)**: 1 cm = 10 mm.
- **Gam (g)**: 1 kg = 1000 g.

### 2. Dung tích & Nhiệt độ
- **Mi-li-lít (ml)**: 1 l = 1000 ml.
- **Độ C**: Đơn vị đo nhiệt độ. Dùng nhiệt kế để đo. 🌡️`
      },
      {
        title: "Chủ đề 8: 🔢 Số đến 100 000",
        content: `### 1. Các số đến 10 000
- Số có 4 chữ số. Ví dụ: 3421 (3 nghìn, 4 trăm, 2 chục, 1 đơn vị).
- Làm quen chữ số La Mã (I, V, X).

### 2. Các số đến 100 000
- Số có 5 chữ số.
- **Làm tròn số**: Làm tròn đến hàng chục, hàng trăm, hàng nghìn. ✨`
      },
      {
        title: "Chủ đề 9: 🔳 Chu vi & Diện tích",
        content: `### 1. Chu vi
- Chu vi là tổng độ dài các cạnh bao quanh hình.
- **Chu vi hình chữ nhật** = (Dài + Rộng) x 2.
- **Chu vi hình vuông** = Cạnh x 4.

### 2. Diện tích
- Đơn vị: **Xăng-ti-mét vuông (cm²)**.
- **Diện tích hình chữ nhật** = Dài x Rộng.
- **Diện tích hình vuông** = Cạnh x Cạnh.`
      },
      {
        title: "Chủ đề 13: ⏰ Thời gian & Tiền tệ",
        content: `### 1. Thời gian
- Xem đồng hồ chính xác đến từng phút.
- **Tháng - Năm**: Một năm có 12 tháng. Bé hãy tập nhớ số ngày trong mỗi tháng nhé! 📅

### 2. Tiền Việt Nam
- Làm quen với các tờ tiền: 1000đ, 2000đ, 5000đ, 10 000đ... 💸`
      },
      {
        title: "Chủ đề 15: 📊 Thống kê & Xác suất",
        content: `### 1. Thống kê
- Thu thập, phân loại và ghi chép số liệu vào bảng.

### 2. Xác suất
- Làm quen với khả năng xảy ra của một sự kiện: Có thể, Chắc chắn, Không thể. 🎯`
      }
    ],
    4: [
      {
        title: "Chủ đề 1: 🔄 Ôn tập & Số đến 100 000",
        content: `### 1. Ôn tập số đến 100 000
- Đọc, viết và so sánh các số trong phạm vi 100 000.
- Ôn tập các phép tính cộng, trừ, nhân, chia đã học.

### 2. Biểu thức chữ
- Biểu thức có chứa một, hai hoặc ba chữ.
- Ví dụ: a + b + c. Thay chữ bằng số để tính giá trị.

### 3. Giải toán
- Làm quen với bài toán giải bằng ba bước tính. 📝`
      },
      {
        title: "Chủ đề 2: 📐 Góc & Hình học",
        content: `### 1. Các loại góc
- **Góc nhọn**: Bé hơn góc vuông.
- **Góc tù**: Lớn hơn góc vuông.
- **Góc bẹt**: Bằng hai góc vuông.

### 2. Đường thẳng đặc biệt
- **Hai đường thẳng vuông góc**: Tạo thành góc vuông.
- **Hai đường thẳng song song**: Không bao giờ cắt nhau. 🛤️`
      },
      {
        title: "Chủ đề 3: 🔢 Số có nhiều chữ số",
        content: `### 1. Lớp triệu
- Gồm hàng triệu, chục triệu, trăm triệu.
- Ví dụ: 149 597 876.

### 2. Cấu tạo số & Làm tròn
- Hiểu về hàng và lớp để đọc số chính xác.
- Làm tròn số đến hàng trăm nghìn. ✨`
      },
      {
        title: "Chủ đề 4: ⚖️ Đơn vị đo đại lượng",
        content: `### 1. Khối lượng & Diện tích
- **Yến, tạ, tấn**: 1 tấn = 10 tạ = 100 yến = 1000 kg.
- **dm², m², mm²**: Đơn vị đo diện tích. 1 m² = 100 dm².

### 2. Thời gian
- **Giây**: 1 phút = 60 giây.
- **Thế kỷ**: 1 thế kỷ = 100 năm. Bé đang sống ở thế kỷ XXI! 🚀`
      },
      {
        title: "Chủ đề 5 & 8: ➕ Cộng, trừ, nhân, chia",
        content: `### 1. Phép tính nâng cao
- Cộng, trừ số có nhiều chữ số.
- Nhân với số có 1, 2 chữ số.
- Chia cho số có 1, 2 chữ số.

### 2. Tính chất & Trung bình cộng
- Tính chất giao hoán và kết hợp của phép cộng, phép nhân.
- **Số trung bình cộng** = Tổng các số : Số các số hạng. 📊`
      },
      {
        title: "Chủ đề 6: 💎 Hình bình hành & Thoi",
        content: `### 1. Hình bình hành
- Có hai cặp cạnh đối diện song song và bằng nhau.

### 2. Hình thoi
- Có hai cặp cạnh đối diện song song và bốn cạnh bằng nhau.
- Ví dụ: Hình thoi trên kim nam châm của la bàn. 🧭`
      },
      {
        title: "Chủ đề 10, 11, 12: 🍰 Phân số",
        content: `### 1. Khái niệm phân số
- Gồm tử số (trên) và mẫu số (dưới).
- Tính chất cơ bản: Rút gọn và quy đồng mẫu số.

### 2. Các phép tính phân số
- Cộng, trừ phân số (cùng mẫu hoặc khác mẫu).
- Nhân phân số: Tử x Tử, Mẫu x Mẫu.
- Chia phân số: Nhân với phân số đảo ngược. ➗`
      },
      {
        title: "Chủ đề 9 & 15: 📊 Thống kê & Xác suất",
        content: `### 1. Thống kê
- Làm quen với dãy số liệu và biểu đồ cột.

### 2. Xác suất
- Kiểm đếm số lần xuất hiện của một sự kiện trong thực tế. 🎯`
      }
    ],
    5: [
      {
        title: "Chủ đề 1: 🔄 Ôn tập phân số & Hỗn số",
        content: `### 1. Phân số
- Ôn tập rút gọn, quy đồng và các phép tính với phân số.

### 2. Hỗn số
- Hỗn số gồm **Phần nguyên** và **Phần phân số**.
- Ví dụ: 2 và 3/4. Cách chuyển hỗn số thành phân số: (2 x 4 + 3) / 4 = 11/4.`
      },
      {
        title: "Chủ đề 2: 🔢 Số thập phân",
        content: `### 1. Cấu tạo số thập phân
- Gồm phần nguyên and phần thập phân, ngăn cách bởi dấu phẩy.
- Ví dụ: 12,34 (12 là phần nguyên, 34 là phần thập phân).

### 2. Viết và So sánh
- Viết các phân số thập phân dưới dạng số thập phân.
- So sánh hai số thập phân bằng cách so sánh phần nguyên rồi đến phần thập phân.`
      },
      {
        title: "Chủ đề 3 & 4: ✖️ Tính toán số thập phân",
        content: `### 1. Cộng và Trừ
- Đặt dấu phẩy thẳng hàng rồi thực hiện như số tự nhiên.

### 2. Nhân và Chia
- Nhân số thập phân với số tự nhiên, với số thập phân.
- Chia số thập phân cho số tự nhiên, cho số thập phân.
- Chia một số tự nhiên cho một số tự nhiên mà thương là số thập phân. ➗`
      },
      {
        title: "Chủ đề 5: 📐 Hình học phẳng",
        content: `### 1. Hình tam giác & Hình thang
- **Diện tích tam giác** = (Đáy x Chiều cao) : 2.
- **Diện tích hình thang** = (Đáy lớn + Đáy bé) x Chiều cao : 2.

### 2. Hình tròn
- **Chu vi** = Đường kính x 3,14.
- **Diện tích** = Bán kính x Bán kính x 3,14. ⭕`
      },
      {
        title: "Chủ đề 6: 📦 Hình khối & Thể tích",
        content: `### 1. Hình hộp chữ nhật & Hình lập phương
- Diện tích xung quanh và diện tích toàn phần.
- **Thể tích** = Dài x Rộng x Cao.

### 2. Đơn vị đo thể tích
- cm³, dm³, m³. 1 m³ = 1000 dm³ = 1 000 000 cm³.`
      },
      {
        title: "Chủ đề 7: 🏃 Chuyển động đều",
        content: `### 1. Các đại lượng
- **Vận tốc (v)**: Quãng đường đi được trong một đơn vị thời gian.
- **Quãng đường (s)**, **Thời gian (t)**.

### 2. Công thức
- v = s : t
- s = v x t
- t = s : v 🏎️`
      },
      {
        title: "Chủ đề 8: 📊 Thống kê & Biểu đồ",
        content: `### 1. Biểu đồ hình quạt tròn
- Dùng để so sánh các phần trong một tổng thể (thường dùng %).

### 2. Giải toán nâng cao
- Tìm hai số khi biết Tổng và Tỉ số.
- Tìm hai số khi biết Hiệu và Tỉ số.`
      }
    ]
  };
  return knowledge[grade];
}

function OnboardingScreen({ onComplete }: { onComplete: (name: string, grade: Grade) => void }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="kid-card p-10 max-w-md w-full flex flex-col gap-8"
      >
        <div className="text-center">
          <div className="inline-block p-6 bg-brand-yellow rounded-3xl border-4 border-slate-800 mb-6 animate-float shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
            <Brain size={64} className="text-slate-800" />
          </div>
          <h1 className="font-display font-bold text-4xl text-slate-800 mb-2">Học Toán Vui Nhộn</h1>
          <p className="text-slate-600 text-lg">Chào mừng bạn đến với thế giới toán học kỳ thú!</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-display font-bold text-xl ml-2">Tên của bạn là gì?</label>
            <input 
              type="text" 
              placeholder="Nhập tên của bạn..."
              className="kid-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-display font-bold text-xl ml-2">Bạn đang học lớp mấy?</label>
            <div className="flex justify-between gap-2">
              {([1, 2, 3, 4, 5] as Grade[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`
                    w-12 h-12 rounded-xl border-4 border-slate-800 font-display font-bold text-xl transition-all
                    ${grade === g ? 'bg-brand-yellow scale-110 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]' : 'bg-white hover:bg-slate-50'}
                  `}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => name && onComplete(name, grade)}
            disabled={!name}
            className="kid-button-primary w-full flex items-center justify-center gap-2 mt-4"
          >
            Bắt đầu ngay <ArrowRight />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

