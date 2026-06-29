export type DashboardQuizStatus = "active" | "draft" | "published";

export interface DashboardStatDto {
  id: string;
  label: string;
  value: string;
  trend: string;
}

export interface DashboardQuizDto {
  id: string;
  title: string;
  description: string;
  category: string;
  status: DashboardQuizStatus;
  questionsCount: number;
  durationMinutes: number;
}

export interface OrganizerDashboardDto {
  stats: DashboardStatDto[];
  quizzes: DashboardQuizDto[];
}

const mockedDashboard: OrganizerDashboardDto = {
  stats: [
    { id: "total-quizzes", label: "Всего квизов", value: "12", trend: "+2 за месяц" },
    { id: "completed-sessions", label: "Завершенные сессии", value: "48", trend: "+15% к прошлому месяцу" },
    { id: "participants", label: "Участники", value: "856", trend: "+124 новых" },
    { id: "average-score", label: "Средний балл", value: "74%", trend: "Стабильно" },
  ],
  quizzes: [
    {
      id: "ancient-rome",
      title: "История Древнего Рима",
      description: "Охватывает период от основания города до падения Западной Римской империи.",
      category: "История",
      status: "published",
      questionsCount: 25,
      durationMinutes: 30,
    },
    {
      id: "astronomy-basics",
      title: "Основы астрономии",
      description: "Базовые знания о Солнечной системе, звездах и галактиках.",
      category: "Наука",
      status: "draft",
      questionsCount: 15,
      durationMinutes: 20,
    },
    {
      id: "russian-classics",
      title: "Русская классика XIX века",
      description: "Вопросы по произведениям Пушкина, Толстого, Достоевского.",
      category: "Литература",
      status: "active",
      questionsCount: 30,
      durationMinutes: 45,
    },
  ],
};

export const organizerDashboardService = {
  getDashboard: async (): Promise<OrganizerDashboardDto> => mockedDashboard,
};
