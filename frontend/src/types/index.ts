export type Admin = { id: number; email: string; full_name: string }
export type Question = { id: number; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string; order_index: number }
export type Quiz = { id: number; module_id: number; title: string; questions: Question[] }
export type TrainingModule = { id: number; title: string; description: string; video_url: string; video_duration_seconds: number; thumbnail_url?: string; pass_threshold: number; is_active: boolean; created_at: string; quiz?: Quiz }
export type Employee = { id: number; full_name: string; email: string; department: string; organization: string; is_active: boolean; created_at: string }
export type TrainingProgress = { id: number; employee_id: number; module_id: number; status: string; video_watched: boolean; attempts: number; best_score: number; completed_at?: string; employee?: Employee; module?: TrainingModule }
export type DashboardStats = { total_employees: number; total_modules: number; completion_rate: number; total_completions: number; failed_attempts: number; recent_completions: TrainingProgress[] }
