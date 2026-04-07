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
  { id: 'g1', question: 'Câu 1: Hình nào không có cạnh?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình vuông', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g2', question: 'Câu 2: Hình nào có 3 cạnh?', answer: 'Hình tam giác', options: ['Hình tròn', 'Hình tam giác', 'Hình vuông'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g3', question: 'Câu 3: Hình nào có 4 cạnh bằng nhau?', answer: 'Hình vuông', options: ['Hình chữ nhật', 'Hình vuông', 'Hình tròn'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g4', question: 'Câu 4: Hình nào giống cái bánh xe?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình tam giác', 'Hình vuông'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g5', question: 'Câu 5: Hình nào giống quyển sách?', answer: 'Hình chữ nhật', options: ['Hình chữ nhật', 'Hình tròn', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g6', question: 'Câu 6: Hình vuông có mấy cạnh?', answer: '4', options: ['3', '4', '5'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g7', question: 'Câu 7: Hình tam giác có mấy cạnh?', answer: '3', options: ['2', '3', '4'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g8', question: 'Câu 8: Hình chữ nhật có mấy góc?', answer: '4', options: ['3', '4', '5'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g9', question: 'Câu 9: Hình nào có dạng cái đĩa?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình vuông', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'g10', question: 'Câu 10: Hình nào có 4 cạnh nhưng không bằng nhau?', answer: 'Hình chữ nhật', options: ['Hình vuông', 'Hình chữ nhật', 'Hình tròn'], difficulty: 'easy', topic: 'Hình phẳng' },
];

const FIXED_SOLID_SHAPES_QUIZ_QUESTIONS: MathProblem[] = [
  { id: 's1', question: 'Câu 1: Hình nào có 4 cạnh bằng nhau?', answer: 'Hình vuông', options: ['Hình tròn', 'Hình vuông', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's2', question: 'Câu 2: Hình nào không có cạnh?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình vuông', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's3', question: 'Câu 3: Hình nào có 3 cạnh?', answer: 'Hình tam giác', options: ['Hình tam giác', 'Hình tròn', 'Hình vuông'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's4', question: 'Câu 4: Hình nào giống cái bánh xe?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình vuông', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's5', question: 'Câu 5: Hình nào giống quyển sách?', answer: 'Hình chữ nhật', options: ['Hình tròn', 'Hình chữ nhật', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's6', question: 'Câu 6: Hình vuông có mấy cạnh?', answer: '4', options: ['3', '4', '5'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's7', question: 'Câu 7: Hình tam giác có mấy cạnh?', answer: '3', options: ['3', '4', '2'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's8', question: 'Câu 8: Hình chữ nhật có mấy góc?', answer: '4', options: ['3', '4', '5'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's9', question: 'Câu 9: Hình nào có dạng quả bóng?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình vuông', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 's10', question: 'Câu 10: Hình nào có 4 cạnh nhưng không bằng nhau?', answer: 'Hình chữ nhật', options: ['Hình vuông', 'Hình chữ nhật', 'Hình tròn'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
];

const FIXED_NUMBERS_TO_100_QUIZ_QUESTIONS: MathProblem[] = [
  { id: 'nq1', question: 'Câu 1: Số nào lớn hơn 25?', answer: '26', options: ['24', '26', '23'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq2', question: 'Câu 2: Số nào bé hơn 40?', answer: '39', options: ['41', '39', '42'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq3', question: 'Câu 3: 30 gồm:', answer: '3 chục', options: ['3 chục', '30 đơn vị', '2 chục'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq4', question: 'Câu 4: 47 gồm:', answer: '4 chục 7 đơn vị', options: ['4 chục 7 đơn vị', '7 chục 4 đơn vị', '47 chục'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq5', question: 'Câu 5: Số liền sau của 19 là:', answer: '20', options: ['18', '20', '21'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq6', question: 'Câu 6: Số liền trước của 50 là:', answer: '49', options: ['49', '51', '48'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq7', question: 'Câu 7: Trong các số sau, số nào lớn nhất?', answer: '21', options: ['12', '21', '20'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq8', question: 'Câu 8: Trong các số sau, số nào bé nhất?', answer: '34', options: ['35', '53', '34'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq9', question: 'Câu 9: Số 60 có:', answer: '6 chục', options: ['6 chục', '6 đơn vị', '60 chục'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nq10', question: 'Câu 10: Số nào bằng 1 chục?', answer: '10', options: ['1', '10', '100'], difficulty: 'easy', topic: 'Các số đến 100' },
];

const FIXED_ADD_SUB_QUIZ_QUESTIONS: MathProblem[] = [
  { id: 'asq1', question: '2 + 3 = ?', answer: '5', options: ['4', '5', '6'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq2', question: '5 − 2 = ?', answer: '3', options: ['2', '3', '4'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq3', question: '1 + 6 = ?', answer: '7', options: ['6', '7', '8'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq4', question: '7 − 3 = ?', answer: '4', options: ['3', '4', '5'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq5', question: '4 + 4 = ?', answer: '8', options: ['6', '7', '8'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq6', question: '9 − 5 = ?', answer: '4', options: ['3', '4', '5'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq7', question: '3 + 2 = ?', answer: '5', options: ['4', '5', '6'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq8', question: '6 − 1 = ?', answer: '5', options: ['4', '5', '6'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq9', question: '0 + 7 = ?', answer: '7', options: ['6', '7', '8'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asq10', question: '8 − 8 = ?', answer: '0', options: ['0', '1', '2'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
];

const FIXED_ADD_SUB_100_QUIZ_QUESTIONS: MathProblem[] = [
  { id: 'as100q1', question: 'Câu 1: 12 + 5 = ?', answer: '17', options: ['16', '17', '18'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q2', question: 'Câu 2: 20 − 4 = ?', answer: '16', options: ['15', '16', '17'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q3', question: 'Câu 3: 15 + 3 = ?', answer: '18', options: ['17', '18', '19'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q4', question: 'Câu 4: 30 − 10 = ?', answer: '20', options: ['20', '10', '15'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q5', question: 'Câu 5: 22 + 2 = ?', answer: '24', options: ['23', '24', '25'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q6', question: 'Câu 6: 40 − 5 = ?', answer: '35', options: ['34', '35', '36'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q7', question: 'Câu 7: 10 + 10 = ?', answer: '20', options: ['20', '21', '19'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q8', question: 'Câu 8: 18 − 8 = ?', answer: '10', options: ['9', '10', '11'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q9', question: 'Câu 9: 25 + 4 = ?', answer: '29', options: ['28', '29', '30'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100q10', question: 'Câu 10: 50 − 20 = ?', answer: '30', options: ['20', '30', '40'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
];

const FIXED_ADD_SUB_100_FUN_QUESTIONS: MathProblem[] = [
  { id: 'as100f1', question: 'Câu 1: 27 + 15 = ?', answer: '42', options: ['40', '42', '43'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f2', question: 'Câu 2: 45 − 23 = ?', answer: '22', options: ['22', '21', '23'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f3', question: 'Câu 3: 36 + 28 = ?', answer: '64', options: ['64', '63', '62'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f4', question: 'Câu 4: 70 − 35 = ?', answer: '35', options: ['35', '34', '36'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f5', question: 'Câu 5: 48 + 12 = ?', answer: '60', options: ['60', '59', '61'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f6', question: 'Câu 6: 90 − 27 = ?', answer: '63', options: ['63', '62', '61'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f7', question: 'Câu 7: 25 + 25 = ?', answer: '50', options: ['40', '50', '60'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f8', question: 'Câu 8: 60 − 18 = ?', answer: '42', options: ['42', '41', '43'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f9', question: 'Câu 9: 33 + 19 = ?', answer: '52', options: ['52', '51', '53'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100f10', question: 'Câu 10: 80 − 45 = ?', answer: '35', options: ['35', '34', '36'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 100' },
];

const FIXED_ADD_SUB_100_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'as100c1', question: 'Câu 1: 14 + ? = 20', answer: '6', options: ['5', '6', '7'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c2', question: 'Câu 2: ? − 10 = 25', answer: '35', options: ['35', '30', '40'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c3', question: 'Câu 3: 50 + 20 − 10 = ?', answer: '60', options: ['60', '70', '80'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c4', question: 'Câu 4: 100 − 50 = ?', answer: '50', options: ['40', '50', '60'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c5', question: 'Câu 5: 35 + 5 − 10 = ?', answer: '30', options: ['30', '29', '31'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c6', question: 'Câu 6: 20 + 30 + 40 = ?', answer: '90', options: ['80', '90', '100'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c7', question: 'Câu 7: 80 − 20 − 30 = ?', answer: '30', options: ['30', '40', '50'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c8', question: 'Câu 8: 15 + 15 + 15 = ?', answer: '45', options: ['40', '45', '50'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c9', question: 'Câu 9: 60 + ? = 100', answer: '40', options: ['30', '40', '50'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
  { id: 'as100c10', question: 'Câu 10: 75 − 25 + 10 = ?', answer: '60', options: ['50', '60', '70'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 100' },
];

const FIXED_MEASUREMENT_QUIZ_QUESTIONS: MathProblem[] = [
  { id: 'mq1', question: 'Câu 1: Đơn vị đo độ dài thường dùng là:', answer: 'cm', options: ['cm', 'kg', 'lít'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq2', question: 'Câu 2: Dụng cụ dùng để đo độ dài là:', answer: 'Thước kẻ', options: ['Thước kẻ', 'Cái bát', 'Cái ly'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq3', question: 'Câu 3: Vật nào dài hơn?', answer: 'Bút chì', options: ['Bút chì', 'Cục tẩy', 'Cái kẹp giấy'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq4', question: 'Câu 4: 1 dm bằng bao nhiêu cm?', answer: '10 cm', options: ['10 cm', '100 cm', '1 cm'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq5', question: 'Câu 5: Sợi dây dài hơn cái bút nghĩa là:', answer: 'Dây dài hơn', options: ['Dây ngắn hơn', 'Dây dài hơn', 'Bằng nhau'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq6', question: 'Câu 6: Vật nào ngắn hơn?', answer: 'Bút chì', options: ['Thước', 'Bút chì', 'Cái bảng'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq7', question: 'Câu 7: Đo độ dài bàn học dùng:', answer: 'Thước', options: ['Thước', 'Muỗng', 'Ly'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq8', question: 'Câu 8: 1 gang tay là:', answer: 'Đơn vị đo độ dài', options: ['Đơn vị đo độ dài', 'Đơn vị đo cân nặng', 'Đơn vị đo nước'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq9', question: 'Câu 9: So sánh: 5 cm … 7 cm', answer: '<', options: ['>', '<', '='], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mq10', question: 'Câu 10: Vật nào dài nhất?', answer: 'Cái bảng', options: ['Cái bút', 'Cái thước', 'Cái bảng'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
];

const FIXED_MEASUREMENT_FUN_QUESTIONS: MathProblem[] = [
  { id: 'mf1', question: 'Câu 1: 8 cm so với 6 cm:', answer: '>', options: ['>', '<', '='], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf2', question: 'Câu 2: Đo chiều dài bàn bằng đơn vị nào hợp lý?', answer: 'cm', options: ['cm', 'km', 'mm'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf3', question: 'Câu 3: Một đoạn dây dài 10 cm, cắt đi 4 cm, còn:', answer: '6 cm', options: ['5 cm', '6 cm', '7 cm'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf4', question: 'Câu 4: 1 dm = … cm', answer: '10', options: ['10', '100', '1'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf5', question: 'Câu 5: Đo chiều dài lớp học dùng đơn vị nào?', answer: 'm', options: ['cm', 'm', 'mm'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf6', question: 'Câu 6: So sánh: 1 dm … 9 cm', answer: '>', options: ['>', '<', '='], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf7', question: 'Câu 7: Vật nào dài hơn 10 cm?', answer: 'Bút chì', options: ['Bút chì', 'Cục tẩy', 'Cái kẹp giấy'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf8', question: 'Câu 8: Một que dài 7 cm, que khác dài 9 cm. Que nào dài hơn?', answer: '9 cm', options: ['7 cm', '9 cm', 'Bằng nhau'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf9', question: 'Câu 9: 2 dm = … cm', answer: '20', options: ['20', '2', '200'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
  { id: 'mf10', question: 'Câu 10: Một đoạn thẳng dài 5 cm, thêm 3 cm nữa được:', answer: '8 cm', options: ['7 cm', '8 cm', '9 cm'], difficulty: 'easy', topic: 'Độ dài & Đo lường' },
];

const FIXED_ADD_SUB_FUN_QUESTIONS: MathProblem[] = [
  { id: 'asf1', question: '3 + 4 − 2 = ?', answer: '5', options: ['4', '5', '6'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf2', question: '6 − 2 + 1 = ?', answer: '5', options: ['4', '5', '6'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf3', question: '5 + 2 − 3 = ?', answer: '4', options: ['3', '4', '5'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf4', question: '7 − 4 + 2 = ?', answer: '5', options: ['4', '5', '6'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf5', question: '2 + 5 − 6 = ?', answer: '1', options: ['1', '2', '3'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf6', question: '9 − 3 − 2 = ?', answer: '4', options: ['3', '4', '5'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf7', question: '4 + 3 − 5 = ?', answer: '2', options: ['2', '3', '4'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf8', question: '8 − 6 + 3 = ?', answer: '5', options: ['4', '5', '6'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf9', question: '1 + 8 − 7 = ?', answer: '2', options: ['2', '3', '4'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asf10', question: '10 − 5 + 2 = ?', answer: '7', options: ['6', '7', '8'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 10' },
];

const FIXED_ADD_SUB_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'asc1', question: 'Số nào lớn hơn: 6 hay 8?', answer: '8', options: ['6', '8'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc2', question: '3 + ? = 7', answer: '4', options: ['3', '4', '5'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc3', question: '9 − ? = 5', answer: '4', options: ['3', '4', '5'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc4', question: '2 + 2 + 2 = ?', answer: '6', options: ['5', '6', '7'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc5', question: '7 − 2 − 2 = ?', answer: '3', options: ['2', '3', '4'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc6', question: '4 + ? = 10', answer: '6', options: ['5', '6', '7'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc7', question: '8 − ? = 2', answer: '6', options: ['5', '6', '7'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc8', question: '1 + 2 + 3 = ?', answer: '6', options: ['5', '6', '7'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc9', question: '10 − 5 − 2 = ?', answer: '3', options: ['2', '3', '4'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
  { id: 'asc10', question: 'Số nào bé hơn: 5 hay 3?', answer: '3', options: ['5', '3'], difficulty: 'medium', topic: 'Cộng, trừ phạm vi 10' },
];

const FIXED_GEOMETRY_FUN_QUESTIONS: MathProblem[] = [
  { id: 'gf1', question: 'Câu 1: Hình nào có nhiều hơn 3 cạnh?', answer: 'Hình vuông', options: ['Hình tam giác', 'Hình vuông', 'Hình tròn'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf2', question: 'Câu 2: Hình nào có ít cạnh nhất?', answer: 'Hình tròn', options: ['Hình vuông', 'Hình tam giác', 'Hình tròn'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf3', question: 'Câu 3: Trong các hình sau, hình nào có 4 góc?', answer: 'Hình chữ nhật', options: ['Hình tròn', 'Hình tam giác', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf4', question: 'Câu 4: Hình nào có thể ghép từ 2 hình tam giác?', answer: 'Hình vuông', options: ['Hình vuông', 'Hình tròn', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf5', question: 'Câu 5: Hình nào KHÔNG phải hình phẳng cơ bản?', answer: 'Hình cầu', options: ['Hình tròn', 'Hình vuông', 'Hình cầu'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf6', question: 'Câu 6: Hình nào có tất cả các cạnh bằng nhau?', answer: 'Hình vuông', options: ['Hình vuông', 'Hình chữ nhật', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf7', question: 'Câu 7: Hình nào có 4 cạnh và 4 góc?', answer: 'Hình chữ nhật', options: ['Hình tam giác', 'Hình chữ nhật', 'Hình tròn'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf8', question: 'Câu 8: Hình nào có thể lăn?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình vuông', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf9', question: 'Câu 9: Hình nào giống cửa sổ?', answer: 'Hình vuông', options: ['Hình tròn', 'Hình vuông', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình phẳng' },
  { id: 'gf10', question: 'Câu 10: Hình nào không có góc?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình vuông', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình phẳng' },
];

const FIXED_SOLID_SHAPES_FUN_QUESTIONS: MathProblem[] = [
  { id: 'sf1', question: 'Câu 1: Khối nào giống quả bóng?', answer: 'Khối cầu', options: ['Khối cầu', 'Khối lập phương', 'Khối trụ'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf2', question: 'Câu 2: Khối nào có dạng hộp sữa?', answer: 'Khối hộp chữ nhật', options: ['Khối trụ', 'Khối hộp chữ nhật', 'Khối cầu'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf3', question: 'Câu 3: Khối nào có 6 mặt bằng nhau?', answer: 'Khối lập phương', options: ['Khối cầu', 'Khối lập phương', 'Khối trụ'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf4', question: 'Câu 4: Khối nào lăn được?', answer: 'Khối cầu', options: ['Khối cầu', 'Khối lập phương', 'Khối hộp'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf5', question: 'Câu 5: Khối nào giống lon nước?', answer: 'Khối trụ', options: ['Khối trụ', 'Khối cầu', 'Khối lập phương'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf6', question: 'Câu 6: Khối nào không có cạnh?', answer: 'Khối cầu', options: ['Khối cầu', 'Khối lập phương', 'Khối hộp'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf7', question: 'Câu 7: Khối nào có thể xếp chồng dễ dàng?', answer: 'Khối lập phương', options: ['Khối lập phương', 'Khối cầu', 'Khối trụ'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf8', question: 'Câu 8: Khối nào vừa lăn vừa đứng được?', answer: 'Khối trụ', options: ['Khối cầu', 'Khối trụ', 'Khối lập phương'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf9', question: 'Câu 9: Khối nào giống viên xúc xắc?', answer: 'Khối lập phương', options: ['Khối cầu', 'Khối lập phương', 'Khối trụ'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
  { id: 'sf10', question: 'Câu 10: Khối nào không lăn được?', answer: 'Khối lập phương', options: ['Khối lập phương', 'Khối cầu', 'Khối trụ'], difficulty: 'easy', topic: 'Hình khối & Vị trí' },
];

const FIXED_GEOMETRY_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'gc1', question: 'Câu 1: Hình nào khác loại?', answer: 'Hình tròn', options: ['Hình vuông', 'Hình tròn', 'Hình chữ nhật'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc2', question: 'Câu 2: Hình nào có nhiều cạnh hơn hình tam giác?', answer: 'Hình vuông', options: ['Hình vuông', 'Hình tròn', 'Không có'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc3', question: 'Câu 3: Hình nào có 4 cạnh bằng nhau?', answer: 'Hình vuông', options: ['Hình chữ nhật', 'Hình vuông', 'Hình tròn'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc4', question: 'Câu 4: Hình nào KHÔNG có góc?', answer: 'Hình tròn', options: ['Hình tròn', 'Hình vuông', 'Hình tam giác'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc5', question: 'Câu 5: Hình nào giống cái bảng?', answer: 'Hình chữ nhật', options: ['Hình chữ nhật', 'Hình tròn', 'Hình tam giác'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc6', question: 'Câu 6: Hình nào có 4 góc vuông?', answer: 'Hình chữ nhật', options: ['Hình tròn', 'Hình tam giác', 'Hình chữ nhật'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc7', question: 'Câu 7: Hình nào có 3 góc?', answer: 'Hình tam giác', options: ['Hình vuông', 'Hình tam giác', 'Hình tròn'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc8', question: 'Câu 8: Hình nào giống cái phong bì thư?', answer: 'Hình chữ nhật', options: ['Hình chữ nhật', 'Hình tròn', 'Hình vuông'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc9', question: 'Câu 9: Hình nào có thể chia thành 2 hình vuông?', answer: 'Hình chữ nhật', options: ['Hình chữ nhật', 'Hình tròn', 'Hình tam giác'], difficulty: 'medium', topic: 'Hình phẳng' },
  { id: 'gc10', question: 'Câu 10: Hình nào có 4 cạnh?', answer: 'Hình chữ nhật', options: ['Hình tam giác', 'Hình chữ nhật', 'Hình tròn'], difficulty: 'medium', topic: 'Hình phẳng' },
];

const FIXED_SOLID_SHAPES_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'sc1', question: 'Câu 1: Con mèo ở dưới bàn nghĩa là:', answer: 'Dưới bàn', options: ['Trên bàn', 'Dưới bàn', 'Bên cạnh bàn'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc2', question: 'Câu 2: Quả bóng ở trên ghế nghĩa là:', answer: 'Trên ghế', options: ['Dưới ghế', 'Trên ghế', 'Trong ghế'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc3', question: 'Câu 3: Cái bút nằm bên cạnh quyển sách nghĩa là:', answer: 'Ở gần bên', options: ['Ở xa', 'Ở gần bên', 'Ở dưới'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc4', question: 'Câu 4: Quả bóng ở trong hộp nghĩa là:', answer: 'Trong hộp', options: ['Ngoài hộp', 'Trong hộp', 'Trên hộp'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc5', question: 'Câu 5: Con chó đứng trước nhà nghĩa là:', answer: 'Trước nhà', options: ['Sau nhà', 'Trước nhà', 'Trong nhà'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc6', question: 'Câu 6: Con chim đậu trên cành cây nghĩa là:', answer: 'Ở trên', options: ['Ở dưới', 'Ở trên', 'Ở trong'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc7', question: 'Câu 7: Đôi dép ở dưới gầm giường nghĩa là:', answer: 'Ở dưới', options: ['Ở trên', 'Ở dưới', 'Ở cạnh'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc8', question: 'Câu 8: Em bé đứng bên trái mẹ nghĩa là:', answer: 'Bên trái', options: ['Bên phải', 'Bên trái', 'Đằng sau'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc9', question: 'Câu 9: Quyển vở ở giữa cái bút và cái thước nghĩa là:', answer: 'Ở giữa', options: ['Ở trên', 'Ở giữa', 'Ở dưới'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
  { id: 'sc10', question: 'Câu 10: Chiếc xe đạp ở ngoài sân nghĩa là:', answer: 'Ngoài sân', options: ['Trong nhà', 'Ngoài sân', 'Trên mái nhà'], difficulty: 'medium', topic: 'Hình khối & Vị trí' },
];

const FIXED_NUMBERS_TO_100_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'nc1', question: 'Câu 1: Số nào lớn nhất?', answer: '87', options: ['78', '87', '77'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc2', question: 'Câu 2: Số nào bé nhất?', answer: '9', options: ['90', '9', '19'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc3', question: 'Câu 3: Số 36 gồm:', answer: '3 chục 6 đơn vị', options: ['3 chục 6 đơn vị', '6 chục 3 đơn vị', '36 chục'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc4', question: 'Câu 4: Số liền sau của 99 là:', answer: '100', options: ['98', '100', '101'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc5', question: 'Câu 5: Số nào nằm giữa 49 và 51?', answer: '50', options: ['48', '50', '52'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc6', question: 'Câu 6: Số tròn chục lớn nhất có hai chữ số là:', answer: '90', options: ['90', '100', '80'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc7', question: 'Câu 7: Số 55 gồm:', answer: '5 chục 5 đơn vị', options: ['5 chục 5 đơn vị', '5 chục', '5 đơn vị'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc8', question: 'Câu 8: Số liền trước của 100 là:', answer: '99', options: ['99', '98', '101'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc9', question: 'Câu 9: Số nào bé hơn 70?', answer: '69', options: ['71', '69', '80'], difficulty: 'medium', topic: 'Các số đến 100' },
  { id: 'nc10', question: 'Câu 10: 8 chục và 4 đơn vị viết là:', answer: '84', options: ['48', '84', '80'], difficulty: 'medium', topic: 'Các số đến 100' },
];

const FIXED_NUMBERS_TO_100_FUN_QUESTIONS: MathProblem[] = [
  { id: 'nf1', question: 'Câu 1: 45 so với 54:', answer: '45 < 54', options: ['45 > 54', '45 < 54', '45 = 54'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf2', question: 'Câu 2: Số nào nằm giữa 38 và 40?', answer: '39', options: ['37', '39', '41'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf3', question: 'Câu 3: Số nào có 5 chục và 2 đơn vị?', answer: '52', options: ['25', '52', '50'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf4', question: 'Câu 4: Dãy số: 10, 20, 30, … số tiếp theo là:', answer: '40', options: ['35', '40', '50'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf5', question: 'Câu 5: Số nào lớn hơn 67 nhưng bé hơn 70?', answer: '68', options: ['66', '68', '70'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf6', question: 'Câu 6: Số 80 gồm:', answer: '8 chục', options: ['8 chục', '8 đơn vị', '80 đơn vị'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf7', question: 'Câu 7: Số nào nhỏ hơn 55?', answer: '54', options: ['56', '54', '57'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf8', question: 'Câu 8: 99 là:', answer: '9 chục 9 đơn vị', options: ['9 chục 9 đơn vị', '99 chục', '9 đơn vị'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf9', question: 'Câu 9: Số nào đứng trước 71?', answer: '70', options: ['70', '72', '69'], difficulty: 'easy', topic: 'Các số đến 100' },
  { id: 'nf10', question: 'Câu 10: Số nào là số tròn chục?', answer: '40', options: ['34', '40', '45'], difficulty: 'easy', topic: 'Các số đến 100' },
];

const FIXED_MEASUREMENT_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'mc1', question: 'Câu 1: Đơn vị nào dùng đo độ dài?', answer: 'cm', options: ['cm', 'kg', 'lít'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc2', question: 'Câu 2: So sánh: 10 cm … 1 dm', answer: '=', options: ['>', '<', '='], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc3', question: 'Câu 3: Vật nào ngắn nhất?', answer: 'Cục tẩy', options: ['Bút', 'Thước', 'Cục tẩy'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc4', question: 'Câu 4: Đo độ dài cần dùng:', answer: 'Thước', options: ['Thước', 'Nồi', 'Ly'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc5', question: 'Câu 5: 3 cm + 4 cm = ?', answer: '7 cm', options: ['6 cm', '7 cm', '8 cm'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc6', question: 'Câu 6: 10 cm còn gọi là:', answer: '1 dm', options: ['1 dm', '2 dm', '1 cm'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc7', question: 'Câu 7: 15 cm - 5 cm = ?', answer: '10 cm', options: ['10 cm', '20 cm', '11 cm'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc8', question: 'Câu 8: Số thích hợp: 1 dm = ... cm', answer: '10', options: ['1', '10', '100'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc9', question: 'Câu 9: Gang tay của em dài khoảng:', answer: '15 cm', options: ['1 cm', '15 cm', '100 cm'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
  { id: 'mc10', question: 'Câu 10: Chiều dài quyển sách Toán khoảng:', answer: '25 cm', options: ['25 cm', '25 dm', '25 m'], difficulty: 'medium', topic: 'Độ dài & Đo lường' },
];

const FIXED_TIME_CALENDAR_QUIZ_QUESTIONS: MathProblem[] = [
  { id: 'tcq1', question: 'Câu 1: Một ngày có bao nhiêu giờ?', answer: '24 giờ', options: ['12 giờ', '24 giờ', '48 giờ'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq2', question: 'Câu 2: Buổi sáng diễn ra vào:', answer: 'Ban ngày', options: ['Ban đêm', 'Ban ngày', 'Buổi tối'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq3', question: 'Câu 3: Kim ngắn trên đồng hồ chỉ gì?', answer: 'Giờ', options: ['Giờ', 'Phút', 'Giây'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq4', question: 'Câu 4: Kim dài trên đồng hồ chỉ gì?', answer: 'Phút', options: ['Giờ', 'Phút', 'Ngày'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq5', question: 'Câu 5: Khi đồng hồ chỉ 3 giờ nghĩa là:', answer: '3 giờ', options: ['3 giờ', '6 giờ', '9 giờ'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq6', question: 'Câu 6: Một tuần có bao nhiêu ngày?', answer: '7 ngày', options: ['5 ngày', '6 ngày', '7 ngày'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq7', question: 'Câu 7: Ngày đầu tiên của tuần là:', answer: 'Thứ Hai', options: ['Thứ Hai', 'Chủ nhật', 'Thứ Ba'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq8', question: 'Câu 8: Buổi tối là thời gian:', answer: 'Cả hai', options: ['Học bài', 'Ngủ', 'Cả hai'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq9', question: 'Câu 9: Một ngày có mấy buổi chính?', answer: '4', options: ['2', '3', '4'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcq10', question: 'Câu 10: Lịch dùng để:', answer: 'Xem ngày tháng', options: ['Xem ngày tháng', 'Xem giờ', 'Xem cân nặng'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
];

const FIXED_TIME_CALENDAR_FUN_QUESTIONS: MathProblem[] = [
  { id: 'tcf1', question: 'Sau thứ Hai là:', answer: 'Thứ Ba', options: ['Thứ Ba', 'Thứ Tư', 'Chủ nhật'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf2', question: 'Trước thứ Sáu là:', answer: 'Thứ Năm', options: ['Thứ Tư', 'Thứ Năm', 'Thứ Bảy'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf3', question: 'Một ngày có mấy giờ?', answer: '24', options: ['12', '24', '36'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf4', question: '7 giờ sáng là:', answer: 'Buổi sáng', options: ['Buổi sáng', 'Buổi tối', 'Ban đêm'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf5', question: 'Đồng hồ có 2 kim chính là:', answer: 'Kim giờ và kim phút', options: ['Kim giờ và kim phút', 'Kim phút và kim giây', 'Kim giờ và kim giây'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf6', question: 'Chủ nhật là ngày thứ mấy trong tuần?', answer: 'Cuối tuần', options: ['Cuối tuần', 'Đầu tuần', 'Giữa tuần'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf7', question: 'Một tháng thường có:', answer: '30 hoặc 31 ngày', options: ['20 ngày', '30 hoặc 31 ngày', '40 ngày'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf8', question: '9 giờ tối thuộc:', answer: 'Buổi tối', options: ['Buổi sáng', 'Buổi chiều', 'Buổi tối'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf9', question: 'Nếu hôm nay là thứ Ba, ngày mai là:', answer: 'Thứ Tư', options: ['Thứ Hai', 'Thứ Tư', 'Thứ Năm'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
  { id: 'tcf10', question: 'Nếu hôm nay là thứ Sáu, hôm qua là:', answer: 'Thứ Năm', options: ['Thứ Năm', 'Thứ Bảy', 'Chủ nhật'], difficulty: 'easy', topic: 'Thời gian & Lịch' },
];

const FIXED_TIME_CALENDAR_CONQUER_QUESTIONS: MathProblem[] = [
  { id: 'tcc1', question: 'Đồng hồ chỉ 4 giờ nghĩa là:', answer: '4 giờ', options: ['4 giờ', '5 giờ', '6 giờ'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc2', question: 'Một tuần có:', answer: '7 ngày', options: ['5 ngày', '6 ngày', '7 ngày'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc3', question: 'Sau Chủ nhật là:', answer: 'Thứ Hai', options: ['Thứ Hai', 'Thứ Ba', 'Thứ Sáu'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc4', question: 'Buổi chiều là khoảng thời gian:', answer: 'Sau buổi sáng', options: ['Sau buổi sáng', 'Trước buổi sáng', 'Sau buổi tối'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc5', question: 'Lịch giúp ta biết:', answer: 'Ngày', options: ['Giờ', 'Ngày', 'Cân nặng'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc6', question: 'Một ngày bắt đầu từ:', answer: 'Buổi sáng', options: ['Buổi sáng', 'Buổi trưa', 'Buổi tối'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc7', question: 'Khi kim dài chỉ số 12, kim ngắn chỉ số 8, lúc đó là:', answer: '8 giờ', options: ['8 giờ', '12 giờ', '4 giờ'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc8', question: 'Thứ Năm rồi đến thứ mấy?', answer: 'Thứ Sáu', options: ['Thứ Tư', 'Thứ Sáu', 'Thứ Bảy'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc9', question: 'Buổi trưa thường là lúc:', answer: 'Ăn cơm trưa', options: ['Đi học', 'Ăn cơm trưa', 'Đi ngủ tối'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
  { id: 'tcc10', question: 'Một năm có bao nhiêu tháng?', answer: '12 tháng', options: ['10 tháng', '11 tháng', '12 tháng'], difficulty: 'medium', topic: 'Thời gian & Lịch' },
];

const FIXED_REVIEW_QUIZ_QUESTIONS_G2: MathProblem[] = [
  { id: 'rqg2-1', question: '25 + 3 = ?', answer: '28', options: ['27', '28', '29'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-2', question: '40 − 5 = ?', answer: '35', options: ['34', '35', '36'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-3', question: 'Số liền sau của 19 là:', answer: '20', options: ['18', '20', '21'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-4', question: 'Số liền trước của 50 là:', answer: '49', options: ['49', '48', '51'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-5', question: '10 + 20 = ?', answer: '30', options: ['20', '30', '40'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-6', question: '36 gồm:', answer: '3 chục 6 đơn vị', options: ['3 chục 6 đơn vị', '6 chục 3 đơn vị', '36 chục'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-7', question: 'Số nào lớn hơn 45?', answer: '46', options: ['44', '46', '43'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-8', question: '60 − 20 = ?', answer: '40', options: ['30', '40', '50'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-9', question: 'Số nào bé nhất?', answer: '10', options: ['12', '21', '10'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rqg2-10', question: '5 + 5 + 5 = ?', answer: '15', options: ['10', '15', '20'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
];

const FIXED_REVIEW_ESSAY_QUESTIONS_G2: MathProblem[] = [
  { id: 'reg2-1', question: 'Tính: 45 + 23 = …', answer: '68', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-2', question: 'Tính: 78 − 34 = …', answer: '44', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-3', question: 'Tính: 60 + 20 − 15 = …', answer: '65', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-4', question: 'Một bạn có 35 viên kẹo, cho bạn 12 viên. Hỏi còn lại bao nhiêu viên?', answer: '23', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-5', question: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 45, 54, 40, 50', answer: '40, 45, 50, 54', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-6', question: 'Số lớn nhất có hai chữ số là số nào?', answer: '99', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-7', question: 'Tính: 10 + 30 + 5 = ...', answer: '45', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-8', question: 'Điền số thích hợp: 20, 25, 30, ..., 40', answer: '35', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-9', question: 'Lan có 20 quyển vở, mẹ mua thêm cho Lan 10 quyển nữa. Hỏi Lan có tất cả bao nhiêu quyển vở?', answer: '30', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'reg2-10', question: 'Tính: 100 - 50 = ...', answer: '50', options: [], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
];

const FIXED_REVIEW_APP_QUESTIONS_G2: MathProblem[] = [
  { id: 'rag2-1', question: '15 + ? = 25', answer: '10', options: ['5', '10', '15'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-2', question: '? − 20 = 30', answer: '50', options: ['40', '50', '60'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-3', question: '50 + 30 − 20 = ?', answer: '60', options: ['60', '70', '80'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-4', question: 'Số lớn nhất là:', answer: '98', options: ['89', '98', '88'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-5', question: 'Số bé nhất là:', answer: '7', options: ['70', '7', '17'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-6', question: '100 - ? = 40', answer: '60', options: ['50', '60', '70'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-7', question: '? + 15 = 30', answer: '15', options: ['15', '20', '25'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-8', question: '45 - 5 + 10 = ?', answer: '50', options: ['40', '50', '60'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-9', question: 'Số nào đứng trước số 100?', answer: '99', options: ['98', '99', '101'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
  { id: 'rag2-10', question: '20 + 20 + 20 = ?', answer: '60', options: ['40', '50', '60'], difficulty: 'easy', topic: 'Ôn tập & Bổ sung' },
];

const FIXED_ADD_SUB_20_QUIZ_QUESTIONS_G2: MathProblem[] = [
  { id: 'as20q-1', question: '12 + 3 = ?', answer: '15', options: ['14', '15', '16'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-2', question: '15 − 5 = ?', answer: '10', options: ['9', '10', '11'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-3', question: '10 + 7 = ?', answer: '17', options: ['16', '17', '18'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-4', question: '18 − 8 = ?', answer: '10', options: ['9', '10', '11'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-5', question: '9 + 6 = ?', answer: '15', options: ['14', '15', '16'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-6', question: '14 − 4 = ?', answer: '10', options: ['9', '10', '11'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-7', question: '8 + 5 = ?', answer: '13', options: ['12', '13', '14'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-8', question: '13 − 3 = ?', answer: '10', options: ['9', '10', '11'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-9', question: '6 + 6 = ?', answer: '12', options: ['11', '12', '13'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20q-10', question: '20 − 10 = ?', answer: '10', options: ['5', '10', '15'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
];

const FIXED_ADD_SUB_20_ESSAY_QUESTIONS_G2: MathProblem[] = [
  { id: 'as20e-1', question: 'Tính: 14 + 5 = …', answer: '19', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-2', question: 'Tính: 19 − 7 = …', answer: '12', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-3', question: 'Tính: 8 + 9 − 6 = …', answer: '11', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-4', question: 'Một bạn có 16 viên kẹo, ăn 5 viên. Hỏi còn lại bao nhiêu viên?', answer: '11', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-5', question: 'Viết phép tính rồi tính: Có 9 quả táo, mua thêm 8 quả nữa. Hỏi có tất cả bao nhiêu quả?', answer: '9 + 8 = 17', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-6', question: 'Tính: 12 + 8 = …', answer: '20', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-7', question: 'Tính: 20 − 5 = …', answer: '15', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-8', question: 'Tính: 7 + 7 + 4 = …', answer: '18', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-9', question: 'Điền số thích hợp: 15 + … = 19', answer: '4', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20e-10', question: 'Điền số thích hợp: … − 6 = 10', answer: '16', options: [], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
];

const FIXED_ADD_SUB_20_APP_QUESTIONS_G2: MathProblem[] = [
  { id: 'as20a-1', question: '10 + ? = 18', answer: '8', options: ['6', '7', '8'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-2', question: '? − 6 = 12', answer: '18', options: ['16', '17', '18'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-3', question: '7 + 8 − 5 = ?', answer: '10', options: ['9', '10', '11'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-4', question: '20 − 10 + 4 = ?', answer: '14', options: ['12', '13', '14'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-5', question: '6 + 7 + 3 = ?', answer: '16', options: ['15', '16', '17'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-6', question: '15 - ? = 9', answer: '6', options: ['5', '6', '7'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-7', question: '? + 4 = 13', answer: '9', options: ['8', '9', '10'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-8', question: '11 + 5 - 4 = ?', answer: '12', options: ['11', '12', '13'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-9', question: '18 - 9 + 2 = ?', answer: '11', options: ['10', '11', '12'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
  { id: 'as20a-10', question: '5 + 5 + 5 + 5 = ?', answer: '20', options: ['15', '20', '25'], difficulty: 'easy', topic: 'Cộng, trừ phạm vi 20' },
];

const FIXED_KG_LIT_QUIZ_QUESTIONS_G2: MathProblem[] = [
  { id: 'klq-1', question: 'Đơn vị đo cân nặng là:', answer: 'kg', options: ['kg', 'lít', 'cm'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-2', question: 'Đơn vị đo dung tích là:', answer: 'lít', options: ['kg', 'lít', 'm'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-3', question: 'Dụng cụ đo cân nặng là:', answer: 'Cân', options: ['Cân', 'Thước', 'Ly'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-4', question: '1 kg = … g', answer: '1000', options: ['100', '1000', '10'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-5', question: 'Vật nào nặng hơn?', answer: 'Cặp sách', options: ['Cục tẩy', 'Cặp sách', 'Bút chì'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-6', question: 'Chai nước thường đo bằng:', answer: 'lít', options: ['kg', 'lít', 'cm'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-7', question: 'Vật nào nhẹ hơn?', answer: 'Tờ giấy', options: ['Viên đá', 'Tờ giấy', 'Quyển sách'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-8', question: '1 lít là:', answer: 'Đơn vị đo dung tích', options: ['Đơn vị đo dung tích', 'Đơn vị đo chiều dài', 'Đơn vị đo cân nặng'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-9', question: 'Nước trong chai càng nhiều thì:', answer: 'Càng nặng', options: ['Càng nhẹ', 'Càng nặng', 'Không đổi'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'klq-10', question: 'Dụng cụ đo lít là:', answer: 'Ca đong', options: ['Ca đong', 'Cân', 'Thước'], difficulty: 'easy', topic: 'kg & Lít' },
];

const FIXED_KG_LIT_ESSAY_QUESTIONS_G2: MathProblem[] = [
  { id: 'kle-1', question: 'Kể tên 2 vật được đo bằng kg.', answer: 'Gạo, thịt', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-2', question: 'Kể tên 2 vật được đo bằng lít.', answer: 'Nước, dầu ăn', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-3', question: '5 kg + 3 kg = …', answer: '8 kg', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-4', question: '6 lít − 2 lít = …', answer: '4 lít', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-5', question: 'Một can có 4 lít nước, thêm 3 lít nữa. Hỏi có tất cả bao nhiêu lít?', answer: '7 lít', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-6', question: '10 kg - 4 kg = ...', answer: '6 kg', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-7', question: '2 lít + 5 lít + 1 lít = ...', answer: '8 lít', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-8', question: 'Mẹ mua 5 kg gạo và 2 kg đỗ. Hỏi mẹ mua tất cả bao nhiêu ki-lô-gam?', answer: '7 kg', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-9', question: 'Một bình có 10 lít nước, rót ra 3 lít. Hỏi trong bình còn bao nhiêu lít nước?', answer: '7 lít', options: [], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kle-10', question: 'Điền đơn vị thích hợp (kg hoặc lít): Một bao gạo nặng 20 ...', answer: 'kg', options: [], difficulty: 'easy', topic: 'kg & Lít' },
];

const FIXED_KG_LIT_APP_QUESTIONS_G2: MathProblem[] = [
  { id: 'kla-1', question: 'Đơn vị nào dùng đo cân nặng?', answer: 'kg', options: ['kg', 'lít', 'cm'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-2', question: '1 lít … 2 lít', answer: '<', options: ['>', '<', '='], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-3', question: '3 kg + 2 kg = ?', answer: '5 kg', options: ['4 kg', '5 kg', '6 kg'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-4', question: '4 lít − 1 lít = ?', answer: '3 lít', options: ['2 lít', '3 lít', '4 lít'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-5', question: 'Vật nào dùng để đo kg?', answer: 'Cân', options: ['Cân', 'Ca đong', 'Thước'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-6', question: '10 lít - 5 lít = ?', answer: '5 lít', options: ['4 lít', '5 lít', '6 lít'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-7', question: '7 kg + 3 kg = ?', answer: '10 kg', options: ['9 kg', '10 kg', '11 kg'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-8', question: 'Đơn vị nào dùng đo dung tích?', answer: 'lít', options: ['kg', 'lít', 'cm'], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-9', question: '5 kg ... 3 kg', answer: '>', options: ['>', '<', '='], difficulty: 'easy', topic: 'kg & Lít' },
  { id: 'kla-10', question: 'Một túi đường nặng 1 ...', answer: 'kg', options: ['kg', 'lít', 'cm'], difficulty: 'easy', topic: 'kg & Lít' },
];

const FIXED_ADD_SUB_100_QUIZ_QUESTIONS_G2: MathProblem[] = [
  { id: 'as100q-1', question: '27 + 5 = ?', answer: '32', options: ['31', '32', '33', '30'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-2', question: '46 + 7 = ?', answer: '53', options: ['52', '53', '54', '51'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-3', question: '38 - 9 = ?', answer: '29', options: ['29', '30', '28', '27'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-4', question: '50 - 6 = ?', answer: '44', options: ['44', '45', '43', '46'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-5', question: '29 + 6 = ?', answer: '35', options: ['34', '35', '36', '33'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-6', question: '61 - 4 = ?', answer: '57', options: ['57', '56', '55', '58'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-7', question: '18 + 7 = ?', answer: '25', options: ['24', '25', '26', '23'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-8', question: '72 - 5 = ?', answer: '67', options: ['66', '67', '68', '69'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-9', question: '39 + 4 = ?', answer: '43', options: ['43', '42', '44', '41'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100q-10', question: '80 - 7 = ?', answer: '73', options: ['73', '72', '74', '75'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
];

const FIXED_ADD_SUB_100_ESSAY_QUESTIONS_G2: MathProblem[] = [
  { id: 'as100e-1', question: 'Đặt tính rồi tính: 36 + 8', answer: '44', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-2', question: 'Đặt tính rồi tính: 72 - 9', answer: '63', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-3', question: 'Một cửa hàng có 45 quả táo, bán đi 8 quả. Hỏi còn lại bao nhiêu quả táo?', answer: '37', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-4', question: 'Lan có 27 viên kẹo, mẹ cho thêm 9 viên. Hỏi Lan có tất cả bao nhiêu viên kẹo?', answer: '36', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-5', question: 'Tính: 58 + 7 - 6', answer: '59', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-6', question: 'Đặt tính rồi tính: 49 + 6', answer: '55', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-7', question: 'Đặt tính rồi tính: 80 - 4', answer: '76', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-8', question: 'Có 34 con chim đậu trên cành, 7 con bay đi. Hỏi còn lại bao nhiêu con chim?', answer: '27', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-9', question: 'Tìm x: x - 8 = 25', answer: '33', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100e-10', question: 'Tính: 62 - 5 + 8', answer: '65', options: [], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
];

const FIXED_ADD_SUB_100_APP_QUESTIONS_G2: MathProblem[] = [
  { id: 'as100a-1', question: '37 + 8 = ?', answer: '45', options: ['44', '45', '46', '43'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-2', question: '84 - 7 = ?', answer: '77', options: ['76', '77', '78', '75'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-3', question: '29 + 9 = ?', answer: '38', options: ['37', '38', '39', '36'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-4', question: '73 - 8 = ?', answer: '65', options: ['64', '65', '66', '67'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-5', question: '48 + 7 = ?', answer: '55', options: ['54', '55', '56', '53'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-6', question: '62 - 5 = ?', answer: '57', options: ['56', '57', '58', '55'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-7', question: '19 + 6 = ?', answer: '25', options: ['24', '25', '26', '23'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-8', question: '51 - 4 = ?', answer: '47', options: ['46', '47', '48', '45'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-9', question: '35 + 7 = ?', answer: '42', options: ['41', '42', '43', '40'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
  { id: 'as100a-10', question: '90 - 3 = ?', answer: '87', options: ['86', '87', '88', '89'], difficulty: 'easy', topic: 'Cộng, trừ có nhớ (100)' },
];

const FIXED_GEOMETRY_TIME_QUIZ_QUESTIONS_G2: MathProblem[] = [
  { id: 'gtq-1', question: 'Hình nào có 3 cạnh?', answer: 'Hình tam giác', options: ['Hình vuông', 'Hình tam giác', 'Hình tròn', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-2', question: 'Hình vuông có mấy cạnh?', answer: '4', options: ['3', '4', '5', '2'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-3', question: 'Đồng hồ chỉ 3 giờ đúng là kim phút chỉ số mấy?', answer: '12', options: ['3', '6', '12', '9'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-4', question: '1 ngày có bao nhiêu giờ?', answer: '24', options: ['12', '24', '60', '30'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-5', question: 'Hình tròn có cạnh không?', answer: 'Không', options: ['Có', 'Không', 'Có 1 cạnh', 'Có 2 cạnh'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-6', question: '1 giờ có bao nhiêu phút?', answer: '60', options: ['100', '60', '30', '24'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-7', question: 'Hình chữ nhật có mấy cạnh?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-8', question: '1 tuần có bao nhiêu ngày?', answer: '7', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-9', question: 'Đồng hồ chỉ 6 giờ thì kim giờ chỉ số mấy?', answer: '6', options: ['3', '6', '12', '9'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gtq-10', question: 'Hình tam giác có mấy góc?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
];

const FIXED_GEOMETRY_TIME_ESSAY_QUESTIONS_G2: MathProblem[] = [
  { id: 'gte-1', question: 'Vẽ một đoạn thẳng dài 6 cm.', answer: 'Vẽ đoạn thẳng', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-2', question: 'Một hình tam giác có mấy cạnh?', answer: '3', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-3', question: 'Một hình tứ giác có mấy cạnh?', answer: '4', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-4', question: 'Kể tên các ngày trong tuần.', answer: 'Thứ Hai, Thứ Ba, Thứ Tư, Thứ Năm, Thứ Sáu, Thứ Bảy, Chủ Nhật', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-5', question: 'Đồng hồ chỉ 9 giờ đúng, kim phút chỉ vào số mấy?', answer: '12', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-6', question: 'Một giờ có bao nhiêu phút?', answer: '60', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-7', question: 'Nếu hôm nay là thứ Ba, thì ngày mai là thứ mấy?', answer: 'Thứ Tư', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-8', question: 'Vẽ một đường gấp khúc gồm 2 đoạn thẳng.', answer: 'Vẽ đường gấp khúc', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-9', question: 'Đồng hồ chỉ 11 giờ 30 phút, kim phút chỉ vào số mấy?', answer: '6', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gte-10', question: 'Kể tên 3 tháng trong một năm.', answer: 'Tháng 1, Tháng 2, Tháng 3', options: [], difficulty: 'easy', topic: 'Hình học & Thời gian' },
];

const FIXED_GEOMETRY_TIME_APP_QUESTIONS_G2: MathProblem[] = [
  { id: 'gta-1', question: 'Hình nào lăn được?', answer: 'Hình tròn', options: ['Hình vuông', 'Hình tròn', 'Hình tam giác', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-2', question: '30 phút = ? giờ', answer: '1/2 giờ', options: ['1 giờ', '1/2 giờ', '2 giờ', '3 giờ'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-3', question: '1 ngày có mấy buổi chính?', answer: '5', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-4', question: 'Hình nào có 4 cạnh nhưng không bằng nhau?', answer: 'Hình chữ nhật', options: ['Hình vuông', 'Hình chữ nhật', 'Hình tròn', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-5', question: '1 giờ kém 10 phút là mấy phút?', answer: '50', options: ['40', '50', '60', '30'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-6', question: 'Hình tam giác có mấy cạnh?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-7', question: 'Đồng hồ chỉ 12 giờ đúng, kim phút chỉ số mấy?', answer: '12', options: ['3', '6', '12', '9'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-8', question: 'Một tuần lễ có mấy ngày?', answer: '7', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-9', question: 'Hình vuông có mấy cạnh bằng nhau?', answer: '4', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
  { id: 'gta-10', question: '1 giờ có bao nhiêu phút?', answer: '60', options: ['100', '60', '30', '24'], difficulty: 'easy', topic: 'Hình học & Thời gian' },
];

const FIXED_MULTIPLICATION_DIVISION_QUIZ_QUESTIONS_G2: MathProblem[] = [
  { id: 'mdq1', question: '2 × 3 = ?', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq2', question: '4 × 2 = ?', answer: '8', options: ['6', '7', '8', '9'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq3', question: '6 : 2 = ?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq4', question: '8 : 4 = ?', answer: '2', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq5', question: '5 × 2 = ?', answer: '10', options: ['7', '8', '9', '10'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq6', question: '9 : 3 = ?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq7', question: '3 × 3 = ?', answer: '9', options: ['6', '7', '8', '9'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq8', question: '10 : 2 = ?', answer: '5', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq9', question: '7 × 1 = ?', answer: '7', options: ['6', '7', '8', '9'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mdq10', question: '12 : 3 = ?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
];

const FIXED_MULTIPLICATION_DIVISION_ESSAY_QUESTIONS_G2: MathProblem[] = [
  { id: 'mde1', question: 'Tính: 3 × 4 = ?', answer: '12', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde2', question: 'Tính: 12 : 3 = ?', answer: '4', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde3', question: 'Có 3 nhóm, mỗi nhóm có 5 bạn. Hỏi có tất cả bao nhiêu bạn?', answer: '15', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde4', question: 'Có 12 cái kẹo chia đều cho 4 bạn. Mỗi bạn được mấy cái?', answer: '3', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde5', question: 'Tính: 2 × 5 + 6 = ?', answer: '16', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde6', question: 'Tính: 5 × 4 = ?', answer: '20', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde7', question: 'Tính: 15 : 5 = ?', answer: '3', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde8', question: 'Mỗi con gà có 2 cái chân. Hỏi 8 con gà có bao nhiêu cái chân?', answer: '16', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde9', question: 'Có 20 quả cam xếp đều vào 5 đĩa. Mỗi đĩa có mấy quả cam?', answer: '4', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mde10', question: 'Tính: 2 × 8 - 4 = ?', answer: '12', options: [], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
];

const FIXED_MULTIPLICATION_DIVISION_APP_QUESTIONS_G2: MathProblem[] = [
  { id: 'mda1', question: '2 × 5 = ?', answer: '10', options: ['8', '9', '10', '11'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda2', question: '12 : 2 = ?', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda3', question: '3 × 5 = ?', answer: '15', options: ['13', '14', '15', '16'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda4', question: '20 : 5 = ?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda5', question: '4 × 3 = ?', answer: '12', options: ['10', '11', '12', '13'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda6', question: '2 × 8 = ?', answer: '16', options: ['14', '16', '18', '20'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda7', question: '15 : 3 = ?', answer: '5', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda8', question: '5 × 4 = ?', answer: '20', options: ['15', '20', '25', '30'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda9', question: '18 : 2 = ?', answer: '9', options: ['8', '9', '10', '11'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
  { id: 'mda10', question: '2 × 9 = ?', answer: '18', options: ['16', '18', '20', '22'], difficulty: 'easy', topic: 'Phép nhân & Phép chia' },
];

const FIXED_NUMBERS_TO_1000_QUIZ_QUESTIONS_G2: MathProblem[] = [
  { id: 'n1000q-1', question: 'Số nào lớn hơn 245?', answer: '260', options: ['200', '230', '260', '240'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-2', question: 'Số 356 gồm:', answer: '3 trăm, 5 chục, 6 đơn vị', options: ['3 chục, 5 trăm, 6 đơn vị', '3 trăm, 5 chục, 6 đơn vị', '3 trăm, 6 chục, 5 đơn vị', '5 trăm, 3 chục, 6 đơn vị'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-3', question: 'Số liền sau của 199 là:', answer: '200', options: ['198', '200', '201', '190'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-4', question: 'Số 400 có mấy trăm?', answer: '4', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-5', question: 'Số nào bé nhất?', answer: '345', options: ['345', '354', '435', '543'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-6', question: 'Số 700 gồm:', answer: '7 trăm', options: ['7 chục', '7 trăm', '7 đơn vị', '70 trăm'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-7', question: 'Số liền trước của 500 là:', answer: '499', options: ['499', '501', '498', '490'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-8', question: '300 + 200 = ?', answer: '500', options: ['400', '500', '600', '700'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-9', question: '1000 là số có mấy chữ số?', answer: '4', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000q-10', question: 'Số 120 gồm:', answer: '1 trăm, 2 chục', options: ['1 trăm, 2 chục', '2 trăm, 1 chục', '1 trăm, 2 đơn vị', '12 chục'], difficulty: 'easy', topic: 'Các số đến 1000' },
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

const playBase64Audio = (dataUrl: string, volume: number = 0.8) => {
  if (!dataUrl) return;
  const audio = new Audio(dataUrl);
  audio.volume = volume;
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
    <div className="map-container">
      <div className="map-content max-w-3xl mx-auto bg-white/50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4 relative">
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
      <div className="sm:hidden text-center text-slate-400 text-xs mt-2 italic">
        Vuốt sang ngang để xem thêm →
      </div>
    </div>
  );
};

const Grade2Map = ({ topics, user, onSelect }: { topics: typeof GRADE_2_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="map-container">
      <div className="map-content max-w-3xl mx-auto bg-blue-50/50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4 relative">
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
      <div className="sm:hidden text-center text-slate-400 text-xs mt-2 italic">
        Vuốt sang ngang để xem thêm →
      </div>
    </div>
  );
};

const Grade3Map = ({ topics, user, onSelect }: { topics: typeof GRADE_3_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="map-container">
      <div className="map-content max-w-3xl mx-auto bg-emerald-50/50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4 relative">
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
      <div className="sm:hidden text-center text-slate-400 text-xs mt-2 italic">
        Vuốt sang ngang để xem thêm →
      </div>
    </div>
  );
};

const Grade4Map = ({ topics, user, onSelect }: { topics: typeof GRADE_4_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="map-container">
      <div className="map-content max-w-3xl mx-auto bg-pink-50/50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4 relative">
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
      <div className="sm:hidden text-center text-slate-400 text-xs mt-2 italic">
        Vuốt sang ngang để xem thêm →
      </div>
    </div>
  );
};

const Grade5Map = ({ topics, user, onSelect }: { topics: typeof GRADE_5_TOPICS, user: UserProfile, onSelect: (topic: any) => void }) => {
  return (
    <div className="map-container">
      <div className="map-content max-w-3xl mx-auto bg-indigo-950 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden p-8 mb-4 relative">
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
      <div className="sm:hidden text-center text-slate-400 text-xs mt-2 italic">
        Vuốt sang ngang để xem thêm →
      </div>
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSemester, setReviewSemester] = useState<1 | 2 | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [essayAnswer, setEssayAnswer] = useState('');
  const [isFunPlayMode, setIsFunPlayMode] = useState(false);
  const [isConquerMode, setIsConquerMode] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [activeQuestions, setActiveQuestions] = useState<MathProblem[]>([]);
  const [useBrowserTTS, setUseBrowserTTS] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const playQuestionAudio = async (text: string) => {
    if (audioLoading) return;
    
    // Check cache first
    if (audioCache[text]) {
      playBase64Audio(audioCache[text], volume);
      return;
    }

    // If we've hit quota limits, use browser TTS directly
    if (useBrowserTTS) {
      speakWithBrowser(text);
      return;
    }

    setAudioLoading(true);
    try {
      const dataUrl = await generateSpeech(text);
      if (dataUrl) {
        setAudioCache(prev => ({ ...prev, [text]: dataUrl }));
        playBase64Audio(dataUrl, volume);
      }
    } catch (error: any) {
      const isQuotaError = error.message?.includes("429") || error.status === "RESOURCE_EXHAUSTED";
      
      if (isQuotaError) {
        console.warn("Gemini TTS quota exceeded, switching to browser TTS.");
        setUseBrowserTTS(true);
      } else {
        console.error("Speech generation failed:", error);
      }
      
      speakWithBrowser(text);
    } finally {
      setAudioLoading(false);
    }
  };

  const speakWithBrowser = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9; // Slightly slower for children
      utterance.volume = volume;
      window.speechSynthesis.speak(utterance);
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
    
    const savedVolume = localStorage.getItem('math_volume');
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
    }
  }, []);

  // Save user to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('math_user', JSON.stringify(user));
    }
  }, [user]);

  // Save volume to local storage
  useEffect(() => {
    localStorage.setItem('math_volume', volume.toString());
  }, [volume]);

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
      let questions = FIXED_CONQUER_QUESTIONS;
      if (selectedTopic?.title === 'Hình phẳng') {
        questions = FIXED_GEOMETRY_CONQUER_QUESTIONS;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 10') {
        questions = FIXED_ADD_SUB_CONQUER_QUESTIONS;
      } else if (selectedTopic?.title === 'Hình khối & Vị trí') {
        questions = FIXED_SOLID_SHAPES_CONQUER_QUESTIONS;
      } else if (selectedTopic?.title === 'Các số đến 100') {
        questions = FIXED_NUMBERS_TO_100_CONQUER_QUESTIONS;
      } else if (selectedTopic?.title === 'Độ dài & Đo lường') {
        questions = FIXED_MEASUREMENT_CONQUER_QUESTIONS;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 100') {
        questions = FIXED_ADD_SUB_100_CONQUER_QUESTIONS;
      } else if (selectedTopic?.title === 'Thời gian & Lịch') {
        questions = FIXED_TIME_CALENDAR_CONQUER_QUESTIONS;
      }
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
      let questions = FIXED_FUN_QUESTIONS;
      if (selectedTopic?.title === 'Hình phẳng') {
        questions = FIXED_GEOMETRY_FUN_QUESTIONS;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 10') {
        questions = FIXED_ADD_SUB_FUN_QUESTIONS;
      } else if (selectedTopic?.title === 'Hình khối & Vị trí') {
        questions = FIXED_SOLID_SHAPES_FUN_QUESTIONS;
      } else if (selectedTopic?.title === 'Các số đến 100') {
        questions = FIXED_NUMBERS_TO_100_FUN_QUESTIONS;
      } else if (selectedTopic?.title === 'Độ dài & Đo lường') {
        questions = FIXED_MEASUREMENT_FUN_QUESTIONS;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 100') {
        questions = FIXED_ADD_SUB_100_FUN_QUESTIONS;
      } else if (selectedTopic?.title === 'Thời gian & Lịch') {
        questions = FIXED_TIME_CALENDAR_FUN_QUESTIONS;
      }
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
      let questions = FIXED_QUIZ_QUESTIONS;
      if (selectedTopic?.title === 'Hình phẳng') {
        questions = FIXED_GEOMETRY_QUIZ_QUESTIONS;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 10') {
        questions = FIXED_ADD_SUB_QUIZ_QUESTIONS;
      } else if (selectedTopic?.title === 'Hình khối & Vị trí') {
        questions = FIXED_SOLID_SHAPES_QUIZ_QUESTIONS;
      } else if (selectedTopic?.title === 'Các số đến 100') {
        questions = FIXED_NUMBERS_TO_100_QUIZ_QUESTIONS;
      } else if (selectedTopic?.title === 'Độ dài & Đo lường') {
        questions = FIXED_MEASUREMENT_QUIZ_QUESTIONS;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 100') {
        questions = FIXED_ADD_SUB_100_QUIZ_QUESTIONS;
      } else if (selectedTopic?.title === 'Thời gian & Lịch') {
        questions = FIXED_TIME_CALENDAR_QUIZ_QUESTIONS;
      }
      setActiveQuestions(questions);
      setCurrentProblem(questions[0]);
      setIsCorrect(null);
      setSelectedOption(null);
      setExplanation(null);
      setState('playing');
      setLoading(false);
      return;
    }

    // Check if it's the fixed quiz for Grade 2 "Thử sức"
    if (user.grade === 2 && (topic.toUpperCase().includes("THỬ SỨC") || topic.toUpperCase().includes("TRẮC NGHIỆM"))) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Bổ sung') {
        questions = FIXED_REVIEW_QUIZ_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 20') {
        questions = FIXED_ADD_SUB_20_QUIZ_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'kg & Lít') {
        questions = FIXED_KG_LIT_QUIZ_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Cộng, trừ có nhớ (100)') {
        questions = FIXED_ADD_SUB_100_QUIZ_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Hình học & Thời gian') {
        questions = FIXED_GEOMETRY_TIME_QUIZ_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Phép nhân & Phép chia') {
        questions = FIXED_MULTIPLICATION_DIVISION_QUIZ_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Các số đến 1000') {
        questions = FIXED_NUMBERS_TO_1000_QUIZ_QUESTIONS_G2;
      }
      
      if (questions.length > 0) {
        setActiveQuestions(questions);
        setCurrentProblem(questions[0]);
        setIsCorrect(null);
        setSelectedOption(null);
        setExplanation(null);
        setState('playing');
        setLoading(false);
        return;
      }
    }

    // Check if it's the fixed essay for Grade 2 "Tự luận"
    if (user.grade === 2 && topic.toUpperCase().includes("TỰ LUẬN")) {
      setIsFunPlayMode(true);
      setIsQuizMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setEssayAnswer('');
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Bổ sung') {
        questions = FIXED_REVIEW_ESSAY_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 20') {
        questions = FIXED_ADD_SUB_20_ESSAY_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'kg & Lít') {
        questions = FIXED_KG_LIT_ESSAY_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Cộng, trừ có nhớ (100)') {
        questions = FIXED_ADD_SUB_100_ESSAY_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Hình học & Thời gian') {
        questions = FIXED_GEOMETRY_TIME_ESSAY_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Phép nhân & Phép chia') {
        questions = FIXED_MULTIPLICATION_DIVISION_ESSAY_QUESTIONS_G2;
      }
      
      if (questions.length > 0) {
        setActiveQuestions(questions);
        setCurrentProblem(questions[0]);
        setIsCorrect(null);
        setSelectedOption(null);
        setExplanation(null);
        setState('playing');
        setLoading(false);
        return;
      }
    }

    // Check if it's the fixed application for Grade 2 "Ứng dụng"
    if (user.grade === 2 && topic.toUpperCase().includes("ỨNG DỤNG")) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Bổ sung') {
        questions = FIXED_REVIEW_APP_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Cộng, trừ phạm vi 20') {
        questions = FIXED_ADD_SUB_20_APP_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'kg & Lít') {
        questions = FIXED_KG_LIT_APP_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Cộng, trừ có nhớ (100)') {
        questions = FIXED_ADD_SUB_100_APP_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Hình học & Thời gian') {
        questions = FIXED_GEOMETRY_TIME_APP_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Phép nhân & Phép chia') {
        questions = FIXED_MULTIPLICATION_DIVISION_APP_QUESTIONS_G2;
      }
      
      if (questions.length > 0) {
        setActiveQuestions(questions);
        setCurrentProblem(questions[0]);
        setIsCorrect(null);
        setSelectedOption(null);
        setExplanation(null);
        setState('playing');
        setLoading(false);
        return;
      }
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
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 py-4 sm:py-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand-pink border-4 border-slate-800 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] shrink-0">
            <User size={24} className="text-white sm:w-8 sm:h-8" />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-display font-bold text-xl sm:text-2xl truncate">Chào, {user.name}!</h2>
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm sm:text-base">
              <Star size={14} className="text-brand-yellow fill-brand-yellow sm:w-4 sm:h-4" />
              <span>Lớp {user.grade} • Cấp độ {user.level}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
            <Trophy size={16} className="text-brand-yellow sm:w-5 sm:h-5" />
            <span className="font-display font-bold text-sm sm:text-base">{user.points} điểm</span>
          </div>
          <div className="w-24 sm:w-32">
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
              className="flex flex-col gap-6 sm:gap-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-800 mb-1 sm:mb-2">Hôm nay học gì nhỉ?</h1>
                  <p className="text-slate-600 text-base sm:text-lg">Chọn một chủ đề để bắt đầu cuộc phiêu lưu!</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      setReviewSemester(1);
                      setShowReviewModal(true);
                    }}
                    className="kid-button bg-brand-green text-white text-[10px] sm:text-sm py-2 px-2 sm:px-4 flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <BookOpen size={14} className="sm:w-4 sm:h-4" />
                    Ôn tập HK1
                  </button>
                  <button 
                    onClick={() => {
                      setReviewSemester(2);
                      setShowReviewModal(true);
                    }}
                    className="kid-button bg-emerald-600 text-white text-[10px] sm:text-sm py-2 px-2 sm:px-4 flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <BookOpen size={14} className="sm:w-4 sm:h-4" />
                    Ôn tập HK2
                  </button>
                  <button 
                    onClick={() => setShowExamModal(true)}
                    className="kid-button bg-brand-blue text-white text-[10px] sm:text-sm py-2 px-2 sm:px-4 flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <ClipboardCheck size={14} className="sm:w-4 sm:h-4" />
                    Kiểm tra
                  </button>
                  <button 
                    onClick={() => setShowExitConfirm(true)}
                    className="kid-button bg-brand-pink text-white text-xs sm:text-sm py-2 px-3 sm:px-4 flex-1 sm:flex-none"
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
              <div className="kid-card bg-brand-yellow/10 border-brand-yellow p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-brand-yellow rounded-lg border-2 border-slate-800 shrink-0">
                    <BookOpen size={20} className="text-slate-800 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-800">Kiến thức cần nhớ - Lớp {user.grade}</h2>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {getGradeKnowledge(user.grade).map((item, idx) => (
                    <li 
                      key={idx} 
                      className="flex items-start gap-2 text-slate-700 cursor-pointer hover:bg-brand-yellow/20 p-2 rounded-lg transition-colors group"
                      onClick={() => setSelectedReview(item)}
                    >
                      <span className="text-brand-yellow font-bold group-hover:scale-125 transition-transform">•</span>
                      <span className="group-hover:text-slate-900 font-medium text-sm sm:text-base">{item.title}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[10px] sm:text-xs text-slate-500 italic text-center sm:text-left">* Nhấn vào từng mục để xem chi tiết kiến thức nhé!</p>
              </div>
            </motion.div>
          )}

          {state === 'topic_menu' && selectedTopic && (
            <motion.div 
              key="topic_menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6 sm:gap-8"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full">
                  <button 
                    onClick={() => setState('dashboard')}
                    className="p-2 sm:p-3 bg-white hover:bg-slate-100 rounded-2xl border-4 border-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
                  >
                    <Home size={20} className="text-slate-800 sm:w-6 sm:h-6" />
                  </button>
                  <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                    <div className={`p-2 sm:p-3 rounded-2xl ${selectedTopic.color} border-4 border-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] shrink-0`}>
                      <selectedTopic.icon size={24} className="text-slate-800 sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="font-display font-bold text-xl sm:text-3xl text-slate-800 truncate">{selectedTopic.emoji} {selectedTopic.title}</h1>
                  </div>
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
              className="flex flex-col gap-6 sm:gap-8"
            >
              <div className="flex items-center justify-between gap-2">
                <button 
                  onClick={() => setState(selectedTopic ? 'topic_menu' : 'dashboard')}
                  className="flex items-center gap-1 sm:gap-2 text-slate-600 font-bold hover:text-slate-800 transition-colors group text-sm sm:text-base shrink-0"
                >
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Quay lại</span>
                  <span className="xs:hidden">Lại</span>
                </button>
                <div className="flex items-center gap-1 sm:gap-2 bg-white px-3 py-1 rounded-full border-2 border-slate-800 font-bold text-slate-800 text-xs sm:text-sm">
                  Câu {quizIndex + 1}/10
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-brand-orange font-bold text-xs sm:text-sm">
                  <Sparkles size={16} className="sm:w-5 sm:h-5" />
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
                  <div className="kid-card p-5 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 bg-brand-yellow/10 rounded-bl-3xl">
                      <Brain size={32} className="text-brand-yellow opacity-20 sm:w-10 sm:h-10" />
                    </div>
                    <div className="flex items-start gap-3 sm:gap-4 mb-6">
                      <p className="text-xl sm:text-2xl md:text-3xl font-medium leading-relaxed flex-1">
                        {currentProblem.question}
                      </p>
                      <button 
                        onClick={() => playQuestionAudio(currentProblem.question)}
                        disabled={audioLoading}
                        className="p-2 sm:p-3 bg-brand-blue text-white rounded-2xl border-4 border-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] hover:scale-110 transition-all active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 shrink-0"
                        title="Nghe câu hỏi"
                      >
                        {audioLoading ? <Loader2 size={20} className="animate-spin sm:w-6 sm:h-6" /> : <Volume2 size={20} className="sm:w-6 sm:h-6" />}
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
            onClick={() => setShowSettings(true)}
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
                      const cleanText = selectedReview.content.replace(/[#*`]/g, '');
                      
                      if (audioCache[cleanText]) {
                        playBase64Audio(audioCache[cleanText], volume);
                        return;
                      }

                      if (useBrowserTTS) {
                        speakWithBrowser(cleanText);
                        return;
                      }

                      setIsTtsLoading(true);
                      try {
                        const dataUrl = await generateSpeech(cleanText);
                        if (dataUrl) {
                          setAudioCache(prev => ({ ...prev, [cleanText]: dataUrl }));
                          playBase64Audio(dataUrl, volume);
                        } else {
                          throw new Error("No audio data");
                        }
                      } catch (error: any) {
                        const isQuotaError = error.message?.includes("429") || error.status === "RESOURCE_EXHAUSTED";
                        if (isQuotaError) {
                          console.warn("Gemini TTS quota exceeded, switching to browser TTS.");
                          setUseBrowserTTS(true);
                        } else {
                          console.error("Gemini TTS failed:", error);
                        }
                        speakWithBrowser(cleanText);
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

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="kid-card max-w-2xl w-full p-6 sm:p-8 bg-white max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-800">Ôn tập Học kì {reviewSemester} - Lớp {user.grade}</h2>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {getReviewMaterials(user.grade)
                  .filter(m => reviewSemester === 1 ? (m.id.includes('mid1') || m.id.includes('term1')) : (m.id.includes('mid2') || m.id.includes('term2')))
                  .map((material) => (
                  <button 
                    key={material.id}
                    onClick={() => {
                      setSelectedReview({ title: material.title, content: material.content });
                      setShowReviewModal(false);
                    }}
                    className="kid-card p-4 flex items-center gap-3 hover:border-brand-green transition-all bg-brand-green/5 group"
                  >
                    <div className="p-2 bg-brand-green rounded-lg text-white group-hover:scale-110 transition-transform">
                      <BookOpen size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-display font-bold text-lg">{material.title}</h3>
                      <p className="text-slate-500 text-xs">Nhấn để xem tài liệu</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-brand-blue/10 p-4 rounded-2xl border-2 border-brand-blue/20 flex items-start gap-3">
                <div className="p-2 bg-brand-blue rounded-lg text-white shrink-0">
                  <Lightbulb size={18} />
                </div>
                <p className="text-slate-700 text-sm italic">
                  "Ôn tập kỹ giúp các em tự tin hơn trong các kỳ thi sắp tới. Chúc các em học tốt!"
                </p>
              </div>

              <button 
                onClick={() => setShowReviewModal(false)}
                className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="kid-card p-6 sm:p-8 max-w-sm w-full bg-white flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-brand-yellow rounded-lg border-2 border-slate-800">
                  <Settings size={24} className="text-slate-800" />
                </div>
                <h3 className="font-display font-bold text-2xl text-slate-800">Cài đặt</h3>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
                      <Volume2 size={20} />
                      Âm lượng
                    </label>
                    <span className="font-bold text-slate-600">{Math.round(volume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-yellow border-2 border-slate-800"
                  />
                </div>

                <div className="h-px bg-slate-200 my-2" />

                <button 
                  onClick={() => {
                    setShowSettings(false);
                    setShowExitConfirm(true);
                  }}
                  className="kid-button bg-brand-pink text-white w-full flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  Thoát ứng dụng
                </button>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="kid-button bg-slate-200 text-slate-800 w-full"
                >
                  Đóng
                </button>
              </div>
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

function getReviewMaterials(grade: number) {
  const materials: Record<number, { id: string; title: string; content: string }[]> = {
    1: [
      { id: 'g1_mid1', title: 'Giữa học kì 1', content: `### 📚 Ôn tập Giữa học kì 1 - Lớp 1\n\n1. **Các số từ 0 đến 10**\n- Nhận biết mặt số, cách đọc, cách viết.\n- So sánh số: >, <, =.\n- Tách, gộp số.\n\n2. **Hình phẳng**\n- Hình vuông, hình tròn, hình tam giác, hình chữ nhật.\n\n3. **Phép cộng trong phạm vi 5**\n- Các phép tính cơ bản.` },
      { id: 'g1_term1', title: 'Học kì 1', content: `### 📚 BỘ CÂU HỎI ÔN TẬP HỌC KÌ 1 – TOÁN 1

#### Phần 1. Nhận biết và viết các số trong phạm vi 10
- Đọc các số từ 0 đến 10.
- Đếm xuôi từ 0 đến 10.
- Đếm ngược từ 10 về 0.
- Viết các số: 0, 1, 2, 3, 4, 5.
- Viết các số: 6, 7, 8, 9, 10.
- Số liền sau của 4 là số nào?
- Số liền sau của 8 là số nào?
- Số liền trước của 5 là số nào?
- Số liền trước của 10 là số nào?
- Số nào bé hơn 1 đơn vị so với 7?
- Số nào lớn hơn 1 đơn vị so với 6?
- Trong các số 2, 5, 8, 1, số lớn nhất là số nào?
- Trong các số 2, 5, 8, 1, số bé nhất là số nào?
- Điền số còn thiếu: 0, 1, 2, …, 4, 5.
- Điền số còn thiếu: 5, 6, …, 8, 9, 10.
- Điền số còn thiếu: 10, 9, 8, …, 6, 5.
- Điền số thích hợp vào chỗ chấm: …, 3, 4, 5.
- Điền số thích hợp vào chỗ chấm: 7, 8, 9, ….
- Số 0 cho biết điều gì?
- Em hãy kể tên 3 đồ vật có số lượng là 1.
- Em hãy kể tên 3 nhóm đồ vật có số lượng là 0.
- Nhìn hình, cho biết có bao nhiêu đồ vật.
- Khoanh vào số chỉ số lượng của mỗi nhóm hình.

#### Phần 2. So sánh số lượng: nhiều hơn, ít hơn, bằng nhau
- Nhóm nào có nhiều hơn? Nhóm nào có ít hơn?
- Hai nhóm nào có số lượng bằng nhau?
- Điền từ thích hợp: nhiều hơn / ít hơn / bằng nhau.
- Số con vịt nhiều hơn hay số con gà nhiều hơn?
- Số quả táo ít hơn hay số quả cam ít hơn?
- Số bông hoa và số con bướm có bằng nhau không?
- Số bạn trai nhiều hơn hay số bạn gái nhiều hơn?
- Muốn biết hai nhóm đồ vật có bằng nhau không, em làm thế nào?

#### Phần 3. So sánh các số: >, <, =
- Điền dấu >, < hoặc = vào chỗ chấm: 3 … 5; 7 … 4; 6 … 6; 0 … 2; 9 … 8; 10 … 10.
- Số nào lớn hơn: 4 hay 6? Số nào bé hơn: 7 hay 9?
- Số nào bằng 5?
- Viết 3 cặp số có dấu >, <, =.
- Sắp xếp các số sau theo thứ tự từ bé đến lớn: 6, 2, 8, 5.
- Sắp xếp các số sau theo thứ tự từ lớn đến bé: 1, 9, 4, 7.
- Trong các số 3, 10, 6, 8, số nào lớn nhất? Số nào bé nhất?
- Điền số thích hợp: … > 4; 7 < …; 5 = ….
- Tìm một số vừa lớn hơn 2 vừa bé hơn 4.
- Tìm một số vừa lớn hơn 6 vừa bé hơn 8.

#### Phần 4. Tách – gộp số, “mấy và mấy”
- Số 5, 6, 7, 8, 9, 10 gồm mấy và mấy?
- Điền số thích hợp: 5 gồm 2 và …; 6 gồm 1 và …; 7 gồm 3 và …; 8 gồm 4 và …; 9 gồm 5 và …; 10 gồm 6 và ….
- Tách số 6, 7, 8 thành hai phần khác nhau.
- Nêu tất cả các cách tách số 5, 6, 7.
- Gộp 3 và 2 được mấy? Gộp 4 và 1 được mấy? Gộp 5 và 3 được mấy? Gộp 6 và 2 được mấy? Gộp 7 và 1 được mấy?
- Số 9, 10 gồm những cặp số nào?

#### Phần 5. Phép cộng trong phạm vi 10
- Tính: 1+1, 2+1, 3+1, 4+1, 5+1, 1+2, 1+3, 1+4, 1+5, 2+2, 2+3, 3+2, 4+2, 2+4, 3+3, 5+2, 2+5, 6+1, 1+6, 7+1, 1+7, 8+1, 1+8, 9+1, 1+9.
- Tính với số 0: 5+0, 0+5, 7+0, 0+7.
- Điền số thích hợp: 3 + … = 5; 4 + … = 6; 5 + … = 8; … + 2 = 7; … + 3 = 9; … + 1 = 10.
- Nêu phép cộng thích hợp với hình vẽ.
- Vì sao 2 + 3 và 3 + 2 cùng bằng 5?
- Nêu các phép cộng có kết quả bằng 10.

#### Phần 6. Phép trừ trong phạm vi 10
- Tính: 5-1, 6-1, 7-1, 8-1, 9-1, 10-1, 6-2, 7-2, 8-2, 9-2, 10-2, 7-3, 8-3, 9-3, 10-3, 8-4, 9-4, 10-4, 9-5, 10-5, 10-6, 10-7, 10-8, 10-9.
- Tính với số 0: 3-0, 6-0, 8-0, 10-0.
- Tính trừ chính nó: 5-5, 7-7, 9-9.
- Điền số thích hợp: 7 - … = 5; 8 - … = 4; 10 - … = 6; … - 2 = 5; … - 3 = 4; … - 1 = 8.
- Nêu phép trừ thích hợp với hình vẽ.
- Vì sao 7 - 0 = 7? Vì sao 6 - 6 = 0?

#### Phần 7. Quan hệ giữa phép cộng và phép trừ
- Từ phép cộng, hãy viết hai phép trừ tương ứng (ví dụ: 3+2=5).
- Viết “gia đình phép tính” của các số (ví dụ: 2, 3, 5).
- Tìm các phép cộng và phép trừ có kết quả bằng 5, 7, 10.

#### Phần 8. Tính nhẩm, điền số, tìm kết quả
- Tính nhẩm các phép tính cộng, trừ trong phạm vi 10.
- Điền số còn thiếu trong bảng cộng/trừ.
- Tìm toa tàu có kết quả lớn nhất/bé nhất.
- Điền dấu >, <, = vào giữa hai kết quả phép tính.

#### Phần 9. Bài toán lời nói đơn giản
- Có 3 quả táo, thêm 2 quả táo nữa. Hỏi có tất cả mấy quả táo?
- Có 5 con chim, bay đi 2 con. Hỏi còn lại mấy con?
- Có 4 bạn đang chơi, thêm 3 bạn nữa đến. Hỏi có tất cả mấy bạn?
- Có 8 bông hoa, hái đi 4 bông. Hỏi còn lại mấy bông?
- Có 2 con mèo và 3 con chó. Hỏi có tất cả mấy con vật?
- Có 7 chiếc kẹo, ăn mất 1 chiếc. Hỏi còn lại mấy chiếc?
- Có 6 quyển vở, cho bạn 2 quyển. Hỏi còn lại mấy quyển?
- Có 9 con cá, vớt ra 3 con. Hỏi còn lại mấy con cá?
- Có 5 bạn trai và 4 bạn gái. Hỏi lớp có tất cả mấy bạn?
- Có 10 quả bóng, bay mất 6 quả. Hỏi còn lại mấy quả?

#### Phần 10. Hình phẳng & Hình khối
- Kể tên các hình phẳng: Hình vuông, tròn, tam giác, chữ nhật.
- Kể tên các hình khối: Khối lập phương, khối hộp chữ nhật.
- Đặc điểm và nhận biết các hình trong thực tế.
- Đếm số lượng hình trong một hình vẽ phức hợp.

#### Phần 11. Vị trí, định hướng
- Nêu các từ chỉ vị trí: trước, sau, giữa, trên, dưới, phải, trái.
- Xác định vị trí của các vật trong không gian và trong lớp học.

#### Phần 12. Ôn tập tổng hợp cuối kì
- Tổng hợp các kiến thức về số, phép tính, hình học và vị trí.

#### 🌟 15 câu vận dụng thêm (Kiểm tra miệng)
1. Em hãy nêu 2 số lớn hơn 5.
2. Em hãy nêu 2 số bé hơn 5.
3. Em hãy nêu 2 số bằng nhau.
4. Em hãy nêu một phép cộng có số 0.
5. Em hãy nêu một phép trừ có kết quả bằng 0.
6. Em hãy nêu một phép tính có kết quả bằng 10.
7. Em hãy nêu một đồ vật dạng hình tròn.
8. Em hãy nêu một đồ vật dạng hình vuông.
9. Em hãy nêu một đồ vật dạng khối lập phương.
10. Em hãy nêu một đồ vật ở bên trái em.
11. Em hãy nêu một đồ vật ở bên phải em.
12. Em hãy nêu một vật ở trên bảng.
13. Em hãy nêu một vật ở dưới bàn.
14. Em hãy đặt một bài toán cộng trong phạm vi 10.
15. Em hãy đặt một bài toán trừ trong phạm vi 10.` },
      { id: 'g1_mid2', title: 'Giữa học kì 2', content: `### 📚 Ôn tập Giữa học kì 2 - Lớp 1\n\n1. **Các số đến 100**\n- Đọc, viết, so sánh các số.\n- Chục và đơn vị.\n\n2. **Độ dài và đo lường**\n- Đơn vị cm.\n- Cách dùng thước kẻ đo độ dài.\n\n3. **Phép cộng, trừ không nhớ trong phạm vi 100**\n- Tính nhẩm và đặt tính.` },
      { id: 'g1_term2', title: 'Học kì 2', content: `### 📚 Ôn tập Học kì 2 - Lớp 1\n\n1. **Tổng hợp kiến thức cả năm**\n- Các số đến 100.\n- Phép cộng, trừ phạm vi 100.\n\n2. **Thời gian và Lịch**\n- Xem giờ đúng trên đồng hồ.\n- Các ngày trong tuần.\n\n3. **Giải toán có lời văn**\n- Cách trình bày bài giải.` },
    ],
    2: [
      { id: 'g2_mid1', title: 'Giữa học kì 1', content: `### 📚 Ôn tập Giữa học kì 1 - Lớp 2\n\n1. **Ôn tập các số đến 100**\n- Số hạng, tổng, số bị trừ, số trừ, hiệu.\n\n2. **Phép cộng, trừ có nhớ trong phạm vi 20**\n- Bảng cộng, trừ 9, 8, 7, 6 cộng với một số.\n\n3. **Hình học**\n- Điểm, đoạn thẳng, đường thẳng, đường cong.\n- Ba điểm thẳng hàng.` },
      { id: 'g2_term1', title: 'Học kì 1', content: `### 📚 Ôn tập Học kì 1 - Lớp 2\n\n1. **Phép cộng, trừ có nhớ trong phạm vi 100**\n- Cách đặt tính và tính.\n\n2. **Đo lường**\n- Đơn vị kg, lít.\n\n3. **Thời gian**\n- Xem đồng hồ (giờ, phút).\n- Ngày, tháng.` },
      { id: 'g2_mid2', title: 'Giữa học kì 2', content: `### 📚 Ôn tập Giữa học kì 2 - Lớp 2\n\n1. **Phép nhân và Phép chia**\n- Thừa số, tích, số bị chia, số chia, thương.\n- Bảng nhân 2, 5. Bảng chia 2, 5.\n\n2. **Các số đến 1000**\n- Đơn vị, chục, trăm.\n- So sánh các số có ba chữ số.\n\n3. **Đo lường**\n- Đơn vị m, dm, cm, mm.` },
      { id: 'g2_term2', title: 'Học kì 2', content: `### 📚 Ôn tập Học kì 2 - Lớp 2\n\n1. **Phép cộng, trừ trong phạm vi 1000**\n- Tính toán không nhớ và có nhớ.\n\n2. **Hình học**\n- Hình tứ giác, hình tam giác.\n- Chu vi hình tam giác, hình tứ giác.\n\n3. **Tiền Việt Nam**\n- Nhận biết các mệnh giá tiền.` },
    ],
    3: [
      { id: 'g3_mid1', title: 'Giữa học kì 1', content: `### 📚 Ôn tập Giữa học kì 1 - Lớp 3\n\n1. **Ôn tập và bổ sung**\n- Cộng, trừ các số có ba chữ số.\n- Bảng nhân, chia 2, 3, 4, 5.\n\n2. **Bảng nhân, chia 6, 7, 8, 9**\n- Học thuộc các bảng tính.\n\n3. **Hình học**\n- Góc vuông, góc không vuông.\n- Đỉnh, cạnh của góc.` },
      { id: 'g3_term1', title: 'Học kì 1', content: `### 📚 Ôn tập Học kì 1 - Lớp 3\n\n1. **Phép nhân, chia trong phạm vi 1000**\n- Nhân số có hai, ba chữ số với số có một chữ số.\n- Chia số có hai, ba chữ số cho số có một chữ số.\n\n2. **Đo lường**\n- Đơn vị g, kg.\n- Đơn vị ml, l.\n\n3. **Diện tích**\n- Làm quen với diện tích một hình.` },
      { id: 'g3_mid2', title: 'Giữa học kì 2', content: `### 📚 Ôn tập Giữa học kì 2 - Lớp 3\n\n1. **Các số đến 10 000**\n- Đọc, viết, so sánh.\n- Phép cộng, trừ trong phạm vi 10 000.\n\n2. **Hình học**\n- Hình tròn, tâm, đường kính, bán kính.\n\n3. **Thống kê số liệu**\n- Làm quen với bảng số liệu.` },
      { id: 'g3_term2', title: 'Học kì 2', content: `### 📚 Ôn tập Học kì 2 - Lớp 3\n\n1. **Các số đến 100 000**\n- Phép cộng, trừ, nhân, chia phạm vi 100 000.\n\n2. **Diện tích**\n- Diện tích hình chữ nhật, hình vuông.\n\n3. **Tiền Việt Nam**\n- Các phép tính với tiền.` },
    ],
    4: [
      { id: 'g4_mid1', title: 'Giữa học kì 1', content: `### 📚 Ôn tập Giữa học kì 1 - Lớp 4\n\n1. **Số tự nhiên**\n- Các số có nhiều chữ số.\n- Triệu và lớp triệu.\n\n2. **Các phép tính với số tự nhiên**\n- Cộng, trừ số tự nhiên.\n- Tính chất giao hoán, kết hợp.\n\n3. **Hình học**\n- Góc nhọn, góc tù, góc bẹt.\n- Hai đường thẳng vuông góc, song song.` },
      { id: 'g4_term1', title: 'Học kì 1', content: `### 📚 Ôn tập Học kì 1 - Lớp 4\n\n1. **Phép nhân, phép chia**\n- Nhân với số có hai, ba chữ số.\n- Chia cho số có hai chữ số.\n\n2. **Trung bình cộng**\n- Cách tìm số trung bình cộng.\n\n3. **Biểu đồ**\n- Biểu đồ cột, biểu đồ tranh.` },
      { id: 'g4_mid2', title: 'Giữa học kì 2', content: `### 📚 Ôn tập Giữa học kì 2 - Lớp 4\n\n1. **Phân số**\n- Khái niệm phân số.\n- Tính chất cơ bản của phân số.\n- Rút gọn, quy đồng mẫu số.\n\n2. **So sánh phân số**\n- Cùng mẫu số, khác mẫu số.\n\n3. **Hình học**\n- Hình bình hành, hình thoi.\n- Diện tích hình bình hành, hình thoi.` },
      { id: 'g4_term2', title: 'Học kì 2', content: `### 📚 Ôn tập Học kì 2 - Lớp 4\n\n1. **Các phép tính với phân số**\n- Cộng, trừ, nhân, chia phân số.\n\n2. **Tỉ số**\n- Tìm hai số khi biết tổng và tỉ số.\n- Tìm hai số khi biết hiệu và tỉ số.\n\n3. **Tỉ lệ bản đồ**\n- Ứng dụng thực tế.` },
    ],
    5: [
      { id: 'g5_mid1', title: 'Giữa học kì 1', content: `### 📚 Ôn tập Giữa học kì 1 - Lớp 5\n\n1. **Ôn tập về phân số**\n- Phân số thập phân.\n- Hỗn số.\n\n2. **Số thập phân**\n- Khái niệm số thập phân.\n- Hàng của số thập phân.\n- Đọc, viết, so sánh số thập phân.\n\n3. **Đo lường**\n- Viết các số đo độ dài, khối lượng dưới dạng số thập phân.` },
      { id: 'g5_term1', title: 'Học kì 1', content: `### 📚 Ôn tập Học kì 1 - Lớp 5\n\n1. **Các phép tính với số thập phân**\n- Cộng, trừ, nhân, chia số thập phân.\n\n2. **Tỉ số phần trăm**\n- Giải toán về tỉ số phần trăm.\n\n3. **Hình học**\n- Hình tam giác, hình thang.\n- Diện tích hình tam giác, hình thang.` },
      { id: 'g5_mid2', title: 'Giữa học kì 2', content: `### 📚 Ôn tập Giữa học kì 2 - Lớp 5\n\n1. **Hình học không gian**\n- Hình hộp chữ nhật, hình lập phương.\n- Diện tích xung quanh, diện tích toàn phần.\n- Thể tích.\n\n2. **Số đo thời gian**\n- Cộng, trừ, nhân, chia số đo thời gian.\n\n3. **Vận tốc, Quãng đường, Thời gian**\n- Các bài toán về chuyển động đều.` },
      { id: 'g5_term2', title: 'Học kì 2', content: `### 📚 Ôn tập Học kì 2 - Lớp 5\n\n1. **Ôn tập tổng hợp**\n- Số tự nhiên, phân số, số thập phân.\n- Các phép tính.\n\n2. **Giải toán**\n- Các dạng toán điển hình.\n\n3. **Hình học**\n- Hình tròn, chu vi, diện tích.\n- Ôn tập về đo lường.` },
    ],
  };
  return materials[grade] || [];
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
        className="kid-card p-6 sm:p-10 max-w-md w-full flex flex-col gap-6 sm:gap-8"
      >
        <div className="text-center">
          <div className="inline-block p-4 sm:p-6 bg-brand-yellow rounded-3xl border-4 border-slate-800 mb-4 sm:mb-6 animate-float shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
            <Brain size={48} className="text-slate-800 sm:w-16 sm:h-16" />
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-800 mb-2">Toán Học Thông Minh</h1>
          <p className="text-slate-600 text-base sm:text-lg">Chào mừng bạn đến với thế giới toán học!</p>
        </div>

        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-display font-bold text-lg sm:text-xl ml-2">Tên của bạn là gì?</label>
            <input 
              type="text" 
              placeholder="Nhập tên của bạn..."
              className="kid-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-display font-bold text-lg sm:text-xl ml-2">Bạn đang học lớp mấy?</label>
            <div className="flex justify-between gap-1 sm:gap-2">
              {([1, 2, 3, 4, 5] as Grade[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-4 border-slate-800 font-display font-bold text-lg sm:text-xl transition-all
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
            className="kid-button-primary w-full flex items-center justify-center gap-2 mt-2 sm:mt-4"
          >
            Bắt đầu ngay <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

