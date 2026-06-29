export type DashboardQuizStatus = "active" | "draft" | "published";

export interface DashboardStatDto {
  id: string;
  value: string;
  label?: string;
  trend?: string;
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
    { id: "total-quizzes", value: "12" },
    { id: "completed-sessions", value: "48" },
    { id: "participants", value: "856" },
    { id: "average-score", value: "74%" },
  ],
  quizzes: [
    {
      id: "ancient-rome",
      title: "Ancient Rome History",
      description: "Covers the period from the founding of Rome to the fall of the Western Empire.",
      category: "History",
      status: "published",
      questionsCount: 25,
      durationMinutes: 30,
    },
    {
      id: "astronomy-basics",
      title: "Astronomy Basics",
      description: "Basic knowledge about the Solar System, stars, and galaxies.",
      category: "Science",
      status: "draft",
      questionsCount: 15,
      durationMinutes: 20,
    },
    {
      id: "russian-classics",
      title: "19th Century Classics",
      description: "Questions about major novels, poems, and writers.",
      category: "Literature",
      status: "active",
      questionsCount: 30,
      durationMinutes: 45,
    },
  ],
};

export const organizerDashboardService = {
  getDashboard: async (): Promise<OrganizerDashboardDto> => mockedDashboard,
};
