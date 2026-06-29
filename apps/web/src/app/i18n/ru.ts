import type { Translation } from "./en";

export const ru: Translation = {
  app: {
    name: "VK Education Quiz",
  },
  common: {
    loading: "Загрузка...",
    error: "Ошибка",
    retry: "Повторить",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    back: "Назад",
    next: "Далее",
  },
  auth: {
    login: "Войти",
    register: "Зарегистрироваться",
    logout: "Выйти",
    fields: {
      email: "Email",
      password: "Пароль",
      name: "Имя",
    },
    placeholders: {
      email: "user@example.com",
      password: "Пароль",
      name: "Алекс О.",
    },
  },
  roles: {
    user: "Пользователь",
    admin: "Администратор",
  },
  pages: {
    login: {
      title: "Вход",
      subtitle: "Войдите в аккаунт, чтобы открыть панель организатора.",
      footerText: "Ещё нет аккаунта?",
      footerLinkText: "Создать",
      submit: "Войти",
    },
    register: {
      title: "Создание аккаунта",
      subtitle: "Зарегистрируйтесь, чтобы создавать квизы и проводить сессии.",
      footerText: "Уже есть аккаунт?",
      footerLinkText: "Войти",
      submit: "Создать аккаунт",
    },
    organizerDashboard: {
      title: "Панель организатора",
      groupTitle: "Мои квизы",
      groupSubtitle: "Недавние квизы и активные комнаты",
      viewAll: "Смотреть все",
      stats: {
        totalQuizzes: {
          label: "Всего квизов",
          trend: "+2 за месяц",
        },
        completedSessions: {
          label: "Завершённые сессии",
          trend: "+15% к прошлому месяцу",
        },
        participants: {
          label: "Участники",
          trend: "+124 новых",
        },
        averageScore: {
          label: "Средний балл",
          trend: "Стабильно",
        },
      },
    },
  },
  layout: {
    app: {
      brand: "QuizRoom",
      bell: "Уведомления",
      createQuiz: "+ Создать квиз",
      exit: "Выйти",
      fallbackUser: "Пользователь",
      nav: {
        dashboard: "Дашборд",
        myQuizzes: "Мои квизы",
        createQuiz: "Создать квиз",
        activeRooms: "Активные комнаты",
        results: "Результаты",
      },
    },
  },
  quizzes: {
    title: "Квизы",
    create: "Создать квиз",
    empty: "Квизов пока нет",
    status: {
      active: "Активен",
      draft: "Черновик",
      published: "Готов",
    },
    actions: {
      finish: "Завершить",
      room: "Комната",
      continue: "Продолжить",
      start: "Запустить",
      edit: "Редактировать",
      results: "Результаты",
    },
    meta: {
      questions: "{{count}} вопросов",
      minutes: "{{count}} мин",
    },
  },
  rooms: {
    join: "Подключиться",
    start: "Запустить",
    finish: "Завершить",
    leaderboard: "Лидерборд",
  },
};
