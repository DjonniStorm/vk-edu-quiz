import type { OrganizerHistorySummaryDto } from "@quiz/shared";

import type { QuizListItemDto } from "@/shared/api";

import type { DashboardQuizDto, DashboardStatDto } from "@/shared/services";

export const mapQuizListItemToCard = (quiz: QuizListItemDto): DashboardQuizDto => ({
  id: quiz.id,
  title: quiz.title,
  description: quiz.description,
  category: quiz.category,
  status: quiz.status,
  questionsCount: quiz.questionsCount,
  durationMinutes: quiz.estimatedDurationMinutes,
  hasRooms: quiz.hasRooms,
});

export const buildDashboardStats = (
  quizzesTotal: number,
  summary: OrganizerHistorySummaryDto,
): DashboardStatDto[] => [
  { id: "total-quizzes", value: String(quizzesTotal) },
  { id: "completed-sessions", value: String(summary.completedSessions) },
  { id: "participants", value: String(summary.totalParticipants) },
  {
    id: "average-score",
    value:
      summary.completedSessions === 0 ? "—" : String(Math.round(summary.averageScore)),
  },
];
