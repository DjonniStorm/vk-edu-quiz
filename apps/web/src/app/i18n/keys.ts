export const LANG_KEYS = {
  app: {
    name: "app.name",
  },
  common: {
    loading: "common.loading",
    error: "common.error",
    retry: "common.retry",
    save: "common.save",
    cancel: "common.cancel",
    delete: "common.delete",
    back: "common.back",
    next: "common.next",
  },
  auth: {
    login: "auth.login",
    register: "auth.register",
    logout: "auth.logout",
    fields: {
      email: "auth.fields.email",
      password: "auth.fields.password",
      name: "auth.fields.name",
    },
    placeholders: {
      email: "auth.placeholders.email",
      password: "auth.placeholders.password",
      name: "auth.placeholders.name",
    },
  },
  roles: {
    user: "roles.user",
    admin: "roles.admin",
  },
  pages: {
    login: {
      title: "pages.login.title",
      subtitle: "pages.login.subtitle",
      footerText: "pages.login.footerText",
      footerLinkText: "pages.login.footerLinkText",
      submit: "pages.login.submit",
    },
    register: {
      title: "pages.register.title",
      subtitle: "pages.register.subtitle",
      footerText: "pages.register.footerText",
      footerLinkText: "pages.register.footerLinkText",
      submit: "pages.register.submit",
    },
    organizerDashboard: {
      title: "pages.organizerDashboard.title",
      groupTitle: "pages.organizerDashboard.groupTitle",
      groupSubtitle: "pages.organizerDashboard.groupSubtitle",
      viewAll: "pages.organizerDashboard.viewAll",
      stats: {
        totalQuizzes: {
          label: "pages.organizerDashboard.stats.totalQuizzes.label",
          trend: "pages.organizerDashboard.stats.totalQuizzes.trend",
        },
        completedSessions: {
          label: "pages.organizerDashboard.stats.completedSessions.label",
          trend: "pages.organizerDashboard.stats.completedSessions.trend",
        },
        participants: {
          label: "pages.organizerDashboard.stats.participants.label",
          trend: "pages.organizerDashboard.stats.participants.trend",
        },
        averageScore: {
          label: "pages.organizerDashboard.stats.averageScore.label",
          trend: "pages.organizerDashboard.stats.averageScore.trend",
        },
      },
    },
  },
  layout: {
    app: {
      brand: "layout.app.brand",
      bell: "layout.app.bell",
      createQuiz: "layout.app.createQuiz",
      exit: "layout.app.exit",
      fallbackUser: "layout.app.fallbackUser",
      nav: {
        dashboard: "layout.app.nav.dashboard",
        myQuizzes: "layout.app.nav.myQuizzes",
        createQuiz: "layout.app.nav.createQuiz",
        activeRooms: "layout.app.nav.activeRooms",
        results: "layout.app.nav.results",
      },
    },
  },
  quizzes: {
    title: "quizzes.title",
    create: "quizzes.create",
    empty: "quizzes.empty",
    status: {
      active: "quizzes.status.active",
      draft: "quizzes.status.draft",
      published: "quizzes.status.published",
    },
    actions: {
      finish: "quizzes.actions.finish",
      room: "quizzes.actions.room",
      continue: "quizzes.actions.continue",
      start: "quizzes.actions.start",
      edit: "quizzes.actions.edit",
      results: "quizzes.actions.results",
    },
    meta: {
      questions: "quizzes.meta.questions",
      minutes: "quizzes.meta.minutes",
    },
  },
  rooms: {
    join: "rooms.join",
    start: "rooms.start",
    finish: "rooms.finish",
    leaderboard: "rooms.leaderboard",
  },
} as const;

type NestedStringValues<T> = T extends string
  ? T
  : { [K in keyof T]: NestedStringValues<T[K]> }[keyof T];

export type LangKey = NestedStringValues<typeof LANG_KEYS>;

export const DASHBOARD_STAT_KEYS = {
  "total-quizzes": LANG_KEYS.pages.organizerDashboard.stats.totalQuizzes,
  "completed-sessions": LANG_KEYS.pages.organizerDashboard.stats.completedSessions,
  participants: LANG_KEYS.pages.organizerDashboard.stats.participants,
  "average-score": LANG_KEYS.pages.organizerDashboard.stats.averageScore,
} as const;
