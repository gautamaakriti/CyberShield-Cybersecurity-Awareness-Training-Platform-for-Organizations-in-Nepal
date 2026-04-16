export interface Admin {
  id: number;
  email: string;
  full_name: string;
}

export interface TrainingModule {
  id: number;
  title: string;
  description: string;
  video_url: string;
  video_duration_seconds: number;
  thumbnail_url?: string;
  pass_threshold: number;
  is_active: boolean;
  created_at: string;
  quiz?: Quiz;
}

export interface Quiz {
  id: number;
  module_id: number;
  title: string;
  questions: Question[];
}

export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  order_index: number;
}

export interface Employee {
  id: number;
  full_name: string;
  email: string;
  department: string;
  organization: string;
  is_active: boolean;
  created_at: string;
}

export interface TrainingLink {
  id: number;
  token: string;
  employee_id: number;
  module_id: number;
  is_used: boolean;
  created_at: string;
  employee?: Employee;
  module?: TrainingModule;
}

export interface TrainingProgress {
  id: number;
  employee_id: number;
  module_id: number;
  status: 'not_started' | 'watching' | 'quiz_pending' | 'passed' | 'failed';
  video_watched: boolean;
  attempts: number;
  best_score: number;
  completed_at?: string;
  employee?: Employee;
  module?: TrainingModule;
}

export interface QuizAttempt {
  id: number;
  employee_id: number;
  quiz_id: number;
  score: number;
  passed: boolean;
  answers: Record<number, string>;
  attempted_at: string;
}

export interface DashboardStats {
  total_employees: number;
  total_modules: number;
  completion_rate: number;
  total_completions: number;
  failed_attempts: number;
  recent_completions: TrainingProgress[];
}