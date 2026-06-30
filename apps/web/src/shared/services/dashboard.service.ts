import type { QuizStatus } from "@quiz/shared";

export interface DashboardStatDto {
  id: string;
  value: string;
  label?: string;
}

export interface DashboardQuizDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: QuizStatus;
  questionsCount: number;
  durationMinutes: number;
  hasRooms: boolean;
}

export interface OrganizerDashboardDto {
  stats: DashboardStatDto[];
  quizzes: DashboardQuizDto[];
}
