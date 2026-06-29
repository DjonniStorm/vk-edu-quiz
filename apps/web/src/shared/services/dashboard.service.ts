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
    { id: "total-quizzes", label: "Total quizzes", value: "12", trend: "+2 this month" },
    { id: "completed-sessions", label: "Completed sessions", value: "48", trend: "+15% vs last month" },
    { id: "participants", label: "Participants", value: "856", trend: "+124 new" },
    { id: "average-score", label: "Average score", value: "74%", trend: "Stable" },
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
