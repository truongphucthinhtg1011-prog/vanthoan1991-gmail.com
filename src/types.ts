export type Grade = 1 | 2 | 3 | 4 | 5;

export interface UserProfile {
  name: string;
  grade: Grade;
  points: number;
  level: number;
  completedTopics: string[];
}

export interface MathProblem {
  id: string;
  question: string;
  answer: number | string;
  options: (number | string)[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export type AppState = 'onboarding' | 'dashboard' | 'topic_menu' | 'playing' | 'results' | 'goodbye' | 'quiz_results';

export type TopicSubState = 'learn' | 'practice' | 'game' | 'challenge';
