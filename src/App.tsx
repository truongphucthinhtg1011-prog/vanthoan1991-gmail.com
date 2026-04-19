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

const FIXED_NUMBERS_TO_1000_ESSAY_QUESTIONS_G2: MathProblem[] = [
  { id: 'n1000e-1', question: 'Viết số gồm 4 trăm, 5 chục, 2 đơn vị.', answer: '452', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-2', question: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 345, 543, 435, 354', answer: '345, 354, 435, 543', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-3', question: 'Tính: 200 + 300 + 100 = ?', answer: '600', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-4', question: 'Tìm số liền trước và liền sau của 700.', answer: '699 và 701', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-5', question: 'Một cửa hàng có 450 quyển vở, bán đi 200 quyển. Hỏi còn lại bao nhiêu quyển?', answer: '250', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-6', question: 'Viết số gồm 8 trăm, 0 chục, 5 đơn vị.', answer: '805', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-7', question: 'So sánh 789 và 798.', answer: '789 < 798', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-8', question: 'Tính: 500 - 200 + 100 = ?', answer: '400', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-9', question: 'Số lớn nhất có 3 chữ số khác nhau là số nào?', answer: '987', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000e-10', question: 'Có 300 viên bi xanh và 400 viên bi đỏ. Hỏi có tất cả bao nhiêu viên bi?', answer: '700', options: [], difficulty: 'easy', topic: 'Các số đến 1000' },
];

const FIXED_NUMBERS_TO_1000_APP_QUESTIONS_G2: MathProblem[] = [
  { id: 'n1000a-1', question: '100 + 900 = ?', answer: '1000', options: ['900', '1000', '1100', '800'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-2', question: 'Số nào đứng giữa 399 và 401?', answer: '400', options: ['398', '400', '402', '403'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-3', question: '250 + 250 = ?', answer: '500', options: ['400', '450', '500', '550'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-4', question: 'Số 999 có mấy chữ số?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-5', question: '600 - 300 = ?', answer: '300', options: ['200', '300', '400', '500'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-6', question: 'Số liền trước của 1000 là số nào?', answer: '999', options: ['998', '999', '990', '1001'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-7', question: '400 + 50 + 7 = ?', answer: '457', options: ['457', '475', '547', '754'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-8', question: 'Số gồm 8 trăm và 2 chục là:', answer: '820', options: ['82', '802', '820', '280'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-9', question: '1000 - 500 = ?', answer: '500', options: ['400', '500', '600', '700'], difficulty: 'easy', topic: 'Các số đến 1000' },
  { id: 'n1000a-10', question: 'Số nào lớn nhất trong các số: 789, 987, 879, 978?', answer: '987', options: ['789', '987', '879', '978'], difficulty: 'easy', topic: 'Các số đến 1000' },
];

const FIXED_STATISTICS_PROBABILITY_QUIZ_QUESTIONS_G2: MathProblem[] = [
  { id: 'spq-1', question: 'Dữ liệu là gì?', answer: 'Số liệu thu thập được', options: ['Số liệu thu thập được', 'Phép tính', 'Hình vẽ', 'Con số bất kỳ'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-2', question: 'Trong bảng sau: Táo: 3, Cam: 5. Loại quả nào nhiều hơn?', answer: 'Cam', options: ['Táo', 'Cam', 'Bằng nhau', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-3', question: 'Tung 1 đồng xu, có mấy kết quả có thể xảy ra?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-4', question: 'Tung xúc xắc 1 lần, có bao nhiêu mặt có thể xuất hiện?', answer: '6', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-5', question: 'Số liệu nào lớn nhất trong dãy: 2, 5, 3, 1?', answer: '5', options: ['1', '2', '3', '5'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-6', question: 'Quan sát dãy số: 1, 1, 2, 3. Số nào xuất hiện nhiều nhất?', answer: '1', options: ['1', '2', '3', 'Không có'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-7', question: 'Tung đồng xu, việc ra “mặt sấp” là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-8', question: 'Trong lớp có 10 bạn, hỏi có bao nhiêu dữ liệu về tên các bạn?', answer: '10', options: ['5', '10', '15', '20'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-9', question: 'Số nào bé nhất trong dãy: 6, 8, 2, 9?', answer: '2', options: ['2', '6', '8', '9'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spq-10', question: 'Tung xúc xắc, việc ra số 3 là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_STATISTICS_PROBABILITY_ESSAY_QUESTIONS_G2: MathProblem[] = [
  { id: 'spe-1', question: 'Ghi lại dữ liệu số bạn trong tổ em.', answer: 'Dữ liệu số bạn', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-2', question: 'Quan sát dãy số: 2, 3, 3, 4, 5. Hỏi số nào xuất hiện nhiều nhất?', answer: '3', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-3', question: 'Tung 1 đồng xu, hãy kể các kết quả có thể xảy ra.', answer: 'Mặt sấp, mặt ngửa', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-4', question: 'Có 6 quả bóng: 4 đỏ, 2 xanh. Hỏi lấy 1 quả có thể lấy được màu gì?', answer: 'Màu đỏ hoặc màu xanh', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-5', question: 'Quan sát dãy số: 5, 6, 7, 8. Số nào lớn nhất?', answer: '8', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-6', question: 'Trong bảng: Gà (4 con), Vịt (6 con). Hỏi tổng số con vật là bao nhiêu?', answer: '10', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-7', question: 'Kể tên 2 loại dữ liệu em có thể thu thập trong lớp học.', answer: 'Số bàn, số ghế', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-8', question: 'Tung xúc xắc, có thể ra mặt 7 chấm không? Vì sao?', answer: 'Không thể, vì xúc xắc chỉ có 6 mặt', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-9', question: 'Quan sát: 10, 20, 10, 30. Số nào lặp lại?', answer: '10', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spe-10', question: 'Nếu trong hộp chỉ có bóng đỏ, việc lấy ra 1 quả bóng xanh là gì?', answer: 'Không thể', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_STATISTICS_PROBABILITY_APP_QUESTIONS_G2: MathProblem[] = [
  { id: 'spa-1', question: 'Tung đồng xu 2 lần, mỗi lần có mấy khả năng có thể xảy ra?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-2', question: 'Dữ liệu: 2, 2, 2, 3. Số nào xuất hiện nhiều nhất?', answer: '2', options: ['2', '3', '4', 'Không có'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-3', question: 'Có 4 con mèo, 6 con chó. Con vật nào có số lượng nhiều hơn?', answer: 'Chó', options: ['Mèo', 'Chó', 'Bằng nhau', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-4', question: 'Tung xúc xắc, việc ra số 1 là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-5', question: 'Dữ liệu: 10, 20, 30. Số bé nhất là:', answer: '10', options: ['10', '20', '30', '0'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-6', question: 'Trong hộp có 5 bi đỏ, lấy ra 1 bi xanh là việc:', answer: 'Không thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-7', question: 'Dữ liệu: Lan (8 điểm), Mai (9 điểm). Ai có điểm cao hơn?', answer: 'Mai', options: ['Lan', 'Mai', 'Bằng nhau', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-8', question: 'Tung xúc xắc, việc ra số 8 là:', answer: 'Không thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-9', question: 'Dữ liệu: 5, 5, 5, 5. Số nào xuất hiện nhiều nhất?', answer: '5', options: ['5', '0', '1', 'Không có'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'spa-10', question: 'Tung đồng xu, việc ra “mặt ngửa” là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_REVIEW_MULT_DIV_QUIZ_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3rmd-1', question: '3 × 4 = ?', answer: '12', options: ['10', '11', '12', '13'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-2', question: '12 : 3 = ?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-3', question: '5 × 6 = ?', answer: '30', options: ['25', '30', '35', '40'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-4', question: '20 : 5 = ?', answer: '4', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-5', question: '7 × 2 = ?', answer: '14', options: ['12', '13', '14', '15'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-6', question: '18 : 6 = ?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-7', question: '9 × 3 = ?', answer: '27', options: ['26', '27', '28', '29'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-8', question: '16 : 4 = ?', answer: '4', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-9', question: '8 × 5 = ?', answer: '40', options: ['35', '40', '45', '50'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmd-10', question: '21 : 7 = ?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
];

const FIXED_REVIEW_MULT_DIV_ESSAY_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3rmde-1', question: 'Tính: 7 × 6 = ?', answer: '42', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-2', question: 'Tính: 54 : 6 = ?', answer: '9', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-3', question: 'Có 5 hộp, mỗi hộp có 8 cái bánh. Hỏi có tất cả bao nhiêu cái bánh?', answer: '40', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-4', question: 'Có 36 viên kẹo chia đều cho 6 bạn. Mỗi bạn được mấy viên?', answer: '6', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-5', question: 'Tính: 3 × 7 + 5 = ?', answer: '26', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-6', question: 'Tính: 8 × 4 = ?', answer: '32', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-7', question: 'Tính: 45 : 9 = ?', answer: '5', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-8', question: 'Mỗi túi có 7 kg gạo. Hỏi 5 túi như thế có bao nhiêu ki-lô-gam gạo?', answer: '35', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-9', question: 'Có 42 bông hoa cắm đều vào 6 lọ. Hỏi mỗi lọ có bao nhiêu bông hoa?', answer: '7', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmde-10', question: 'Tính: 4 × 9 - 6 = ?', answer: '30', options: [], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
];

const FIXED_REVIEW_MULT_DIV_APP_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3rmda-1', question: '3 × 9 = ?', answer: '27', options: ['26', '27', '28', '29'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-2', question: '36 : 6 = ?', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-3', question: '5 × 8 = ?', answer: '40', options: ['35', '40', '45', '50'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-4', question: '63 : 7 = ?', answer: '9', options: ['8', '9', '7', '6'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-5', question: '2 × 9 = ?', answer: '18', options: ['16', '17', '18', '19'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-6', question: '4 × 7 = ?', answer: '28', options: ['24', '26', '28', '30'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-7', question: '48 : 8 = ?', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-8', question: '6 × 9 = ?', answer: '54', options: ['52', '54', '56', '58'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-9', question: '72 : 9 = ?', answer: '8', options: ['7', '8', '9', '10'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
  { id: 'g3rmda-10', question: '8 × 7 = ?', answer: '56', options: ['54', '56', '58', '60'], difficulty: 'easy', topic: 'Ôn tập & Bảng nhân chia' },
];

const FIXED_GEOMETRY_SOLIDS_QUIZ_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3gsq-1', question: 'Hình vuông có mấy cạnh?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-2', question: 'Hình chữ nhật có mấy góc vuông?', answer: '4', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-3', question: 'Hình tam giác có mấy cạnh?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-4', question: 'Hình tròn có mấy cạnh?', answer: 'Không có', options: ['1', 'Không có', '2', '3'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-5', question: 'Hình nào có 4 cạnh bằng nhau?', answer: 'Hình vuông', options: ['Hình chữ nhật', 'Hình tam giác', 'Hình vuông', 'Hình tròn'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-6', question: 'Khối nào có dạng hình hộp chữ nhật?', answer: 'Hộp sữa', options: ['Quả bóng', 'Hộp sữa', 'Đồng xu', 'Bánh xe'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-7', question: 'Hình nào lăn được?', answer: 'Hình tròn', options: ['Hình vuông', 'Hình tròn', 'Hình tam giác', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-8', question: 'Hình chữ nhật có mấy cặp cạnh dài bằng nhau?', answer: '2 cặp', options: ['1 cặp', '2 cặp', '3 cặp', '4 cặp'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-9', question: 'Hình tam giác có mấy góc?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsq-10', question: 'Khối nào có dạng hình cầu?', answer: 'Quả bóng', options: ['Quả bóng', 'Hộp quà', 'Cục gạch', 'Quyển sách'], difficulty: 'easy', topic: 'Hình học & Khối' },
];

const FIXED_GEOMETRY_SOLIDS_ESSAY_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3gse-1', question: 'Kể tên 3 hình học em đã học.', answer: 'Hình vuông, hình chữ nhật, hình tam giác', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-2', question: 'Vẽ một hình vuông và ghi số cạnh, số góc của nó.', answer: 'Hình vuông có 4 cạnh và 4 góc vuông', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-3', question: 'Kể tên 2 vật trong thực tế có dạng khối cầu.', answer: 'Quả bóng, viên bi', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-4', question: 'So sánh hình vuông và hình chữ nhật (giống và khác nhau).', answer: 'Giống: 4 góc vuông. Khác: Hình vuông 4 cạnh bằng nhau, hình chữ nhật có cặp cạnh đối bằng nhau', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-5', question: 'Một khối lập phương có 6 mặt. Hỏi mỗi mặt có dạng hình gì?', answer: 'Hình vuông', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-6', question: 'Hình nào có 4 góc vuông và 4 cạnh bằng nhau?', answer: 'Hình vuông', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-7', question: 'Khối trụ giống vật nào trong các vật sau: Lon nước, Quả bóng, Cục gạch?', answer: 'Lon nước', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-8', question: 'Hình nào có 3 góc?', answer: 'Hình tam giác', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-9', question: 'Khối cầu có dạng giống vật nào trong các vật sau: Hộp sữa, Quả bóng, Cục gạch?', answer: 'Quả bóng', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gse-10', question: 'Hình nào có 4 cạnh và 2 cạnh dài hơn 2 cạnh còn lại?', answer: 'Hình chữ nhật', options: [], difficulty: 'easy', topic: 'Hình học & Khối' },
];

const FIXED_GEOMETRY_SOLIDS_APP_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3gsa-1', question: 'Hình nào có 4 góc vuông và 4 cạnh bằng nhau?', answer: 'Hình vuông', options: ['Hình chữ nhật', 'Hình vuông', 'Hình tròn', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-2', question: 'Khối trụ giống vật nào?', answer: 'Lon nước', options: ['Lon nước', 'Quả bóng', 'Cục gạch', 'Quyển sách'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-3', question: 'Hình nào có 3 góc?', answer: 'Hình tam giác', options: ['Hình vuông', 'Hình tròn', 'Hình tam giác', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-4', question: 'Khối cầu có dạng giống vật nào?', answer: 'Quả bóng', options: ['Hộp sữa', 'Quả bóng', 'Cục gạch', 'Quyển sách'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-5', question: 'Hình nào có 4 cạnh và 2 cạnh dài hơn 2 cạnh còn lại?', answer: 'Hình chữ nhật', options: ['Hình vuông', 'Hình chữ nhật', 'Hình tròn', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-6', question: 'Khối lập phương có bao nhiêu mặt?', answer: '6 mặt', options: ['4 mặt', '5 mặt', '6 mặt', '8 mặt'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-7', question: 'Hình tròn có bao nhiêu cạnh?', answer: 'Không có', options: ['1 cạnh', '2 cạnh', '3 cạnh', 'Không có'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-8', question: 'Khối hộp chữ nhật có bao nhiêu đỉnh?', answer: '8 đỉnh', options: ['4 đỉnh', '6 đỉnh', '8 đỉnh', '12 đỉnh'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-9', question: 'Hình tam giác có bao nhiêu cạnh?', answer: '3 cạnh', options: ['2 cạnh', '3 cạnh', '4 cạnh', '5 cạnh'], difficulty: 'easy', topic: 'Hình học & Khối' },
  { id: 'g3gsa-10', question: 'Khối nào có thể lăn được về mọi phía?', answer: 'Khối cầu', options: ['Khối lập phương', 'Khối cầu', 'Khối trụ', 'Khối hộp chữ nhật'], difficulty: 'easy', topic: 'Hình học & Khối' },
];

const FIXED_MULT_DIV_100_1000_QUIZ_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3md100-1', question: '5 × 100 = ?', answer: '500', options: ['50', '500', '5000', '100'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-2', question: '8 × 100 = ?', answer: '800', options: ['80', '800', '8000', '100'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-3', question: '300 : 100 = ?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-4', question: '900 : 100 = ?', answer: '9', options: ['7', '8', '9', '10'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-5', question: '4 × 1000 = ?', answer: '4000', options: ['400', '4000', '40', '40000'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-6', question: '2000 : 1000 = ?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-7', question: '7 × 100 = ?', answer: '700', options: ['70', '700', '7000', '100'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-8', question: '600 : 100 = ?', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-9', question: '3 × 1000 = ?', answer: '3000', options: ['300', '3000', '30', '30000'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3md100-10', question: '1000 : 100 = ?', answer: '10', options: ['5', '10', '15', '20'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
];

const FIXED_MULT_DIV_100_1000_ESSAY_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3mde100-1', question: 'Tính: 24 × 100 = ?', answer: '2400', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-2', question: 'Tính: 3600 : 100 = ?', answer: '36', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-3', question: 'Một nhà máy sản xuất 5 ngày, mỗi ngày làm được 100 sản phẩm. Hỏi tổng cộng làm được bao nhiêu sản phẩm?', answer: '500', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-4', question: 'Có 8000 viên kẹo chia đều vào 1000 túi. Mỗi túi có bao nhiêu viên?', answer: '8', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-5', question: 'Tính: 12 × 100 + 300 = ?', answer: '1500', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-6', question: 'Tính: 45 × 100 = ?', answer: '4500', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-7', question: 'Tính: 7000 : 1000 = ?', answer: '7', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-8', question: 'Một cửa hàng có 10 bao gạo, mỗi bao nặng 100 kg. Hỏi cửa hàng có tất cả bao nhiêu ki-lô-gam gạo?', answer: '1000', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-9', question: 'Tính: 1000 : 100 × 5 = ?', answer: '50', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mde100-10', question: 'Tính: 100 × 8 - 200 = ?', answer: '600', options: [], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
];

const FIXED_MULT_DIV_100_1000_APP_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3mda100-1', question: '9 × 100 = ?', answer: '900', options: ['90', '900', '9000', '100'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-2', question: '700 : 100 = ?', answer: '7', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-3', question: '11 × 100 = ?', answer: '1100', options: ['110', '1100', '11000', '1000'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-4', question: '6000 : 1000 = ?', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-5', question: '20 × 100 = ?', answer: '2000', options: ['200', '2000', '20000', '1000'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-6', question: '15 × 100 = ?', answer: '1500', options: ['150', '1500', '15000', '100'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-7', question: '400 : 100 = ?', answer: '4', options: ['4', '40', '400', '4000'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-8', question: '5 × 1000 = ?', answer: '5000', options: ['500', '5000', '50', '50000'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-9', question: '9000 : 1000 = ?', answer: '9', options: ['9', '90', '900', '9000'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
  { id: 'g3mda100-10', question: '100 × 10 = ?', answer: '1000', options: ['100', '1000', '10000', '10'], difficulty: 'easy', topic: 'Nhân chia (100, 1000)' },
];

const FIXED_MEASUREMENT_QUIZ_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3mq-1', question: 'Đơn vị đo độ dài là:', answer: 'm', options: ['kg', 'm', 'lít', 'giờ'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-2', question: '1 m = ? cm', answer: '100', options: ['10', '100', '1000', '1'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-3', question: 'Đơn vị đo khối lượng là:', answer: 'kg', options: ['m', 'lít', 'kg', 'giờ'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-4', question: '1 kg = ? g', answer: '1000', options: ['10', '100', '1000', '1'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-5', question: 'Đơn vị đo thời gian là:', answer: 'giờ', options: ['m', 'kg', 'giờ', 'lít'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-6', question: '1 giờ = ? phút', answer: '60', options: ['30', '60', '100', '24'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-7', question: 'Đơn vị đo dung tích là:', answer: 'lít', options: ['kg', 'm', 'lít', 'giờ'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-8', question: '1 lít = ? ml', answer: '1000', options: ['10', '100', '1000', '1'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-9', question: '1 ngày = ? giờ', answer: '24', options: ['12', '24', '60', '100'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3mq-10', question: '1 tuần có bao nhiêu ngày?', answer: '7', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
];

const FIXED_MEASUREMENT_ESSAY_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3me-1', question: 'Đổi: 5 m = … cm', answer: '500', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-2', question: 'Đổi: 4000 g = … kg', answer: '4', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-3', question: 'Một chai có 2 lít nước, thêm 1 lít nữa. Hỏi có tất cả bao nhiêu lít?', answer: '3', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-4', question: 'Một ngày có 24 giờ. Hỏi 3 ngày có bao nhiêu giờ?', answer: '72', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-5', question: 'Tính: 2 giờ 30 phút = … phút', answer: '150', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-6', question: 'Đổi: 8 kg = ... g', answer: '8000', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-7', question: 'Đổi: 600 cm = ... m', answer: '6', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-8', question: 'Một túi gạo nặng 5 kg, 4 túi như thế nặng bao nhiêu ki-lô-gam?', answer: '20', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-9', question: 'Một tuần lễ có 7 ngày. Hỏi 4 tuần lễ có bao nhiêu ngày?', answer: '28', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3me-10', question: 'Tính: 1 giờ 15 phút = ... phút', answer: '75', options: [], difficulty: 'easy', topic: 'Đơn vị đo lường' },
];

const FIXED_MEASUREMENT_APP_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3ma-1', question: '4 m = ? cm', answer: '400', options: ['40', '400', '4000', '4'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-2', question: '6000 g = ? kg', answer: '6', options: ['6', '60', '600', '0,6'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-3', question: '5 giờ = ? phút', answer: '300', options: ['100', '200', '300', '400'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-4', question: '2 lít = ? ml', answer: '2000', options: ['200', '2000', '20', '2'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-5', question: '3 ngày = ? giờ', answer: '72', options: ['72', '60', '48', '36'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-6', question: '8 m = ? cm', answer: '800', options: ['80', '800', '8000', '8'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-7', question: '9000 g = ? kg', answer: '9', options: ['9', '90', '900', '0,9'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-8', question: '2 giờ = ? phút', answer: '120', options: ['60', '100', '120', '150'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-9', question: '5 lít = ? ml', answer: '5000', options: ['500', '5000', '50', '5'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
  { id: 'g3ma-10', question: '2 ngày = ? giờ', answer: '48', options: ['24', '48', '60', '72'], difficulty: 'easy', topic: 'Đơn vị đo lường' },
];

const FIXED_NUMBERS_TO_100000_QUIZ_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3n100k-1', question: 'Số nào lớn hơn 45 000?', answer: '46 000', options: ['40 000', '44 000', '46 000', '30 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-2', question: 'Số 56 789 có mấy chữ số?', answer: '5', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-3', question: 'Số 12 345 gồm:', answer: '1 chục nghìn, 2 nghìn, 3 trăm, 4 chục, 5 đơn vị', options: ['1 chục nghìn, 2 nghìn, 3 trăm, 4 chục, 5 đơn vị', '12 nghìn, 345', '1 nghìn, 2 trăm, 3 chục, 4 đơn vị', 'Sai'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-4', question: 'Số liền sau của 99 999 là:', answer: '100 000', options: ['99 998', '100 000', '99 000', '100 001'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-5', question: 'Số liền trước của 10 000 là:', answer: '9 999', options: ['9 999', '10 001', '9 000', '8 999'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-6', question: 'Số nào bé nhất?', answer: '20 000', options: ['23 000', '32 000', '20 000', '25 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-7', question: '50 000 + 10 000 = ?', answer: '60 000', options: ['60 000', '70 000', '40 000', '55 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-8', question: '80 000 − 30 000 = ?', answer: '50 000', options: ['40 000', '50 000', '60 000', '70 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-9', question: 'Số 70 000 gồm:', answer: '7 chục nghìn', options: ['7 nghìn', '7 chục nghìn', '70 nghìn', '7 trăm'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100k-10', question: 'Số nào lớn nhất?', answer: '100 000', options: ['90 000', '80 000', '100 000', '70 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
];

const FIXED_NUMBERS_TO_100000_ESSAY_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3n100ke-1', question: 'Viết số gồm: 7 chục nghìn, 5 nghìn, 3 trăm, 2 chục, 1 đơn vị.', answer: '75321', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-2', question: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 45 678; 54 678; 40 000; 46 000', answer: '40 000; 45 678; 46 000; 54 678', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-3', question: 'Tính: 30 000 + 40 000 + 20 000 = ?', answer: '90000', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-4', question: 'Tìm số liền trước của 80 000.', answer: '79999', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-5', question: 'Tìm số liền sau của 80 000.', answer: '80001', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-6', question: 'Một cửa hàng có 95 000 đồng, mua đồ hết 30 000 đồng. Hỏi còn lại bao nhiêu tiền?', answer: '65000', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-7', question: 'Viết số gồm: 9 chục nghìn và 9 đơn vị.', answer: '90009', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-8', question: 'Tính: 100 000 - 50 000 = ?', answer: '50000', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-9', question: 'Số lớn nhất có 5 chữ số là số nào?', answer: '99999', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ke-10', question: 'Số bé nhất có 6 chữ số là số nào?', answer: '100000', options: [], difficulty: 'easy', topic: 'Số đến 100 000' },
];

const FIXED_NUMBERS_TO_100000_APP_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3n100ka-1', question: '10 000 + 90 000 = ?', answer: '100 000', options: ['100 000', '90 000', '80 000', '110 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-2', question: 'Số nào đứng giữa 49 999 và 50 001?', answer: '50 000', options: ['49 998', '50 000', '50 002', '49 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-3', question: '60 000 − 20 000 = ?', answer: '40 000', options: ['30 000', '40 000', '50 000', '60 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-4', question: 'Số 100 000 có mấy chữ số?', answer: '6', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-5', question: 'Số nào lớn hơn 99 999?', answer: '100 000', options: ['100 000', '99 998', '90 000', '98 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-6', question: '70 000 + 30 000 = ?', answer: '100 000', options: ['100 000', '90 000', '80 000', '110 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-7', question: 'Số liền sau của 89 999 là:', answer: '90 000', options: ['89 998', '90 000', '90 001', '80 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-8', question: '100 000 - 1 = ?', answer: '99 999', options: ['99 998', '100 000', '99 999', '99 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-9', question: 'Số gồm 10 chục nghìn là:', answer: '100 000', options: ['10 000', '100 000', '1 000 000', '1 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
  { id: 'g3n100ka-10', question: 'Số nào nhỏ nhất trong các số sau: 100 000, 99 999, 10 000, 50 000?', answer: '10 000', options: ['100 000', '99 999', '10 000', '50 000'], difficulty: 'easy', topic: 'Số đến 100 000' },
];

const FIXED_PERIMETER_AREA_QUIZ_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3pa-1', question: 'Chu vi là gì?', answer: 'Tổng độ dài các cạnh', options: ['Diện tích', 'Tổng độ dài các cạnh', 'Chiều dài', 'Chiều rộng'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-2', question: 'Chu vi hình vuông cạnh 4 cm là:', answer: '16 cm', options: ['8 cm', '12 cm', '16 cm', '20 cm'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-3', question: 'Chu vi hình chữ nhật dài 5 cm, rộng 3 cm là:', answer: '16 cm', options: ['16 cm', '15 cm', '8 cm', '18 cm'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-4', question: 'Diện tích là gì?', answer: 'Số đo phần mặt', options: ['Độ dài', 'Số đo phần mặt', 'Số cạnh', 'Chu vi'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-5', question: 'Đơn vị đo diện tích là:', answer: 'cm²', options: ['cm', 'cm²', 'm', 'kg'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-6', question: 'Diện tích hình vuông cạnh 3 cm là:', answer: '9 cm²', options: ['6 cm²', '9 cm²', '12 cm²', '3 cm²'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-7', question: 'Diện tích hình chữ nhật dài 4 cm, rộng 2 cm là:', answer: '8 cm²', options: ['6 cm²', '8 cm²', '10 cm²', '12 cm²'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-8', question: 'Chu vi hình vuông cạnh 6 cm là:', answer: '24 cm', options: ['12 cm', '24 cm', '18 cm', '36 cm'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-9', question: 'Chu vi hình chữ nhật được tính bằng:', answer: '(dài + rộng) × 2', options: ['dài × rộng', '(dài + rộng) × 2', 'dài + rộng', 'dài − rộng'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pa-10', question: 'Diện tích hình chữ nhật được tính bằng:', answer: 'dài × rộng', options: ['(dài + rộng) × 2', 'dài × rộng', 'dài − rộng', 'rộng × 2'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
];

const FIXED_PERIMETER_AREA_ESSAY_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3pae-1', question: 'Tính chu vi hình vuông cạnh 6 cm.', answer: '24', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-2', question: 'Tính diện tích hình chữ nhật dài 8 cm, rộng 3 cm.', answer: '24', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-3', question: 'Một hình vuông có cạnh 9 cm. Tính chu vi của nó.', answer: '36', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-4', question: 'Một hình vuông có cạnh 9 cm. Tính diện tích của nó.', answer: '81', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-5', question: 'Một hình chữ nhật có chiều dài 10 cm, chiều rộng 4 cm. Tính chu vi.', answer: '28', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-6', question: 'Một mảnh vườn hình chữ nhật dài 12 m, rộng 5 m. Tính diện tích mảnh vườn.', answer: '60', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-7', question: 'Tính chu vi hình vuông cạnh 5 cm.', answer: '20', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-8', question: 'Tính diện tích hình vuông cạnh 7 cm.', answer: '49', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-9', question: 'Một hình chữ nhật có chiều dài 7 cm, chiều rộng 3 cm. Tính diện tích.', answer: '21', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3pae-10', question: 'Một hình vuông có chu vi 12 cm. Tính cạnh của hình vuông đó.', answer: '3', options: [], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
];

const FIXED_PERIMETER_AREA_APP_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3paa-1', question: 'Chu vi hình vuông cạnh 10 cm là:', answer: '40 cm', options: ['20 cm', '30 cm', '40 cm', '50 cm'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-2', question: 'Diện tích hình vuông cạnh 6 cm là:', answer: '36 cm²', options: ['30 cm²', '36 cm²', '42 cm²', '12 cm²'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-3', question: 'Chu vi hình chữ nhật dài 6 cm, rộng 2 cm là:', answer: '16 cm', options: ['14 cm', '16 cm', '12 cm', '18 cm'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-4', question: 'Diện tích hình chữ nhật dài 5 cm, rộng 5 cm là:', answer: '25 cm²', options: ['10 cm²', '20 cm²', '25 cm²', '15 cm²'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-5', question: 'Hình vuông cạnh 8 cm có diện tích là:', answer: '64 cm²', options: ['16 cm²', '32 cm²', '64 cm²', '48 cm²'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-6', question: 'Chu vi hình vuông cạnh 5 cm là:', answer: '20 cm', options: ['10 cm', '15 cm', '20 cm', '25 cm'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-7', question: 'Diện tích hình chữ nhật dài 7 cm, rộng 4 cm là:', answer: '28 cm²', options: ['11 cm²', '22 cm²', '28 cm²', '35 cm²'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-8', question: 'Chu vi hình chữ nhật dài 8 cm, rộng 5 cm là:', answer: '26 cm', options: ['13 cm', '26 cm', '40 cm', '30 cm'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-9', question: 'Hình vuông cạnh 7 cm có chu vi là:', answer: '28 cm', options: ['14 cm', '21 cm', '28 cm', '49 cm'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
  { id: 'g3paa-10', question: 'Diện tích hình vuông cạnh 9 cm là:', answer: '81 cm²', options: ['18 cm²', '36 cm²', '72 cm²', '81 cm²'], difficulty: 'easy', topic: 'Chu vi & Diện tích' },
];

const FIXED_TIME_MONEY_QUIZ_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3tm-1', question: '1 giờ = ? phút', answer: '60', options: ['30', '60', '100', '24'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-2', question: '1 ngày = ? giờ', answer: '24', options: ['12', '24', '60', '100'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-3', question: '1 tuần có bao nhiêu ngày?', answer: '7', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-4', question: '1000 đồng = ?', answer: '1 nghìn đồng', options: ['1 nghìn đồng', '10 nghìn', '100 nghìn', '100 đồng'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-5', question: '1 giờ 30 phút = ? phút', answer: '90', options: ['60', '90', '120', '30'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-6', question: 'Đồng hồ chỉ 3 giờ thì kim phút chỉ số mấy?', answer: '12', options: ['3', '6', '12', '9'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-7', question: '5000 đồng + 2000 đồng = ?', answer: '7000', options: ['6000', '7000', '8000', '9000'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-8', question: '1 tháng thường có:', answer: '30 hoặc 31 ngày', options: ['10 ngày', '20 ngày', '30 hoặc 31 ngày', '40 ngày'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-9', question: '1 năm có bao nhiêu tháng?', answer: '12', options: ['10', '11', '12', '13'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tm-10', question: '1 giờ = ? giây (nâng cao)', answer: '3600', options: ['60', '600', '3600', '1000'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
];

const FIXED_TIME_MONEY_ESSAY_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3tme-1', question: 'Đổi: 2 giờ 45 phút = … phút', answer: '165', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-2', question: 'Đổi: 3 ngày = … giờ', answer: '72', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-3', question: 'Một bạn có 10 000 đồng, mua đồ hết 6000 đồng. Hỏi còn lại bao nhiêu tiền?', answer: '4000', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-4', question: 'Một ngày có 24 giờ. Hỏi 5 ngày có bao nhiêu giờ?', answer: '120', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-5', question: 'Lan đi học lúc 7 giờ, về lúc 11 giờ. Hỏi Lan học trong bao nhiêu giờ?', answer: '4', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-6', question: 'Đổi: 1 giờ 15 phút = ... phút', answer: '75', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-7', question: 'Một tuần lễ có 7 ngày. Hỏi 4 tuần lễ có bao nhiêu ngày?', answer: '28', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-8', question: 'Mẹ cho em 20 000 đồng, em mua kẹo hết 5 000 đồng. Hỏi em còn bao nhiêu tiền?', answer: '15000', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-9', question: 'Đồng hồ chỉ 8 giờ 15 phút. 30 phút sau là mấy giờ mấy phút?', answer: '8 giờ 45 phút', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tme-10', question: 'Một năm có bao nhiêu tháng?', answer: '12', options: [], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
];

const FIXED_TIME_MONEY_APP_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3tma-1', question: '2 giờ 30 phút = ? phút', answer: '150', options: ['120', '150', '180', '140'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-2', question: '3 ngày = ? giờ', answer: '72', options: ['48', '60', '72', '80'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-3', question: '90 phút = ? giờ', answer: '1 giờ 30 phút', options: ['1 giờ', '1 giờ 30 phút', '2 giờ', '3 giờ'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-4', question: '10 000 đồng − 4000 đồng = ?', answer: '6000', options: ['5000', '6000', '7000', '8000'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-5', question: '1 giờ 15 phút = ? phút', answer: '75', options: ['65', '75', '85', '95'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-6', question: '5 giờ = ? phút', answer: '300', options: ['200', '250', '300', '350'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-7', question: '2000 đồng × 3 = ?', answer: '6000', options: ['4000', '5000', '6000', '7000'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-8', question: '1 ngày 12 giờ = ? giờ', answer: '36', options: ['24', '30', '36', '40'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-9', question: '5000 đồng + 5000 đồng = ?', answer: '10 000', options: ['9000', '10 000', '11 000', '12 000'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
  { id: 'g3tma-10', question: '2 tuần = ? ngày', answer: '14', options: ['12', '13', '14', '15'], difficulty: 'easy', topic: 'Thời gian & Tiền tệ' },
];

const FIXED_STATISTICS_PROBABILITY_QUIZ_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3spq-1', question: 'Số nào là số lớn nhất?', answer: '21', options: ['12', '21', '18', '15'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-2', question: 'Dữ liệu là gì?', answer: 'Con số thu thập được', options: ['Con số thu thập được', 'Một bài văn', 'Một bức tranh', 'Một bài hát'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-3', question: 'Trong bảng số liệu, số nào xuất hiện nhiều nhất gọi là gì?', answer: 'Nhiều nhất', options: ['Trung bình', 'Lớn nhất', 'Nhiều nhất', 'Nhỏ nhất'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-4', question: 'Tung 1 đồng xu, có mấy khả năng xảy ra?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-5', question: 'Kết quả khi tung đồng xu có thể là:', answer: 'Sấp hoặc ngửa', options: ['Tròn hoặc vuông', 'Sấp hoặc ngửa', 'Lớn hoặc nhỏ', 'Nặng hoặc nhẹ'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-6', question: 'Trong các số sau: 5, 8, 5, 3, 5 — số nào xuất hiện nhiều nhất?', answer: '5', options: ['3', '5', '8', 'Không có'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-7', question: 'Tung xúc xắc có mấy mặt?', answer: '6', options: ['4', '5', '6', '8'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-8', question: 'Số nhỏ nhất trong dãy: 7, 2, 9, 4 là:', answer: '2', options: ['2', '4', '7', '9'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-9', question: 'Một phép thử là gì?', answer: 'Là việc thử và quan sát kết quả', options: ['Là việc thử và quan sát kết quả', 'Là làm bài tập', 'Là chơi game', 'Là đọc sách'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spq-10', question: 'Khi tung xúc xắc, số chấm nhỏ nhất là:', answer: '1', options: ['0', '1', '2', '6'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_STATISTICS_PROBABILITY_ESSAY_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3spe-1', question: 'Dãy số: 3, 5, 3, 7, 3, 5. Số nào xuất hiện nhiều nhất?', answer: '3', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-2', question: 'Tung một đồng xu, liệt kê các kết quả có thể xảy ra.', answer: 'Sấp, ngửa', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-3', question: 'Dãy số: 2, 4, 4, 5, 6. Số lớn nhất là bao nhiêu?', answer: '6', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-4', question: 'Dãy số: 2, 4, 4, 5, 6. Số nhỏ nhất là bao nhiêu?', answer: '2', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-5', question: 'Dãy số: 2, 4, 4, 5, 6. Số nào xuất hiện nhiều nhất?', answer: '4', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-6', question: 'Tung một con xúc xắc, viết tất cả các số chấm có thể xuất hiện.', answer: '1, 2, 3, 4, 5, 6', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-7', question: 'Vì sao khi tung đồng xu, ta không biết chắc chắn sẽ ra sấp hay ngửa?', answer: 'Vì kết quả ngẫu nhiên', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-8', question: 'Trong một bảng số liệu, nếu cam có 5 quả, táo có 8 quả. Hỏi loại nào nhiều hơn?', answer: 'Táo', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-9', question: 'Hãy kể tên 2 mặt của đồng xu.', answer: 'Sấp, ngửa', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spe-10', question: 'Dãy số: 10, 15, 10, 20. Số nào lặp lại nhiều nhất?', answer: '10', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_STATISTICS_PROBABILITY_APP_QUESTIONS_G3: MathProblem[] = [
  { id: 'g3spa-1', question: 'Tung xúc xắc 1 lần, có mấy kết quả có thể xảy ra?', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-2', question: 'Dữ liệu thu thập được giúp ta làm gì?', answer: 'Quan sát và so sánh', options: ['Quan sát và so sánh', 'Vẽ tranh', 'Chơi game', 'Ngủ'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-3', question: 'Khi tung đồng xu, việc ra mặt ngửa là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Sai'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-4', question: 'Cho dãy số: 8, 9, 8, 7, 8. Số nào xuất hiện nhiều nhất?', answer: '8', options: ['7', '8', '9', 'Không có'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-5', question: 'Khi tung xúc xắc, việc xuất hiện mặt 6 chấm là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không xảy ra'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-6', question: 'Trong dãy số: 10, 20, 10, 30. Số ít nhất là:', answer: '20', options: ['10', '20', '30', 'Không có'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-7', question: 'Tung đồng xu 1 lần, có mấy khả năng xảy ra?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-8', question: 'Số nào lớn nhất trong các số: 15, 21, 18, 15?', answer: '21', options: ['12', '21', '18', '15'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-9', question: 'Tung xúc xắc, việc xuất hiện mặt 7 chấm là:', answer: 'Không thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g3spa-10', question: 'Dữ liệu: Cam (5 quả), Táo (8 quả). Loại nào ít hơn?', answer: 'Cam', options: ['Cam', 'Táo', 'Bằng nhau', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_NUMBERS_TO_100000_QUIZ_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4n100-1', question: 'Số nào lớn hơn 45 678?', answer: '46 000', options: ['45 000', '46 000', '44 999', '40 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-2', question: 'Số 23 456 có mấy chữ số?', answer: '5', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-3', question: 'Số liền sau của 99 999 là:', answer: '100 000', options: ['99 998', '100 000', '100 001', '90 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-4', question: 'Số liền trước của 10 000 là:', answer: '9 999', options: ['9 999', '10 001', '9 000', '8 999'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-5', question: 'Số nào bé nhất?', answer: '10 000', options: ['12 345', '21 345', '10 000', '13 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-6', question: '20 000 + 30 000 = ?', answer: '50 000', options: ['40 000', '50 000', '60 000', '70 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-7', question: '70 000 − 20 000 = ?', answer: '50 000', options: ['40 000', '50 000', '60 000', '30 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-8', question: 'Số 50 000 gồm:', answer: '5 chục nghìn', options: ['5 nghìn', '5 chục nghìn', '50 nghìn', '5 trăm'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-9', question: 'Số nào lớn nhất?', answer: '100 000', options: ['90 000', '80 000', '100 000', '70 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100-10', question: 'Số 12 000 có mấy nghìn?', answer: '12', options: ['12', '10', '2', '1'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
];

const FIXED_NUMBERS_TO_100000_ESSAY_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4n100e-1', question: 'Viết số gồm: 6 chục nghìn, 5 nghìn, 4 trăm, 3 chục, 2 đơn vị.', answer: '65432', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-2', question: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 45 678; 54 678; 40 000; 46 000', answer: '40 000; 45 678; 46 000; 54 678', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-3', question: 'Tính: 20 000 + 30 000 + 40 000', answer: '90000', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-4', question: 'Tìm số liền trước của 70 000.', answer: '69999', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-5', question: 'Tìm số liền sau của 70 000.', answer: '70001', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-6', question: 'Một cửa hàng có 85 000 đồng, mua đồ hết 25 000 đồng. Hỏi còn lại bao nhiêu tiền?', answer: '60000', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-7', question: 'Viết số: Tám mươi nghìn không trăm linh năm.', answer: '80005', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-8', question: 'Số lớn nhất có 5 chữ số là số nào?', answer: '99999', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-9', question: 'Số bé nhất có 5 chữ số khác nhau là số nào?', answer: '10234', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100e-10', question: 'Tính: 100 000 - 40 000', answer: '60000', options: [], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
];

const FIXED_NUMBERS_TO_100000_APP_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4n100a-1', question: '10 000 + 90 000 = ?', answer: '100 000', options: ['100 000', '90 000', '80 000', '110 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-2', question: 'Số nào đứng giữa 39 999 và 40 001?', answer: '40 000', options: ['39 998', '40 000', '40 002', '39 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-3', question: '60 000 − 10 000 = ?', answer: '50 000', options: ['40 000', '50 000', '60 000', '70 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-4', question: 'Số 100 000 có mấy chữ số?', answer: '6', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-5', question: 'Số nào lớn hơn 99 999?', answer: '100 000', options: ['100 000', '99 998', '98 000', '90 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-6', question: '40 000 + 40 000 = ?', answer: '80 000', options: ['70 000', '80 000', '90 000', '100 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-7', question: '100 000 - 50 000 = ?', answer: '50 000', options: ['40 000', '50 000', '60 000', '70 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-8', question: 'Số gồm 9 chục nghìn và 9 nghìn là:', answer: '99 000', options: ['90 000', '99 000', '90 900', '99 900'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-9', question: 'Số bé nhất có 6 chữ số là:', answer: '100 000', options: ['100 000', '111 111', '999 999', '100 001'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
  { id: 'g4n100a-10', question: '25 000 + 25 000 = ?', answer: '50 000', options: ['40 000', '50 000', '60 000', '70 000'], difficulty: 'easy', topic: 'Ôn tập & Số đến 100 000' },
];

const FIXED_GEOMETRY_ANGLES_QUIZ_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4ga-1', question: 'Góc vuông có số đo là:', answer: '90°', options: ['45°', '90°', '60°', '120°'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-2', question: 'Góc nhỏ hơn 90° gọi là:', answer: 'Góc nhọn', options: ['Góc tù', 'Góc vuông', 'Góc nhọn', 'Góc bẹt'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-3', question: 'Góc lớn hơn 90° gọi là:', answer: 'Góc tù', options: ['Góc nhọn', 'Góc tù', 'Góc vuông', 'Góc thẳng'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-4', question: 'Hình nào có 4 góc vuông?', answer: 'Hình chữ nhật', options: ['Hình tam giác', 'Hình chữ nhật', 'Hình tròn', 'Hình thang'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-5', question: 'Hình vuông có mấy cạnh?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-6', question: 'Hình tam giác có mấy góc?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-7', question: 'Góc bẹt có số đo là:', answer: '180°', options: ['90°', '180°', '360°', '45°'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-8', question: 'Hình nào không có góc?', answer: 'Hình tròn', options: ['Hình vuông', 'Hình tròn', 'Hình chữ nhật', 'Hình tam giác'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-9', question: 'Hình chữ nhật có bao nhiêu cạnh?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4ga-10', question: 'Hình nào có 3 cạnh bằng nhau?', answer: 'Hình tam giác đều', options: ['Hình vuông', 'Hình tam giác đều', 'Hình chữ nhật', 'Hình tròn'], difficulty: 'easy', topic: 'Góc & Hình học' },
];

const FIXED_GEOMETRY_ANGLES_ESSAY_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4gae-1', question: 'Kể tên các loại góc đã học và nêu số đo của mỗi loại.', answer: 'Góc nhọn (<90°), Góc vuông (=90°), Góc tù (>90°), Góc bẹt (=180°)', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-2', question: 'Vẽ một góc vuông và ghi số đo của nó.', answer: '90°', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-3', question: 'Một tam giác có tổng 3 góc là bao nhiêu độ?', answer: '180°', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-4', question: 'So sánh hình vuông và hình chữ nhật (giống và khác nhau).', answer: 'Giống: 4 góc vuông; Khác: Hình vuông có 4 cạnh bằng nhau', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-5', question: 'Hãy kể tên 3 hình học mà em biết và nêu đặc điểm của chúng.', answer: 'Hình vuông (4 cạnh bằng nhau), Hình chữ nhật (2 cặp cạnh bằng nhau), Hình tam giác (3 cạnh)', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-6', question: 'Góc nhọn là góc như thế nào?', answer: 'Góc nhỏ hơn 90°', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-7', question: 'Góc tù là góc như thế nào?', answer: 'Góc lớn hơn 90° và nhỏ hơn 180°', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-8', question: 'Hình chữ nhật có mấy góc vuông?', answer: '4 góc vuông', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-9', question: 'Một hình vuông có cạnh 5cm. Tính chu vi của nó.', answer: '20cm', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gae-10', question: 'Góc bẹt bằng mấy lần góc vuông?', answer: '2 lần', options: [], difficulty: 'easy', topic: 'Góc & Hình học' },
];

const FIXED_GEOMETRY_ANGLES_APP_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4gaa-1', question: 'Góc nào là góc vuông?', answer: '90°', options: ['45°', '90°', '120°', '60°'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-2', question: 'Hình nào có 4 cạnh bằng nhau?', answer: 'Hình vuông', options: ['Hình chữ nhật', 'Hình vuông', 'Hình tam giác', 'Hình tròn'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-3', question: 'Góc 150° là:', answer: 'Góc tù', options: ['Góc nhọn', 'Góc tù', 'Góc vuông', 'Góc bẹt'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-4', question: 'Hình nào có 3 góc?', answer: 'Hình tam giác', options: ['Hình vuông', 'Hình tam giác', 'Hình tròn', 'Hình chữ nhật'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-5', question: 'Góc 30° là:', answer: 'Góc nhọn', options: ['Góc nhọn', 'Góc tù', 'Góc vuông', 'Góc bẹt'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-6', question: 'Hình có 2 cặp cạnh đối diện song song và bằng nhau là:', answer: 'Hình chữ nhật', options: ['Hình tam giác', 'Hình chữ nhật', 'Hình tròn', 'Hình thang'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-7', question: 'Góc bẹt có số đo bằng bao nhiêu độ?', answer: '180°', options: ['90°', '180°', '270°', '360°'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-8', question: 'Hình vuông có chu vi là 16cm. Độ dài cạnh là:', answer: '4cm', options: ['3cm', '4cm', '5cm', '6cm'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-9', question: 'Góc vuông thường được ký hiệu bằng hình gì ở đỉnh?', answer: 'Hình vuông nhỏ', options: ['Hình tròn nhỏ', 'Hình vuông nhỏ', 'Hình tam giác nhỏ', 'Không ký hiệu'], difficulty: 'easy', topic: 'Góc & Hình học' },
  { id: 'g4gaa-10', question: 'Trong các góc sau, góc nào lớn nhất?', answer: 'Góc bẹt', options: ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'], difficulty: 'easy', topic: 'Góc & Hình học' },
];

const FIXED_MANY_DIGIT_NUMBERS_QUIZ_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4mdn-1', question: 'Số 123 456 có mấy chữ số?', answer: '6', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-2', question: 'Số liền sau của 99 999 là:', answer: '100 000', options: ['99 998', '100 000', '100 001', '90 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-3', question: 'Số liền trước của 10 000 là:', answer: '9 999', options: ['9 999', '10 001', '9 000', '8 999'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-4', question: 'Số nào lớn hơn 56 789?', answer: '56 800', options: ['56 000', '56 780', '56 800', '56 700'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-5', question: 'Số 45 000 gồm:', answer: '45 nghìn', options: ['45 nghìn', '4 nghìn', '5 nghìn', '450 nghìn'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-6', question: '20 000 + 30 000 = ?', answer: '50 000', options: ['40 000', '50 000', '60 000', '70 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-7', question: '80 000 − 10 000 = ?', answer: '70 000', options: ['60 000', '70 000', '75 000', '65 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-8', question: 'Số nào bé nhất?', answer: '10 000', options: ['12 345', '21 345', '10 000', '13 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-9', question: 'Số 100 000 có mấy chữ số?', answer: '6', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdn-10', question: 'Số nào lớn nhất?', answer: '100 000', options: ['90 000', '80 000', '100 000', '70 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
];

const FIXED_MANY_DIGIT_NUMBERS_ESSAY_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4mdne-1', question: 'Viết số gồm: 2 trăm nghìn, 5 chục nghìn, 3 nghìn, 4 trăm, 2 chục, 1 đơn vị.', answer: '253421', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-2', question: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 345 678; 354 678; 300 000; 346 000', answer: '300 000; 345 678; 346 000; 354 678', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-3', question: 'Tính: 40 000 + 30 000 + 20 000', answer: '90000', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-4', question: 'Tìm số liền trước của 200 000.', answer: '199999', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-5', question: 'Tìm số liền sau của 200 000.', answer: '200001', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-6', question: 'Một cửa hàng có 150 000 đồng, mua đồ hết 45 000 đồng. Hỏi còn lại bao nhiêu tiền?', answer: '105000', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-7', question: 'Viết số: Bốn trăm năm mươi nghìn sáu trăm linh tám.', answer: '450608', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-8', question: 'Số lớn nhất có 6 chữ số là số nào?', answer: '999999', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-9', question: 'Số bé nhất có 6 chữ số khác nhau là số nào?', answer: '102345', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdne-10', question: 'Làm tròn số 456 789 đến hàng trăm nghìn.', answer: '500000', options: [], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
];

const FIXED_MANY_DIGIT_NUMBERS_APP_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4mdna-1', question: '100 000 + 200 000 = ?', answer: '300 000', options: ['300 000', '200 000', '100 000', '400 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-2', question: 'Số nào đứng giữa 199 999 và 200 001?', answer: '200 000', options: ['199 998', '200 000', '200 002', '199 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-3', question: '60 000 − 20 000 = ?', answer: '40 000', options: ['30 000', '40 000', '50 000', '60 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-4', question: 'Số 1 000 000 có mấy chữ số?', answer: '7', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-5', question: 'Số nào lớn hơn 999 999?', answer: '1 000 000', options: ['1 000 000', '999 998', '900 000', '80 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-6', question: '500 000 + 500 000 = ?', answer: '1 000 000', options: ['900 000', '1 000 000', '1 100 000', '800 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-7', question: 'Số gồm 5 trăm nghìn và 5 nghìn là:', answer: '505 000', options: ['550 000', '505 000', '500 500', '505 500'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-8', question: 'Làm tròn số 123 456 đến hàng chục nghìn.', answer: '120 000', options: ['120 000', '130 000', '100 000', '123 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-9', question: 'Số bé nhất có 7 chữ số là:', answer: '1 000 000', options: ['1 000 000', '100 000', '999 999', '1 000 001'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
  { id: 'g4mdna-10', question: '450 000 + 50 000 = ?', answer: '500 000', options: ['400 000', '500 000', '600 000', '550 000'], difficulty: 'easy', topic: 'Số có nhiều chữ số' },
];

const FIXED_MEASUREMENT_UNITS_QUIZ_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4mu-1', question: 'Đơn vị đo độ dài là:', answer: 'm', options: ['kg', 'm', 'lít', 'giờ'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-2', question: '1 m = ? cm', answer: '100', options: ['10', '100', '1000', '1'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-3', question: 'Đơn vị đo khối lượng là:', answer: 'kg', options: ['m', 'kg', 'lít', 'giờ'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-4', question: '1 kg = ? g', answer: '1000', options: ['10', '100', '1000', '1'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-5', question: 'Đơn vị đo thời gian là:', answer: 'giờ', options: ['m', 'kg', 'giờ', 'lít'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-6', question: '1 giờ = ? phút', answer: '60', options: ['30', '60', '100', '24'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-7', question: 'Đơn vị đo diện tích là:', answer: 'cm²', options: ['cm', 'cm²', 'm', 'kg'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-8', question: '1 km = ? m', answer: '1000', options: ['100', '1000', '10', '1'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-9', question: '1 ngày = ? giờ', answer: '24', options: ['12', '24', '60', '100'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mu-10', question: '1 tuần có bao nhiêu ngày?', answer: '7', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
];

const FIXED_MEASUREMENT_UNITS_ESSAY_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4mue-1', question: 'Đổi: 5 km = … m', answer: '5000', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-2', question: 'Đổi: 4000 g = … kg', answer: '4', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-3', question: 'Một can có 2 lít nước, thêm 3 lít nữa. Hỏi có tất cả bao nhiêu lít?', answer: '5', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-4', question: 'Một ngày có 24 giờ. Hỏi 4 ngày có bao nhiêu giờ?', answer: '96', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-5', question: 'Tính: 2 giờ 30 phút = … phút', answer: '150', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-6', question: 'Đổi: 3 m² = ... dm²', answer: '300', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-7', question: 'Đổi: 2 tấn = ... kg', answer: '2000', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-8', question: 'Một thế kỷ bằng bao nhiêu năm?', answer: '100', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-9', question: 'Tính: 5 tạ + 3 tạ = ... tạ', answer: '8', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mue-10', question: 'Đổi: 1 giờ 15 phút = ... phút', answer: '75', options: [], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
];

const FIXED_MEASUREMENT_UNITS_APP_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4mua-1', question: '4 km = ? m', answer: '4000', options: ['400', '4000', '40', '4'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-2', question: '6000 g = ? kg', answer: '6', options: ['6', '60', '600', '0,6'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-3', question: '5 giờ = ? phút', answer: '300', options: ['200', '250', '300', '350'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-4', question: '2 lít = ? ml', answer: '2000', options: ['200', '2000', '20', '2'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-5', question: '3 ngày = ? giờ', answer: '72', options: ['72', '60', '48', '36'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-6', question: 'Đổi: 500 cm = ? m', answer: '5', options: ['5', '50', '500', '0,5'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-7', question: 'Đổi: 2 kg 500 g = ? g', answer: '2500', options: ['2050', '2500', '2005', '250'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-8', question: 'Đổi: 120 giây = ? phút', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-9', question: 'Đổi: 4 dm² = ? cm²', answer: '400', options: ['40', '400', '4000', '4'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
  { id: 'g4mua-10', question: 'Đổi: 3 tấn = ? kg', answer: '3000', options: ['300', '3000', '30', '3'], difficulty: 'easy', topic: 'Đơn vị đo đại lượng' },
];

const FIXED_ARITHMETIC_QUIZ_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4a-1', question: '25 + 15 = ?', answer: '40', options: ['30', '35', '40', '45'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-2', question: '50 − 20 = ?', answer: '30', options: ['20', '25', '30', '35'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-3', question: '6 × 7 = ?', answer: '42', options: ['36', '42', '48', '56'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-4', question: '56 : 8 = ?', answer: '7', options: ['6', '7', '8', '9'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-5', question: '100 + 200 = ?', answer: '300', options: ['200', '300', '400', '500'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-6', question: '300 − 100 = ?', answer: '200', options: ['100', '200', '300', '400'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-7', question: '9 × 5 = ?', answer: '45', options: ['40', '45', '50', '55'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-8', question: '81 : 9 = ?', answer: '9', options: ['7', '8', '9', '10'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-9', question: '400 + 500 = ?', answer: '900', options: ['800', '900', '1000', '1100'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4a-10', question: '600 − 200 = ?', answer: '400', options: ['300', '400', '500', '600'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
];

const FIXED_ARITHMETIC_ESSAY_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4ae-1', question: 'Tính: 234 + 567 = ?', answer: '801', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-2', question: 'Tính: 900 − 345 = ?', answer: '555', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-3', question: 'Một cửa hàng có 125 cái bánh, bán thêm 275 cái nữa. Hỏi có tất cả bao nhiêu cái bánh?', answer: '400', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-4', question: 'Có 240 viên kẹo chia đều cho 6 bạn. Mỗi bạn được bao nhiêu viên?', answer: '40', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-5', question: 'Tính: 25 × 4 + 100 = ?', answer: '200', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-6', question: 'Tính: 123 × 3 = ?', answer: '369', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-7', question: 'Tính: 840 : 4 = ?', answer: '210', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-8', question: 'Tìm x: x + 150 = 400', answer: '250', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-9', question: 'Tìm x: x × 5 = 250', answer: '50', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4ae-10', question: 'Tính giá trị biểu thức: (100 + 50) × 2', answer: '300', options: [], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
];

const FIXED_ARITHMETIC_APP_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4aa-1', question: '12 × 8 = ?', answer: '96', options: ['84', '96', '88', '92'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-2', question: '96 : 8 = ?', answer: '12', options: ['10', '11', '12', '13'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-3', question: '500 + 250 = ?', answer: '750', options: ['700', '750', '800', '850'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-4', question: '1000 − 250 = ?', answer: '750', options: ['700', '750', '800', '850'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-5', question: '15 × 6 = ?', answer: '90', options: ['80', '85', '90', '95'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-6', question: '120 : 4 = ?', answer: '30', options: ['20', '30', '40', '50'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-7', question: '250 × 2 = ?', answer: '500', options: ['400', '500', '600', '700'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-8', question: '750 - 500 = ?', answer: '250', options: ['150', '200', '250', '300'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-9', question: '150 + 150 = ?', answer: '300', options: ['200', '250', '300', '350'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
  { id: 'g4aa-10', question: '100 : 5 = ?', answer: '20', options: ['10', '15', '20', '25'], difficulty: 'easy', topic: 'Cộng, trừ, nhân, chia' },
];

const FIXED_PARALLELOGRAM_RHOMBUS_QUIZ_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4pr-1', question: 'Hình bình hành có mấy cặp cạnh đối diện song song?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-2', question: 'Hình bình hành có các cạnh đối diện như thế nào?', answer: 'Bằng nhau', options: ['Bằng nhau', 'Không bằng nhau', 'Ngắn hơn', 'Dài hơn'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-3', question: 'Hình thoi có mấy cạnh bằng nhau?', answer: '4', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-4', question: 'Hình thoi là hình có:', answer: '4 cạnh bằng nhau', options: ['4 cạnh bằng nhau', '3 cạnh', 'Không có cạnh', '2 cạnh'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-5', question: 'Hình bình hành có mấy cạnh?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-6', question: 'Hình nào có 4 cạnh bằng nhau?', answer: 'Hình thoi', options: ['Hình chữ nhật', 'Hình thoi', 'Hình tam giác', 'Hình tròn'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-7', question: 'Hình bình hành có mấy góc?', answer: '4', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-8', question: 'Hình thoi có dạng giống hình nào?', answer: 'Hình vuông nghiêng', options: ['Hình chữ nhật', 'Hình vuông nghiêng', 'Hình tròn', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-9', question: 'Hình bình hành có hai cạnh đối diện:', answer: 'Song song', options: ['Cắt nhau', 'Song song', 'Vuông góc', 'Trùng nhau'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pr-10', question: 'Hình thoi có mấy đường chéo?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
];

const FIXED_PARALLELOGRAM_RHOMBUS_ESSAY_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4pre-1', question: 'Nêu đặc điểm của hình bình hành.', answer: 'Có hai cặp cạnh đối diện song song và bằng nhau.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-2', question: 'Nêu đặc điểm của hình thoi.', answer: 'Có hai cặp cạnh đối diện song song và bốn cạnh bằng nhau.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-3', question: 'So sánh hình bình hành và hình thoi (giống và khác nhau).', answer: 'Giống: Có 2 cặp cạnh đối diện song song; Khác: Hình thoi có 4 cạnh bằng nhau.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-4', question: 'Hãy kể tên 2 hình trong thực tế có dạng hình thoi.', answer: 'Con diều, họa tiết thổ cẩm, biển báo giao thông...', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-5', question: 'Vẽ một hình bình hành và ghi chú các cạnh song song.', answer: 'Vẽ hình có 2 cặp cạnh đối diện song song.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-6', question: 'Hình thoi có mấy cặp cạnh đối diện song song?', answer: '2 cặp cạnh.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-7', question: 'Hình bình hành có các cặp cạnh đối diện như thế nào?', answer: 'Song song và bằng nhau.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-8', question: 'Hình thoi có phải là hình bình hành đặc biệt không? Vì sao?', answer: 'Có, vì nó có đầy đủ đặc điểm của hình bình hành và thêm đặc điểm 4 cạnh bằng nhau.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-9', question: 'Nêu đặc điểm về đường chéo của hình thoi.', answer: 'Hai đường chéo vuông góc với nhau và cắt nhau tại trung điểm mỗi đường.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pre-10', question: 'Hình bình hành có các góc đối diện như thế nào?', answer: 'Các góc đối diện bằng nhau.', options: [], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
];

const FIXED_PARALLELOGRAM_RHOMBUS_APP_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4pra-1', question: 'Hình thoi có các cạnh:', answer: 'Bằng nhau', options: ['Không bằng nhau', 'Bằng nhau', 'Ngắn', 'Dài'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-2', question: 'Hình bình hành có bao nhiêu cạnh?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-3', question: 'Hình vuông có phải hình thoi không?', answer: 'Có', options: ['Có', 'Không', 'Không biết', 'Sai'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-4', question: 'Hình thoi có mấy đường chéo?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-5', question: 'Hình bình hành có mấy góc?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-6', question: 'Hình bình hành có hai cặp cạnh đối diện như thế nào?', answer: 'Song song và bằng nhau', options: ['Song song và bằng nhau', 'Cắt nhau', 'Vuông góc', 'Không bằng nhau'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-7', question: 'Hình thoi có hai đường chéo như thế nào với nhau?', answer: 'Vuông góc', options: ['Song song', 'Vuông góc', 'Trùng nhau', 'Không cắt nhau'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-8', question: 'Chu vi hình thoi có cạnh a là:', answer: 'a × 4', options: ['a × 2', 'a × 4', 'a + 4', 'a × a'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-9', question: 'Diện tích hình thoi có hai đường chéo m và n là:', answer: '(m × n) : 2', options: ['m × n', '(m × n) : 2', 'm + n', '(m + n) : 2'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
  { id: 'g4pra-10', question: 'Hình nào vừa là hình bình hành vừa có 4 cạnh bằng nhau?', answer: 'Hình thoi', options: ['Hình chữ nhật', 'Hình thoi', 'Hình thang', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình bình hành & Thoi' },
];

const FIXED_FRACTIONS_QUIZ_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4f-1', question: 'Phân số gồm mấy phần?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-2', question: 'Trong phân số 3/5, số 3 gọi là:', answer: 'Tử số', options: ['Mẫu số', 'Tử số', 'Tổng', 'Hiệu'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-3', question: 'Trong phân số 3/5, số 5 gọi là:', answer: 'Mẫu số', options: ['Tử số', 'Mẫu số', 'Tổng', 'Hiệu'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-4', question: 'Phân số nào bé hơn 1?', answer: '3/5', options: ['5/3', '4/4', '3/5', '6/2'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-5', question: 'Phân số nào bằng 1?', answer: '4/4', options: ['2/3', '4/4', '3/5', '5/2'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-6', question: 'Phân số nào lớn hơn 1?', answer: '5/3', options: ['2/5', '3/4', '5/3', '4/4'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-7', question: '1/2 đọc là:', answer: 'Một phần hai', options: ['Một chia hai', 'Một phần hai', 'Hai phần một', 'Một nhân hai'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-8', question: '2/2 = ?', answer: '1', options: ['1', '2', '0', '3'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-9', question: 'Phân số nào lớn nhất?', answer: '1/2', options: ['1/2', '1/3', '1/4', '1/5'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4f-10', question: 'Phân số nào bé nhất?', answer: '1/4', options: ['3/4', '2/4', '1/4', '4/4'], difficulty: 'easy', topic: 'Phân số' },
];

const FIXED_FRACTIONS_ESSAY_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4fe-1', question: 'Viết 3 phân số bé hơn 1.', answer: '1/2, 2/3, 3/4', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-2', question: 'Viết 2 phân số lớn hơn 1.', answer: '3/2, 5/4', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-3', question: 'So sánh: 3/4 và 2/4.', answer: '3/4 > 2/4', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-4', question: 'Rút gọn phân số: 4/8.', answer: '1/2', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-5', question: 'Một cái bánh chia thành 4 phần bằng nhau, ăn 2 phần. Hỏi đã ăn bao nhiêu phần của cái bánh?', answer: '2/4 (hoặc 1/2)', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-6', question: 'Viết phân số chỉ phần đã tô màu của hình vuông chia làm 4 phần, tô màu 3 phần.', answer: '3/4', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-7', question: 'Tìm x: x + 1/4 = 3/4.', answer: '2/4 (hoặc 1/2)', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-8', question: 'Quy đồng mẫu số hai phân số: 1/2 và 1/3.', answer: '3/6 và 2/6', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-9', question: 'Tính: 1/5 + 2/5.', answer: '3/5', options: [], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fe-10', question: 'Sắp xếp các phân số sau theo thứ tự từ bé đến lớn: 1/2, 1/4, 1/3.', answer: '1/4, 1/3, 1/2', options: [], difficulty: 'easy', topic: 'Phân số' },
];

const FIXED_FRACTIONS_APP_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4fa-1', question: '6/6 = ?', answer: '1', options: ['1', '6', '0', '2'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-2', question: 'Phân số nào lớn hơn 1?', answer: '5/3', options: ['3/4', '5/3', '2/2', '1/2'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-3', question: 'Phân số nào bé hơn 1?', answer: '3/7', options: ['6/5', '4/3', '3/7', '5/5'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-4', question: 'So sánh: 1/2 và 2/3', answer: '<', options: ['>', '<', '=', 'Không biết'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-5', question: 'Phân số nào bằng 1/3?', answer: '2/6', options: ['2/6', '3/6', '4/6', '5/6'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-6', question: 'Rút gọn phân số 5/10 ta được:', answer: '1/2', options: ['1/2', '1/5', '2/5', '1/10'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-7', question: 'Phân số 2/5 bằng phân số nào dưới đây?', answer: '4/10', options: ['4/10', '2/10', '5/10', '6/10'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-8', question: 'Tính: 1/4 + 2/4 = ?', answer: '3/4', options: ['3/4', '3/8', '1/4', '1/2'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-9', question: 'Trong các phân số 1/2, 2/2, 3/2, phân số nào bằng 1?', answer: '2/2', options: ['1/2', '2/2', '3/2', 'Không có'], difficulty: 'easy', topic: 'Phân số' },
  { id: 'g4fa-10', question: 'Mẫu số của phân số 7/9 là:', answer: '9', options: ['7', '9', '16', '2'], difficulty: 'easy', topic: 'Phân số' },
];

const FIXED_STATISTICS_PROBABILITY_QUIZ_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4sp-1', question: 'Thống kê là gì?', answer: 'Thu thập và xử lí số liệu', options: ['Thu thập và xử lí số liệu', 'Làm toán cộng', 'Vẽ hình', 'Đếm số'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-2', question: 'Dữ liệu là gì?', answer: 'Số liệu thu thập được', options: ['Số liệu thu thập được', 'Hình vẽ', 'Phép tính', 'Trò chơi'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-3', question: 'Tung 1 đồng xu có mấy kết quả?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-4', question: 'Tung xúc xắc có mấy mặt?', answer: '6', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-5', question: 'Sự kiện “ra số 7 khi tung xúc xắc” là:', answer: 'Không thể', options: ['Có thể', 'Không thể', 'Chắc chắn', 'Bình thường'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-6', question: 'Sự kiện “mặt trời mọc buổi sáng” là:', answer: 'Chắc chắn', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-7', question: 'Số nào lớn nhất: 10, 20, 30, 40?', answer: '40', options: ['10', '20', '30', '40'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-8', question: 'Số nào bé nhất: 5, 8, 2, 9?', answer: '2', options: ['5', '8', '2', '9'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-9', question: 'Tung đồng xu ra “ngửa” là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4sp-10', question: 'Dữ liệu: 2, 2, 3. Số nào xuất hiện nhiều nhất?', answer: '2', options: ['2', '3', 'Không có', '1'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_STATISTICS_PROBABILITY_ESSAY_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4spe-1', question: 'Ghi lại dữ liệu chiều cao của 5 bạn trong lớp (tự chọn).', answer: 'Dữ liệu chiều cao (ví dụ: 130cm, 132cm...)', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-2', question: 'Dãy: 4, 5, 5, 6, 7. Tìm số xuất hiện nhiều nhất.', answer: '5', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-3', question: 'Tung 1 đồng xu, liệt kê các kết quả có thể xảy ra.', answer: 'Mặt sấp, mặt ngửa', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-4', question: 'Có 8 viên bi: 5 đỏ, 3 xanh. Hỏi có thể lấy được những màu nào?', answer: 'Màu đỏ hoặc màu xanh', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-5', question: 'Dãy: 20, 40, 60, 80. Tìm số lớn nhất và bé nhất.', answer: 'Lớn nhất: 80, Bé nhất: 20', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-6', question: 'Thống kê số lượng học sinh trong tổ của em.', answer: 'Số lượng học sinh cụ thể', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-7', question: 'Tung xúc xắc, liệt kê các mặt có thể xuất hiện.', answer: 'Mặt 1, 2, 3, 4, 5, 6 chấm', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-8', question: 'Trong hộp có 10 bi xanh, việc lấy ra 1 bi đỏ là sự kiện gì?', answer: 'Không thể', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-9', question: 'Dãy số: 15, 10, 25, 30. Sắp xếp từ bé đến lớn.', answer: '10, 15, 25, 30', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spe-10', question: 'Kể tên 3 loại dữ liệu em có thể thu thập được trong vườn trường.', answer: 'Số cây, số hoa, số ghế đá...', options: [], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_STATISTICS_PROBABILITY_APP_QUESTIONS_G4: MathProblem[] = [
  { id: 'g4spa-1', question: 'Dữ liệu: 3, 3, 4. Số nào nhiều nhất?', answer: '3', options: ['3', '4', 'Không có', '1'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-2', question: 'Có 5 mèo, 3 chó. Con nào nhiều hơn?', answer: 'Mèo', options: ['Mèo', 'Chó', 'Bằng nhau', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-3', question: 'Tung xúc xắc ra số 1 là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-4', question: 'Dữ liệu: 6, 5, 4. Số bé nhất là:', answer: '4', options: ['4', '5', '6', '3'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-5', question: 'Tung đồng xu ra sấp là:', answer: 'Có thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-6', question: 'Dữ liệu: 10, 10, 10, 20. Số nào xuất hiện nhiều nhất?', answer: '10', options: ['10', '20', '30', 'Không có'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-7', question: 'Tung xúc xắc ra số 7 là việc:', answer: 'Không thể', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-8', question: 'Dữ liệu: 15, 25, 35. Số lớn nhất là:', answer: '35', options: ['15', '25', '35', '45'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-9', question: 'Trong hộp có 5 bi đỏ, lấy ra 1 bi đỏ là việc:', answer: 'Chắc chắn', options: ['Không thể', 'Có thể', 'Chắc chắn', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
  { id: 'g4spa-10', question: 'Dữ liệu: Lan (5 điểm), Hoa (7 điểm). Ai có điểm thấp hơn?', answer: 'Lan', options: ['Lan', 'Hoa', 'Bằng nhau', 'Không biết'], difficulty: 'easy', topic: 'Thống kê & Xác suất' },
];

const FIXED_FRACTIONS_MIXED_QUIZ_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5f-1', question: 'Phân số gồm mấy phần?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-2', question: 'Trong phân số 7/5, số 5 gọi là:', answer: 'Mẫu số', options: ['Mẫu số', 'Tử số', 'Tổng', 'Hiệu'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-3', question: 'Trong phân số 7/5, số 7 gọi là:', answer: 'Tử số', options: ['Tử số', 'Mẫu số', 'Tổng', 'Hiệu'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-4', question: '6/6 = ?', answer: '1', options: ['1', '6', '0', '2'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-5', question: 'Phân số nào bé hơn 1?', answer: '5/7', options: ['5/7', '4/3', '5/5', '8/6'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-6', question: 'Phân số nào lớn hơn 1?', answer: '3/2', options: ['3/2', '5/8', '4/7', '4/4'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-7', question: 'Hỗn số gồm có mấy phần?', answer: 'Số tự nhiên và phân số', options: ['1 số tự nhiên', '1 phân số', 'Số tự nhiên và phân số', 'Không có'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-8', question: 'Biểu thức 2 1/3 gọi là gì?', answer: 'Hỗn số', options: ['Phân số', 'Hỗn số', 'Số tự nhiên', 'Số thập phân'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-9', question: 'Phân số 2/2 bằng bao nhiêu?', answer: '1', options: ['1', '2', '0', '3'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-10', question: 'Phân số nào sau đây bằng 1?', answer: '5/5', options: ['4/3', '5/5', '3/2', '7/6'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
];

const FIXED_FRACTIONS_MIXED_ESSAY_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5f-e1', question: 'Viết 3 phân số lớn hơn 1.', answer: '3/2, 4/3, 5/4', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e2', question: 'Đổi hỗn số 2 1/3 thành phân số.', answer: '7/3', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e3', question: 'Rút gọn phân số 9/12.', answer: '3/4', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e4', question: 'So sánh 3/4 và 2/3.', answer: '3/4 > 2/3', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e5', question: 'Một cái bánh chia thành 8 phần bằng nhau, ăn 3 phần. Hỏi đã ăn bao nhiêu phần cái bánh?', answer: '3/8', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e6', question: 'Tìm x: x - 1/2 = 3/2.', answer: '2', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e7', question: 'Viết phân số 5/2 dưới dạng hỗn số.', answer: '2 1/2', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e8', question: 'Tính: 1/2 + 1/3.', answer: '5/6', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e9', question: 'Quy đồng mẫu số hai phân số: 1/4 và 1/5.', answer: '5/20 và 4/20', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-e10', question: 'Sắp xếp các phân số sau theo thứ tự từ lớn đến bé: 1/2, 1/3, 1/4.', answer: '1/2, 1/3, 1/4', options: [], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
];

const FIXED_FRACTIONS_MIXED_APP_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5f-a1', question: '8/8 = ?', answer: '1', options: ['1', '8', '0', '2'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a2', question: 'Phân số nào lớn hơn 1?', answer: '5/3', options: ['3/4', '5/3', '2/2', '2/1'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a3', question: 'Hỗn số 2 3/4 gồm:', answer: '2 và 3/4', options: ['2 và 3/4', '3 và 4', '2 và 3', '4 và 2'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a4', question: 'So sánh: 2/1 và 3/1', answer: '<', options: ['>', '<', '=', 'Không biết'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a5', question: 'Phân số nào bằng 3/2?', answer: '6/4', options: ['6/4', '6/3', '6/5', '6/6'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a6', question: 'Phân số nào sau đây tối giản?', answer: '3/5', options: ['2/4', '3/5', '6/8', '5/10'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a7', question: 'Điền dấu thích hợp: 1/2 ___ 1/3', answer: '>', options: ['>', '<', '=', 'Không biết'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a8', question: '10/2 = ?', answer: '5', options: ['5', '2', '10', '1'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a9', question: 'Rút gọn phân số 4/8 ta được:', answer: '1/2', options: ['1/4', '1/2', '2/3', '1/8'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
  { id: 'g5f-a10', question: 'Tìm x: x + 1/4 = 3/4', answer: '1/2', options: ['1/2', '1/4', '1', '2/4'], difficulty: 'easy', topic: 'Ôn tập phân số & Hỗn số' },
];

const FIXED_DECIMALS_QUIZ_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5d-1', question: 'Số thập phân gồm mấy phần?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-2', question: 'Trong số 3,5 thì 3 là:', answer: 'Phần nguyên', options: ['Phần thập phân', 'Phần nguyên', 'Tổng', 'Hiệu'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-3', question: 'Trong số 3,5 thì 5 là:', answer: 'Phần thập phân', options: ['Phần nguyên', 'Phần thập phân', 'Tổng', 'Hiệu'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-4', question: '0,5 đọc là:', answer: 'Không phẩy năm', options: ['Không phẩy năm', 'Năm phẩy không', 'Không năm', 'Năm không'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-5', question: '1,2 = ?', answer: '1 + 0,2', options: ['1 + 2', '1 + 0,2', '1 + 0,02', '1 + 2,0'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-6', question: '0,1 = ?', answer: 'Một phần mười', options: ['Một phần mười', 'Một phần trăm', 'Một phần nghìn', 'Một phần hai'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-7', question: 'Số nào lớn hơn?', answer: '0,5', options: ['0,5', '0,3', '0,2', '0,1'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-8', question: '0,7 = ?', answer: '7/10', options: ['7/10', '7/100', '7/1', '70/1000'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-9', question: '1 = ?', answer: '1,0', options: ['0,1', '1,0', '0,01', '0,001'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-10', question: 'Số nào bé nhất?', answer: '0,6', options: ['0,9', '0,8', '0,7', '0,6'], difficulty: 'easy', topic: 'Số thập phân' },
];

const FIXED_DECIMALS_ESSAY_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5d-e1', question: 'Viết số thập phân: ba phẩy bảy.', answer: '3,7', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e2', question: 'Đổi phân số 3/10 thành số thập phân.', answer: '0,3', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e3', question: 'Tính: 2,5 + 3,4 = ?', answer: '5,9', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e4', question: 'So sánh: 0,75 và 0,8.', answer: '0,75 < 0,8', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e5', question: 'Một chai nước có 1,5 lít, uống hết 0,5 lít. Hỏi còn lại bao nhiêu lít?', answer: '1', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e6', question: 'Viết số thập phân có: 5 đơn vị, 3 phần mười.', answer: '5,3', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e7', question: 'Đổi 1/2 thành số thập phân.', answer: '0,5', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e8', question: 'Số 4,25 đọc là gì?', answer: 'Bốn phẩy hai mươi lăm', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e9', question: 'Tìm x: x + 1,2 = 2,5.', answer: '1,3', options: [], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-e10', question: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 0,5; 0,2; 0,8.', answer: '0,2; 0,5; 0,8', options: [], difficulty: 'easy', topic: 'Số thập phân' },
];

const FIXED_DECIMALS_APP_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5d-a1', question: '0,75 = ?', answer: '75/100', options: ['75/10', '75/100', '3/4', '7/5'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a2', question: 'Số nào lớn hơn?', answer: '2,5', options: ['2,5', '2,05', '2,15', '2,01'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a3', question: '5,5 − 2,5 = ?', answer: '3', options: ['2', '3', '3,5', '4'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a4', question: '0,6 × 10 = ?', answer: '6', options: ['6', '60', '0,06', '0,6'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a5', question: '3,2 : 2 = ?', answer: '1,6', options: ['1,5', '1,6', '1,7', '1,8'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a6', question: '0,25 × 100 = ?', answer: '25', options: ['25', '2,5', '0,25', '250'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a7', question: '1,5 + 2,5 = ?', answer: '4', options: ['3', '4', '5', '3,5'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a8', question: '10 : 4 = ?', answer: '2,5', options: ['2', '2,5', '2,25', '3'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a9', question: 'Số nào bé nhất?', answer: '1,02', options: ['1,2', '1,02', '1,21', '1,12'], difficulty: 'easy', topic: 'Số thập phân' },
  { id: 'g5d-a10', question: '0,1 + 0,01 = ?', answer: '0,11', options: ['0,11', '0,2', '1,1', '0,011'], difficulty: 'easy', topic: 'Số thập phân' },
];

const FIXED_ADD_SUB_DECIMALS_QUIZ_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5as-1', question: '2,3 + 1,2 = ?', answer: '3,5', options: ['3,4', '3,5', '3,6', '3,7'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-2', question: '5,5 − 2,5 = ?', answer: '3', options: ['2', '3', '3,5', '4'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-3', question: '1,1 + 2,2 = ?', answer: '3,3', options: ['3,1', '3,2', '3,3', '3,4'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-4', question: '4,0 − 1,5 = ?', answer: '2,5', options: ['2,5', '2,4', '2,6', '2,3'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-5', question: '3,5 + 0,5 = ?', answer: '4', options: ['3,8', '4', '4,5', '3,9'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-6', question: '6,2 − 2,2 = ?', answer: '4', options: ['3,8', '4', '4,2', '4,4'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-7', question: '7,1 + 1,9 = ?', answer: '9', options: ['8,8', '9', '9,1', '8,9'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-8', question: '10,0 − 5,0 = ?', answer: '5', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-9', question: '0,5 + 0,5 = ?', answer: '1', options: ['1', '0,5', '0', '2'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-10', question: '2,0 − 1,0 = ?', answer: '1', options: ['1', '2', '0', '3'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
];

const FIXED_ADD_SUB_DECIMALS_ESSAY_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5as-e1', question: 'Tính: 2,45 + 3,55 = ?', answer: '6', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e2', question: 'Tính: 8,75 − 2,25 = ?', answer: '6,5', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e3', question: 'Một chai nước có 2,5 lít, uống hết 1,2 lít. Hỏi còn lại bao nhiêu lít?', answer: '1,3', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e4', question: 'Tính: 4,6 + 3,7 − 2,3 = ?', answer: '6', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e5', question: 'Một cửa hàng có 10,5 kg gạo, bán đi 4,25 kg. Hỏi còn lại bao nhiêu kg?', answer: '6,25', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e6', question: 'Tính: 15,25 + 4,75 = ?', answer: '20', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e7', question: 'Tính: 20 - 5,5 = ?', answer: '14,5', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e8', question: 'Một đoạn dây dài 5,8m, cắt đi 2,4m. Hỏi còn lại bao nhiêu mét?', answer: '3,4', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e9', question: 'Tính: 1,25 + 2,75 + 3,5 = ?', answer: '7,5', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-e10', question: 'Một hình tam giác có các cạnh lần lượt là 3,5cm; 4,2cm và 5,3cm. Tính chu vi hình tam giác đó.', answer: '13', options: [], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
];

const FIXED_ADD_SUB_DECIMALS_APP_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5as-a1', question: '4,5 + 5,5 = ?', answer: '10', options: ['9', '10', '9,5', '10,5'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a2', question: '7,2 − 2,2 = ?', answer: '5', options: ['5', '5,2', '4,8', '5,5'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a3', question: '1,25 + 1,75 = ?', answer: '3', options: ['3', '2,5', '3,5', '4'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a4', question: '6,0 − 2,5 = ?', answer: '3,5', options: ['3,5', '3', '4', '2,5'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a5', question: '0,9 + 0,1 = ?', answer: '1', options: ['1', '0,9', '0,8', '1,1'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a6', question: '10,5 − 5,5 = ?', answer: '5', options: ['4', '5', '6', '4,5'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a7', question: '0,25 + 0,75 = ?', answer: '1', options: ['0,5', '1', '1,25', '1,5'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a8', question: '8,8 − 4,4 = ?', answer: '4,4', options: ['4', '4,2', '4,4', '4,6'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a9', question: '1,5 + 1,5 + 1,5 = ?', answer: '4,5', options: ['3', '3,5', '4', '4,5'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
  { id: 'g5as-a10', question: '10 − 2,25 = ?', answer: '7,75', options: ['7,5', '7,75', '8,25', '8,5'], difficulty: 'easy', topic: 'Cộng, trừ số thập phân' },
];

const FIXED_MULT_DIV_DECIMALS_QUIZ_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5md-1', question: '2,5 × 2 = ?', answer: '5', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-2', question: '4,0 : 2 = ?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-3', question: '1,5 × 2 = ?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-4', question: '6,0 : 3 = ?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-5', question: '0,5 × 2 = ?', answer: '1', options: ['1', '0,5', '2', '0'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-6', question: '8,0 : 4 = ?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-7', question: '3,0 × 3 = ?', answer: '9', options: ['6', '9', '12', '3'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-8', question: '9,0 : 3 = ?', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-9', question: '0,2 × 5 = ?', answer: '1', options: ['1', '2', '0,5', '5'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-10', question: '10,0 : 5 = ?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
];

const FIXED_MULT_DIV_DECIMALS_ESSAY_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5md-e1', question: 'Tính: 2,5 × 3 = ?', answer: '7,5', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e2', question: 'Tính: 7,5 : 2,5 = ?', answer: '3', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e3', question: 'Một chai có 1,5 lít nước, có 4 chai như vậy. Hỏi có bao nhiêu lít nước?', answer: '6', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e4', question: 'Tính: 3,2 × 2 + 1,6 = ?', answer: '8', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e5', question: 'Một sợi dây dài 8,4 m chia đều thành 4 phần. Hỏi mỗi phần dài bao nhiêu mét?', answer: '2,1', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e6', question: 'Tính: 0,25 × 4 = ?', answer: '1', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e7', question: 'Tính: 10 : 2,5 = ?', answer: '4', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e8', question: 'Một hình chữ nhật có chiều dài 4,5m, chiều rộng 2m. Tính diện tích hình chữ nhật đó.', answer: '9', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e9', question: 'Tìm x: x × 2 = 5,4', answer: '2,7', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-e10', question: 'Tính: 1,5 × 10 = ?', answer: '15', options: [], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
];

const FIXED_MULT_DIV_DECIMALS_APP_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5md-a1', question: '4,5 × 2 = ?', answer: '9', options: ['8', '9', '10', '11'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a2', question: '6,6 : 3 = ?', answer: '2,2', options: ['2,1', '2,2', '2,3', '2,4'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a3', question: '1,2 × 5 = ?', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a4', question: '9,0 : 0,9 = ?', answer: '10', options: ['9', '10', '11', '12'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a5', question: '0,4 × 10 = ?', answer: '4', options: ['4', '0,4', '40', '0,04'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a6', question: '2,4 : 0,6 = ?', answer: '4', options: ['3', '4', '5', '6'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a7', question: '1,25 × 4 = ?', answer: '5', options: ['4', '4,5', '5', '5,5'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a8', question: '10 : 0,5 = ?', answer: '20', options: ['5', '10', '15', '20'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a9', question: '0,5 × 0,5 = ?', answer: '0,25', options: ['0,25', '0,5', '1', '2,5'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
  { id: 'g5md-a10', question: '3,6 : 1,2 = ?', answer: '3', options: ['2', '3', '4', '3,5'], difficulty: 'easy', topic: 'Nhân, chia số thập phân' },
];

const FIXED_PLANE_GEOMETRY_QUIZ_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5pg-1', question: 'Hình vuông có cạnh 6 cm. Chu vi là:', answer: '24 cm', options: ['12 cm', '24 cm', '36 cm', '18 cm'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-2', question: 'Diện tích hình vuông cạnh 5 cm là:', answer: '25 cm²', options: ['10 cm²', '20 cm²', '25 cm²', '30 cm²'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-3', question: 'HCN có dài 8 cm, rộng 3 cm. Chu vi là:', answer: '22 cm', options: ['22 cm', '24 cm', '20 cm', '18 cm'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-4', question: 'Diện tích HCN dài 7 cm, rộng 4 cm là:', answer: '28 cm²', options: ['28 cm²', '24 cm²', '21 cm²', '30 cm²'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-5', question: 'Tam giác có đáy 6 cm, cao 4 cm. Diện tích là:', answer: '12 cm²', options: ['24 cm²', '12 cm²', '10 cm²', '8 cm²'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-6', question: 'Hình tròn có đặc điểm:', answer: 'Không có cạnh', options: ['Có 4 cạnh', 'Không có cạnh', 'Có 3 cạnh', 'Có 2 cạnh'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-7', question: 'Chu vi tam giác có các cạnh 5, 5, 6 là:', answer: '16', options: ['15', '16', '17', '18'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-8', question: 'Hình vuông có chu vi 20 cm. Cạnh là:', answer: '5 cm', options: ['4 cm', '5 cm', '6 cm', '10 cm'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-9', question: 'HCN có chu vi 18 cm, dài 5 cm. Rộng là:', answer: '4 cm', options: ['4 cm', '3 cm', '2 cm', '5 cm'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-10', question: 'Diện tích hình vuông cạnh 9 cm là:', answer: '81 cm²', options: ['81 cm²', '72 cm²', '90 cm²', '99 cm²'], difficulty: 'easy', topic: 'Hình học phẳng' },
];

const FIXED_PLANE_GEOMETRY_ESSAY_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5pg-e1', question: 'Một hình chữ nhật có chu vi 28 cm, chiều dài hơn chiều rộng 4 cm. Tính diện tích.', answer: '45', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e2', question: 'Một hình vuông có diện tích 49 cm². Tính chu vi.', answer: '28', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e3', question: 'Một tam giác có đáy 12 cm, diện tích 36 cm². Tính chiều cao.', answer: '6', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e4', question: 'Một mảnh đất hình chữ nhật dài 15 m, rộng 8 m. Tính chu vi và diện tích.', answer: '46 và 120', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e5', question: 'Một hình chữ nhật có chiều dài gấp 3 lần chiều rộng, chu vi 48 cm. Tính diện tích.', answer: '108', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e6', question: 'Một hình thang có đáy lớn 8cm, đáy bé 6cm, chiều cao 5cm. Tính diện tích hình thang đó.', answer: '35', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e7', question: 'Hình chữ nhật có diện tích 48 cm², chiều dài 8cm. Tính chu vi hình chữ nhật đó.', answer: '28', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e8', question: 'Một tam giác vuông có hai cạnh góc vuông lần lượt là 3cm và 4cm. Tính diện tích tam giác đó.', answer: '6', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e9', question: 'Một hình chữ nhật có chu vi 30cm, chiều dài 9cm. Tính diện tích hình chữ nhật đó.', answer: '54', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-e10', question: 'Một hình vuông có chu vi 32cm. Tính diện tích hình vuông đó.', answer: '64', options: [], difficulty: 'easy', topic: 'Hình học phẳng' },
];

const FIXED_PLANE_GEOMETRY_APP_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5pg-a1', question: 'Một hình vuông có chu vi gấp đôi HCN (dài 6, rộng 4). Cạnh hình vuông là:', answer: '10', options: ['5', '10', '7', '8'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a2', question: 'HCN có diện tích 60 cm², dài hơn rộng 4 cm. Rộng là:', answer: '6', options: ['6', '5', '4', '3'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a3', question: 'Tam giác có diện tích 18 cm², cao 3 cm. Đáy là:', answer: '12', options: ['6', '12', '9', '8'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a4', question: 'Hình vuông có diện tích bằng HCN (dài 8, rộng 2). Cạnh là:', answer: '4', options: ['4', '5', '6', '3'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a5', question: 'Tổng chu vi 2 hình vuông cạnh 4 cm là:', answer: '32', options: ['16', '32', '24', '20'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a6', question: 'Một hình lập phương có cạnh 2 cm. Tổng độ dài các cạnh là:', answer: '24', options: ['12', '24', '16', '20'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a7', question: 'Diện tích hình vuông tăng bao nhiêu lần nếu cạnh tăng gấp đôi?', answer: '4 lần', options: ['2 lần', '4 lần', '3 lần', '8 lần'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a8', question: 'Chu vi hình vuông tăng bao nhiêu lần nếu cạnh tăng gấp đôi?', answer: '2 lần', options: ['2 lần', '4 lần', '3 lần', '1 lần'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a9', question: 'HCN có chu vi 20 cm, diện tích 24 cm². Chiều dài là:', answer: '6', options: ['4', '5', '6', '8'], difficulty: 'easy', topic: 'Hình học phẳng' },
  { id: 'g5pg-a10', question: 'Hình nào có 4 cạnh bằng nhau và 4 góc vuông?', answer: 'Hình vuông', options: ['Hình chữ nhật', 'Hình vuông', 'Hình thoi', 'Hình tam giác'], difficulty: 'easy', topic: 'Hình học phẳng' },
];

const FIXED_SOLID_GEOMETRY_QUIZ_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5sg-1', question: 'Hình lập phương có mấy cạnh?', answer: '12', options: ['8', '12', '6', '4'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-2', question: 'Hình hộp chữ nhật có mấy mặt?', answer: '6', options: ['4', '5', '6', '8'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-3', question: 'Thể tích hình lập phương cạnh 3 cm là:', answer: '27 cm³', options: ['9 cm³', '27 cm³', '6 cm³', '12 cm³'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-4', question: 'Thể tích HHCN dài 2 cm, rộng 3 cm, cao 4 cm là:', answer: '24 cm³', options: ['24 cm³', '12 cm³', '9 cm³', '18 cm³'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-5', question: 'Đơn vị đo thể tích là:', answer: 'cm³', options: ['cm', 'cm²', 'cm³', 'm'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-6', question: '1 m³ = ? dm³', answer: '1000', options: ['10', '100', '1000', '10000'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-7', question: 'Hình lập phương có mấy mặt bằng nhau?', answer: '6', options: ['4', '5', '6', '3'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-8', question: 'Hình hộp chữ nhật có bao nhiêu cạnh?', answer: '12', options: ['8', '10', '12', '14'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-9', question: '1 dm³ = ? lít', answer: '1', options: ['1', '10', '100', '1000'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-10', question: 'Hình nào có 6 mặt đều là hình vuông?', answer: 'Hình lập phương', options: ['HHCN', 'Hình lập phương', 'Hình trụ', 'Hình cầu'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
];

const FIXED_UNIFORM_MOTION_QUIZ_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5um-1', question: 'Xe đi 60 km trong 2 giờ. Vận tốc là:', answer: '30 km/h', options: ['20 km/h', '30 km/h', '40 km/h', '50 km/h'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-2', question: 'Xe chạy 40 km/h trong 3 giờ. Quãng đường là:', answer: '120 km', options: ['100 km', '110 km', '120 km', '130 km'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-3', question: 'Đi 100 km với vận tốc 50 km/h. Thời gian là:', answer: '2 giờ', options: ['1 giờ', '2 giờ', '3 giờ', '4 giờ'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-4', question: '1 giờ = ? phút', answer: '60', options: ['30', '60', '100', '24'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-5', question: '2 giờ = ? phút', answer: '120', options: ['100', '120', '140', '60'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-6', question: 'Xe đi 30 km/h trong 2 giờ. Quãng đường là:', answer: '60 km', options: ['50 km', '60 km', '70 km', '80 km'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-7', question: '90 km trong 3 giờ → vận tốc:', answer: '30', options: ['20', '25', '30', '35'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-8', question: '120 km với 60 km/h → thời gian:', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-9', question: '1,5 giờ = ? phút', answer: '90', options: ['60', '90', '120', '150'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-10', question: 'Xe đi 80 km trong 4 giờ → vận tốc:', answer: '20', options: ['10', '20', '30', '40'], difficulty: 'easy', topic: 'Chuyển động đều' },
];

const FIXED_STATISTICS_CHARTS_QUIZ_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5sc-1', question: 'Cho bảng số liệu: Toán: 10 | Văn: 8 | Anh: 12 | Tin: 6. Môn nào nhiều học sinh thích nhất?', answer: 'Anh', options: ['Toán', 'Văn', 'Anh', 'Tin'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-2', question: 'Trong bảng số liệu trên, môn nào ít học sinh thích nhất?', answer: 'Tin', options: ['Toán', 'Văn', 'Anh', 'Tin'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-3', question: 'Tổng số học sinh thích các môn học trên là:', answer: '36', options: ['30', '36', '34', '32'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-4', question: 'Dựa vào bảng số liệu, môn Toán nhiều hơn môn Văn bao nhiêu bạn?', answer: '2', options: ['1', '2', '3', '4'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-5', question: 'Dựa vào bảng số liệu, môn Anh hơn môn Tin bao nhiêu bạn?', answer: '6', options: ['4', '5', '6', '7'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-6', question: 'Dựa vào bảng số liệu, số bạn thích môn Tin học là:', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-7', question: 'Nếu thêm 2 bạn thích Văn, thì tổng số bạn thích môn Văn sẽ là:', answer: '10', options: ['9', '10', '11', '12'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-8', question: 'Dựa vào bảng số liệu, môn Toán chiếm bao nhiêu học sinh?', answer: '10', options: ['8', '10', '12', '6'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-9', question: 'Dựa vào bảng số liệu, số bạn thích môn Anh gấp mấy lần môn Tin?', answer: '2', options: ['2', '3', '1,5', '1'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-10', question: 'Dựa vào số lượng học sinh thích, môn nào đứng thứ 2?', answer: 'Toán', options: ['Toán', 'Văn', 'Anh', 'Tin'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
];

const FIXED_STATISTICS_CHARTS_ESSAY_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5sc-e1', question: 'Cho dãy số liệu: 6, 8, 10, 6, 5. Tìm số xuất hiện nhiều nhất và tính tổng của dãy số đó.', answer: '6 và 35', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e2', question: 'Một lớp có số bạn thích đá bóng là 12, bóng rổ là 8, cầu lông là 10. Tính tổng số học sinh và cho biết môn nào có nhiều bạn thích nhất.', answer: '30 và đá bóng', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e3', question: 'Tìm số trung bình cộng của các số sau: 5, 7, 9.', answer: '7', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e4', question: 'Trong một tuần, bạn An đọc được lần lượt số cuốn sách là: 4, 5, 6, 7, 8. Tính tổng số sách và trung bình mỗi ngày An đọc bao nhiêu cuốn.', answer: '30 và 6', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e5', question: 'Số học sinh của 3 lớp lần lượt là 30, 32, 34. Tính trung bình số học sinh của mỗi lớp.', answer: '32', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e6', question: 'Một đội công nhân ngày thứ nhất làm được 15m đường, ngày thứ hai làm được 17m. Hỏi trung bình mỗi ngày đội đó làm được bao nhiêu mét đường?', answer: '16', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e7', question: 'Cho bảng số liệu: Cam: 50kg, Táo: 40kg, Lê: 30kg. Tổng khối lượng hoa quả là bao nhiêu kg?', answer: '120', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e8', question: 'Bốn bạn có chiều cao lần lượt là: 130cm, 140cm, 150cm, 140cm. Tìm chiều cao trung bình của bốn bạn đó.', answer: '140', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e9', question: 'Điểm kiểm tra Toán của 5 học sinh là: 8, 9, 10, 8, 5. Tính tổng điểm và điểm trung bình.', answer: '40 và 8', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-e10', question: 'Một cửa hàng ngày đầu bán được 100 quả trứng, ngày sau bán được 120 quả. Tính trung bình số trứng bán được mỗi ngày.', answer: '110', options: [], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
];

const FIXED_SOLID_GEOMETRY_ESSAY_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5sg-e1', question: 'Tính thể tích hình lập phương cạnh 7 cm.', answer: '343', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e2', question: 'Một hình hộp chữ nhật có dài 8 cm, rộng 5 cm, cao 3 cm. Tính thể tích.', answer: '120', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e3', question: 'Một bể nước dạng hình hộp chữ nhật có thể tích 120 lít. Hỏi thể tích đó bằng bao nhiêu dm³?', answer: '120', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e4', question: 'Một hình lập phương có thể tích 125 cm³. Tính độ dài cạnh của hình lập phương đó.', answer: '5', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e5', question: 'Một hình hộp chữ nhật có thể tích 96 cm³, chiều dài 6 cm, chiều rộng 4 cm. Tính chiều cao.', answer: '4', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e6', question: 'Thể tích một hình lập phương là 64 cm³. Tính diện tích một mặt của nó.', answer: '16', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e7', question: 'Một bể nước chứa được 2 m³ nước. Hỏi bể đó chứa được bao nhiêu lít nước?', answer: '2000', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e8', question: 'Tính thể tích HHCN có diện tích đáy 20 cm² và chiều cao 5 cm.', answer: '100', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e9', question: 'Một khối gỗ hình lập phương cạnh 10 cm. Tính thể tích khối gỗ đó.', answer: '1000', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-e10', question: 'Một HHCN có thể tích 150 cm³, chiều cao 6 cm. Tính diện tích đáy.', answer: '25', options: [], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
];

const FIXED_UNIFORM_MOTION_ESSAY_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5um-e1', question: 'Một xe đi 120 km trong 3 giờ. Tính vận tốc.', answer: '40', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e2', question: 'Một xe chạy 50 km/h trong 2,5 giờ. Tính quãng đường.', answer: '125', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e3', question: 'Một người đi xe máy 90 km với vận tốc 45 km/h. Hỏi hết bao lâu?', answer: '2', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e4', question: 'Một ô tô đi 60 km/h trong 1 giờ 30 phút. Tính quãng đường.', answer: '90', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e5', question: 'Một xe đi 150 km trong 2 giờ 30 phút. Tính vận tốc.', answer: '60', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e6', question: 'Một người đi bộ với vận tốc 4 km/h trong 45 phút. Tính quãng đường người đó đi được.', answer: '3', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e7', question: 'Một xe đạp đi được 18 km trong 1 giờ 12 phút. Tính vận tốc của xe đạp đó.', answer: '15', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e8', question: 'Một đoàn tàu đi với vận tốc 33 km/h trên quãng đường 11 km. Hỏi tàu đi hết bao nhiêu phút?', answer: '20', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e9', question: 'Một xe máy đi từ A lúc 7 giờ 30 phút và đến B lúc 9 giờ. Biết vận tốc là 40 km/h, tính quãng đường AB.', answer: '60', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-e10', question: 'Một ô tô đi quãng đường 210 km hết 3 giờ 30 phút. Tính vận tốc của ô tô.', answer: '60', options: [], difficulty: 'easy', topic: 'Chuyển động đều' },
];

const FIXED_UNIFORM_MOTION_APP_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5um-a1', question: 'Xe đi 60 km/h trong 2 giờ 30 phút. Quãng đường:', answer: '150', options: ['120', '150', '180', '140'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a2', question: 'Xe đi 100 km trong 2 giờ 30 phút. Vận tốc:', answer: '40', options: ['40', '50', '60', '45'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a3', question: 'Đi 180 km với 60 km/h. Thời gian:', answer: '3', options: ['2', '3', '4', '5'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a4', question: 'Xe đi 54 km trong 1,5 giờ. Vận tốc:', answer: '36', options: ['30', '36', '40', '45'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a5', question: 'Xe chạy 80 km/h trong 0,5 giờ. Quãng đường:', answer: '40', options: ['20', '30', '40', '50'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a6', question: 'Xe đạp đi 12 km trong 45 phút. Vận tốc (km/h):', answer: '16', options: ['12', '15', '16', '18'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a7', question: 'Một tàu hỏa chạy với vận tốc 42 km/h trong 1 giờ 20 phút. Quãng đường:', answer: '56', options: ['50', '54', '56', '60'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a8', question: 'Hai xe đi ngược chiều từ A và B cách nhau 150 km. Vận tốc xe 1 là 40km/h, xe 2 là 60km/h. Sau bao lâu họ gặp nhau?', answer: '1.5', options: ['1', '1.5', '2', '2.5'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a9', question: 'Một canô xuôi dòng với vận tốc 25 km/h, vận tốc dòng nước là 3 km/h. Vận tốc thực của canô là:', answer: '22', options: ['22', '25', '28', '20'], difficulty: 'easy', topic: 'Chuyển động đều' },
  { id: 'g5um-a10', question: 'Một ô tô đi từ A đến B hết 2 giờ, từ B về A hết 3 giờ. Vận tốc đi nhanh hơn vận tốc về bao nhiêu lần?', answer: '1.5', options: ['1.2', '1.5', '2', '1.3'], difficulty: 'easy', topic: 'Chuyển động đều' },
];

const FIXED_SOLID_GEOMETRY_APP_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5sg-a1', question: 'Hình lập phương cạnh 5 cm. Thể tích là:', answer: '125', options: ['25', '125', '100', '150'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a2', question: 'HHCN có V = 60 cm³, dài 5 cm, rộng 3 cm. Cao là:', answer: '4', options: ['4', '3', '5', '2'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a3', question: 'Một hình lập phương có thể tích 64 cm³. Cạnh là:', answer: '4', options: ['4', '8', '6', '5'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a4', question: 'HHCN có V = 120 cm³, cao 4 cm, rộng 5 cm. Dài là:', answer: '6', options: ['6', '5', '4', '3'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a5', question: '2 m³ = ? dm³', answer: '2000', options: ['200', '2000', '20000', '20'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a6', question: 'Một hình lập phương có cạnh gấp đôi. Thể tích tăng:', answer: '8 lần', options: ['2 lần', '4 lần', '6 lần', '8 lần'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a7', question: 'HHCN có V = 72 cm³, dài 6 cm, cao 3 cm. Rộng là:', answer: '4', options: ['4', '3', '2', '5'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a8', question: '5000 cm³ = ? dm³', answer: '5', options: ['5', '50', '0,5', '500'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a9', question: 'Hình lập phương có cạnh 10 cm. Thể tích là:', answer: '1000', options: ['100', '1000', '10000', '10'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
  { id: 'g5sg-a10', question: '3 dm³ = ? lít', answer: '3', options: ['3', '30', '300', '0,3'], difficulty: 'easy', topic: 'Hình khối & Thể tích' },
];

const FIXED_STATISTICS_CHARTS_APP_QUESTIONS_G5: MathProblem[] = [
  { id: 'g5sc-a1', question: 'Tính tổng của các số: 20, 30, 50. Kết quả là:', answer: '100', options: ['80', '90', '100', '110'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a2', question: 'Số trung bình cộng của 4, 6, 8 là:', answer: '6', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a3', question: 'Dữ liệu: 3, 3, 5, 7. Số nào xuất hiện nhiều nhất?', answer: '3', options: ['3', '5', '7', 'Không có'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a4', question: 'Biểu đồ tranh thường được dùng để:', answer: 'Minh họa số liệu', options: ['So sánh', 'Minh họa số liệu', 'Tính toán', 'Viết số'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a5', question: 'Nếu tổng là 40, chia làm 5 phần bằng nhau thì mỗi phần là:', answer: '8', options: ['5', '6', '7', '8'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a6', question: 'Một tổ có 5 bạn cao: 130cm, 135cm, 140cm, 145cm, 150cm. Chiều cao trung bình là:', answer: '140 cm', options: ['135 cm', '140 cm', '145 cm', '130 cm'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a7', question: 'Biểu đồ cột giúp chúng ta thực hiện việc gì dễ dàng nhất?', answer: 'So sánh các số liệu', options: ['Đếm số', 'So sánh các số liệu', 'Nhân số', 'Chia số'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a8', question: 'Cửa hàng ngày đầu bán 20 quả, ngày sau 30 quả, ngày cuối 40 quả. Trung bình mỗi ngày bán:', answer: '30 quả', options: ['25 quả', '30 quả', '35 quả', '40 quả'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a9', question: 'Bảng số liệu: Giỏi 15 bạn, Khá 20 bạn. Tổng số học sinh giỏi và khá là:', answer: '35 bạn', options: ['30 bạn', '35 bạn', '40 bạn', '45 bạn'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
  { id: 'g5sc-a10', question: 'Số trung bình cộng của 10, 20, 30, 40 là:', answer: '25', options: ['20', '25', '30', '15'], difficulty: 'easy', topic: 'Thống kê & Biểu đồ' },
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
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_QUIZ_QUESTIONS_G2;
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
      } else if (selectedTopic?.title === 'Các số đến 1000') {
        questions = FIXED_NUMBERS_TO_1000_ESSAY_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_ESSAY_QUESTIONS_G2;
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
      } else if (selectedTopic?.title === 'Các số đến 1000') {
        questions = FIXED_NUMBERS_TO_1000_APP_QUESTIONS_G2;
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_APP_QUESTIONS_G2;
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

    // Check if it's the fixed quiz for Grade 3 "Thử sức"
    if (user.grade === 3 && (topic.toUpperCase().includes("THỬ SỨC") || topic.toUpperCase().includes("TRẮC NGHIỆM"))) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Bảng nhân chia') {
        questions = FIXED_REVIEW_MULT_DIV_QUIZ_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Hình học & Khối') {
        questions = FIXED_GEOMETRY_SOLIDS_QUIZ_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Nhân chia (100, 1000)') {
        questions = FIXED_MULT_DIV_100_1000_QUIZ_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Đơn vị đo lường') {
        questions = FIXED_MEASUREMENT_QUIZ_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Số đến 100 000') {
        questions = FIXED_NUMBERS_TO_100000_QUIZ_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Chu vi & Diện tích') {
        questions = FIXED_PERIMETER_AREA_QUIZ_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Thời gian & Tiền tệ') {
        questions = FIXED_TIME_MONEY_QUIZ_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_QUIZ_QUESTIONS_G3;
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

    // Check if it's the fixed quiz for Grade 4 "Thử sức"
    if (user.grade === 4 && (topic.toUpperCase().includes("THỬ SỨC") || topic.toUpperCase().includes("TRẮC NGHIỆM"))) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Số đến 100 000') {
        questions = FIXED_NUMBERS_TO_100000_QUIZ_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Góc & Hình học') {
        questions = FIXED_GEOMETRY_ANGLES_QUIZ_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Số có nhiều chữ số') {
        questions = FIXED_MANY_DIGIT_NUMBERS_QUIZ_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Đơn vị đo đại lượng') {
        questions = FIXED_MEASUREMENT_UNITS_QUIZ_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Cộng, trừ, nhân, chia') {
        questions = FIXED_ARITHMETIC_QUIZ_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Hình bình hành & Thoi') {
        questions = FIXED_PARALLELOGRAM_RHOMBUS_QUIZ_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Phân số') {
        questions = FIXED_FRACTIONS_QUIZ_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_QUIZ_QUESTIONS_G4;
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

    // Check if it's the fixed application for Grade 4 "Ứng dụng"
    if (user.grade === 4 && topic.toUpperCase().includes("ỨNG DỤNG")) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Số đến 100 000') {
        questions = FIXED_NUMBERS_TO_100000_APP_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Góc & Hình học') {
        questions = FIXED_GEOMETRY_ANGLES_APP_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Số có nhiều chữ số') {
        questions = FIXED_MANY_DIGIT_NUMBERS_APP_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Đơn vị đo đại lượng') {
        questions = FIXED_MEASUREMENT_UNITS_APP_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Cộng, trừ, nhân, chia') {
        questions = FIXED_ARITHMETIC_APP_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Hình bình hành & Thoi') {
        questions = FIXED_PARALLELOGRAM_RHOMBUS_APP_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Phân số') {
        questions = FIXED_FRACTIONS_APP_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_APP_QUESTIONS_G4;
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

    // Check if it's the fixed quiz for Grade 5 "Thử sức"
    if (user.grade === 5 && (topic.toUpperCase().includes("THỬ SỨC") || topic.toUpperCase().includes("TRẮC NGHIỆM"))) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập phân số & Hỗn số') {
        questions = FIXED_FRACTIONS_MIXED_QUIZ_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Số thập phân') {
        questions = FIXED_DECIMALS_QUIZ_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Cộng, trừ số thập phân') {
        questions = FIXED_ADD_SUB_DECIMALS_QUIZ_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Nhân, chia số thập phân') {
        questions = FIXED_MULT_DIV_DECIMALS_QUIZ_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Hình học phẳng') {
        questions = FIXED_PLANE_GEOMETRY_QUIZ_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Hình khối & Thể tích') {
        questions = FIXED_SOLID_GEOMETRY_QUIZ_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Chuyển động đều') {
        questions = FIXED_UNIFORM_MOTION_QUIZ_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Thống kê & Biểu đồ') {
        questions = FIXED_STATISTICS_CHARTS_QUIZ_QUESTIONS_G5;
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

    // Check if it's the fixed essay for Grade 5 "Tự luận"
    if (user.grade === 5 && topic.toUpperCase().includes("TỰ LUẬN")) {
      setIsFunPlayMode(true);
      setIsQuizMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setEssayAnswer('');
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập phân số & Hỗn số') {
        questions = FIXED_FRACTIONS_MIXED_ESSAY_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Số thập phân') {
        questions = FIXED_DECIMALS_ESSAY_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Cộng, trừ số thập phân') {
        questions = FIXED_ADD_SUB_DECIMALS_ESSAY_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Nhân, chia số thập phân') {
        questions = FIXED_MULT_DIV_DECIMALS_ESSAY_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Hình học phẳng') {
        questions = FIXED_PLANE_GEOMETRY_ESSAY_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Hình khối & Thể tích') {
        questions = FIXED_SOLID_GEOMETRY_ESSAY_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Chuyển động đều') {
        questions = FIXED_UNIFORM_MOTION_ESSAY_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Thống kê & Biểu đồ') {
        questions = FIXED_STATISTICS_CHARTS_ESSAY_QUESTIONS_G5;
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

    // Check if it's the fixed application for Grade 5 "Ứng dụng"
    if (user.grade === 5 && topic.toUpperCase().includes("ỨNG DỤNG")) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập phân số & Hỗn số') {
        questions = FIXED_FRACTIONS_MIXED_APP_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Số thập phân') {
        questions = FIXED_DECIMALS_APP_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Cộng, trừ số thập phân') {
        questions = FIXED_ADD_SUB_DECIMALS_APP_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Nhân, chia số thập phân') {
        questions = FIXED_MULT_DIV_DECIMALS_APP_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Hình học phẳng') {
        questions = FIXED_PLANE_GEOMETRY_APP_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Hình khối & Thể tích') {
        questions = FIXED_SOLID_GEOMETRY_APP_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Chuyển động đều') {
        questions = FIXED_UNIFORM_MOTION_APP_QUESTIONS_G5;
      } else if (selectedTopic?.title === 'Thống kê & Biểu đồ') {
        questions = FIXED_STATISTICS_CHARTS_APP_QUESTIONS_G5;
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
    if (user.grade === 3 && topic.toUpperCase().includes("TỰ LUẬN")) {
      setIsFunPlayMode(true);
      setIsQuizMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setEssayAnswer('');
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Bảng nhân chia') {
        questions = FIXED_REVIEW_MULT_DIV_ESSAY_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Hình học & Khối') {
        questions = FIXED_GEOMETRY_SOLIDS_ESSAY_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Nhân chia (100, 1000)') {
        questions = FIXED_MULT_DIV_100_1000_ESSAY_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Đơn vị đo lường') {
        questions = FIXED_MEASUREMENT_ESSAY_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Số đến 100 000') {
        questions = FIXED_NUMBERS_TO_100000_ESSAY_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Chu vi & Diện tích') {
        questions = FIXED_PERIMETER_AREA_ESSAY_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Thời gian & Tiền tệ') {
        questions = FIXED_TIME_MONEY_ESSAY_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_ESSAY_QUESTIONS_G3;
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

    // Check if it's the fixed essay for Grade 4 "Tự luận"
    if (user.grade === 4 && topic.toUpperCase().includes("TỰ LUẬN")) {
      setIsFunPlayMode(true);
      setIsQuizMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setEssayAnswer('');
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Số đến 100 000') {
        questions = FIXED_NUMBERS_TO_100000_ESSAY_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Góc & Hình học') {
        questions = FIXED_GEOMETRY_ANGLES_ESSAY_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Số có nhiều chữ số') {
        questions = FIXED_MANY_DIGIT_NUMBERS_ESSAY_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Đơn vị đo đại lượng') {
        questions = FIXED_MEASUREMENT_UNITS_ESSAY_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Cộng, trừ, nhân, chia') {
        questions = FIXED_ARITHMETIC_ESSAY_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Hình bình hành & Thoi') {
        questions = FIXED_PARALLELOGRAM_RHOMBUS_ESSAY_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Phân số') {
        questions = FIXED_FRACTIONS_ESSAY_QUESTIONS_G4;
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_ESSAY_QUESTIONS_G4;
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

    // Check if it's the fixed application for Grade 3 "Ứng dụng"
    if (user.grade === 3 && topic.toUpperCase().includes("ỨNG DỤNG")) {
      setIsQuizMode(true);
      setIsFunPlayMode(false);
      setIsConquerMode(false);
      setQuizIndex(0);
      setQuizScore(0);
      setTimeLeft(20);
      let questions: MathProblem[] = [];
      if (selectedTopic?.title === 'Ôn tập & Bảng nhân chia') {
        questions = FIXED_REVIEW_MULT_DIV_APP_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Hình học & Khối') {
        questions = FIXED_GEOMETRY_SOLIDS_APP_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Nhân chia (100, 1000)') {
        questions = FIXED_MULT_DIV_100_1000_APP_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Đơn vị đo lường') {
        questions = FIXED_MEASUREMENT_APP_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Số đến 100 000') {
        questions = FIXED_NUMBERS_TO_100000_APP_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Chu vi & Diện tích') {
        questions = FIXED_PERIMETER_AREA_APP_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Thời gian & Tiền tệ') {
        questions = FIXED_TIME_MONEY_APP_QUESTIONS_G3;
      } else if (selectedTopic?.title === 'Thống kê & Xác suất') {
        questions = FIXED_STATISTICS_PROBABILITY_APP_QUESTIONS_G3;
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
      } else if (currentProblem.id === 'g5f-e1') { // Viết 3 phân số lớn hơn 1
        const parts = cleanInput.split(/[,;\s]+/).filter(s => s !== '');
        correct = parts.length >= 3 && parts.every(p => {
          if (p.includes('/')) {
            const [num, den] = p.split('/').map(s => parseInt(s));
            return !isNaN(num) && !isNaN(den) && den !== 0 && num > den;
          }
          return false;
        });
      } else if (currentProblem.id === 'g5f-e4') { // So sánh 3/4 và 2/3
        correct = cleanInput.includes('>') || cleanInput.includes('lớnhơn') || (cleanInput.includes('3/4') && cleanInput.includes('2/3') && cleanInput.indexOf('3/4') < cleanInput.indexOf('2/3') && cleanInput.includes('>'));
        // Basic check for common ways to express it
        if (!correct) {
          correct = cleanInput === '3/4>2/3' || cleanInput === '2/3<3/4';
        }
      } else if (currentProblem.id === 'g5d-e4') { // So sánh: 0,75 và 0,8
        correct = cleanInput.includes('<') || cleanInput.includes('béhơn') || (cleanInput.includes('0,75') && cleanInput.includes('0,8') && cleanInput.indexOf('0,75') < cleanInput.indexOf('0,8') && cleanInput.includes('<'));
        if (!correct) {
          correct = cleanInput === '0,75<0,8' || cleanInput === '0,8>0,75';
        }
      } else if (currentProblem.id === 'g5d-e5') { // 1,5 - 0,5 = 1
        correct = cleanInput === '1' || cleanInput === '1,0' || cleanInput === '1l' || cleanInput === '1lít';
      } else if (currentProblem.id === 'g5d-e10') { // Sắp xếp decimals
        const parts = cleanInput.split(/[,;\s]+/).filter(s => s !== '');
        correct = parts.length === 3 && parts[0].includes('0,2') && parts[1].includes('0,5') && parts[2].includes('0,8');
      } else if (currentProblem.id === 'g5as-e3') { // 1,3 lít
        correct = cleanInput === '1,3' || cleanInput === '1,3lít' || cleanInput === '1,3l';
      } else if (currentProblem.id === 'g5as-e5') { // 6,25 kg
        correct = cleanInput === '6,25' || cleanInput === '6,25kg';
      } else if (currentProblem.id === 'g5as-e8') { // 3,4 m
        correct = cleanInput === '3,4' || cleanInput === '3,4m' || cleanInput === '3,4mét';
      } else if (currentProblem.id === 'g5as-e10') { // 13 cm
        correct = cleanInput === '13' || cleanInput === '13cm';
      } else if (currentProblem.id === 'g5md-e3') { // 6 lít
        correct = cleanInput === '6' || cleanInput === '6lít' || cleanInput === '6l';
      } else if (currentProblem.id === 'g5md-e5') { // 2,1 m
        correct = cleanInput === '2,1' || cleanInput === '2,1m' || cleanInput === '2,1mét';
      } else if (currentProblem.id === 'g5md-e8') { // 9 m2
        correct = cleanInput === '9' || cleanInput === '9m2' || cleanInput === '9métvuông';
      } else if (currentProblem.id === 'g5pg-e1') { // 45 cm2
        correct = cleanInput === '45' || cleanInput === '45cm2' || cleanInput === '45métvuông' || cleanInput.includes('45');
      } else if (currentProblem.id === 'g5pg-e2') { // 28 cm
        correct = cleanInput === '28' || cleanInput === '28cm';
      } else if (currentProblem.id === 'g5pg-e3') { // 6 cm
        correct = cleanInput === '6' || cleanInput === '6cm';
      } else if (currentProblem.id === 'g5pg-e4') { // 46 m & 120 m2
        correct = cleanInput.includes('46') && cleanInput.includes('120');
      } else if (currentProblem.id === 'g5pg-e5') { // 108 cm2
        correct = cleanInput === '108' || cleanInput === '108cm2';
      } else if (currentProblem.id === 'g5sg-e1') { // 343 cm3
        correct = cleanInput === '343' || cleanInput === '343cm3' || cleanInput === '343cm³';
      } else if (currentProblem.id === 'g5sg-e2') { // 120 cm3
        correct = cleanInput === '120' || cleanInput === '120cm3' || cleanInput === '120cm³';
      } else if (currentProblem.id === 'g5sg-e3') { // 120 dm3
        correct = cleanInput === '120' || cleanInput === '120dm3' || cleanInput === '120dm³';
      } else if (currentProblem.id === 'g5sg-e7') { // 2000 lít
        correct = cleanInput === '2000' || cleanInput === '2000lít' || cleanInput === '2000l';
      } else if (currentProblem.id === 'g5um-e1') { // 40 km/h
        correct = cleanInput === '40' || cleanInput === '40km/h' || cleanInput === '40km/giờ';
      } else if (currentProblem.id === 'g5um-e2') { // 125 km
        correct = cleanInput === '125' || cleanInput === '125km';
      } else if (currentProblem.id === 'g5um-e3') { // 2 giờ
        correct = cleanInput === '2' || cleanInput === '2giờ' || cleanInput === '2g';
      } else if (currentProblem.id === 'g5um-e4') { // 90 km
        correct = cleanInput === '90' || cleanInput === '90km';
      } else if (currentProblem.id === 'g5um-e5') { // 60 km/h
        correct = cleanInput === '60' || cleanInput === '60km/h' || cleanInput === '60km/giờ';
      } else if (currentProblem.id === 'g5um-e10') { // 60 km/h
        correct = cleanInput === '60' || cleanInput === '60km/h' || cleanInput === '60km/giờ';
      } else if (currentProblem.id === 'g5sc-e1') { // 6 và 35
        correct = cleanInput.includes('6') && cleanInput.includes('35');
      } else if (currentProblem.id === 'g5sc-e2') { // 30 và đá bóng
        correct = cleanInput.includes('30') && (cleanInput.includes('đábóng') || cleanInput.includes('dabong'));
      } else if (currentProblem.id === 'g3spe-2' || currentProblem.id === 'g3spe-9') { // Sấp, ngửa
        correct = cleanInput.includes('sấp') && cleanInput.includes('ngửa');
      } else if (currentProblem.id === 'g3spe-6') { // 1, 2, 3, 4, 5, 6
        correct = ['1', '2', '3', '4', '5', '6'].every(s => cleanInput.includes(s));
      } else if (currentProblem.id === 'g3spe-7') { // Vì kết quả ngẫu nhiên
        correct = cleanInput.includes('ngẫunhiên') || cleanInput.includes('khôngbiếttrước');
      } else if (currentProblem.id === 'g5sc-e4') { // 30 và 6
        correct = cleanInput.includes('30') && cleanInput.includes('6');
      } else if (currentProblem.id === 'g5sc-e9') { // 40 và 8
        correct = cleanInput.includes('40') && cleanInput.includes('8');
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

