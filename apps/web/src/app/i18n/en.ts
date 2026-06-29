export const en = {
  app: {
    name: "VK Education Quiz",
  },
  common: {
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    back: "Back",
    next: "Next",
  },
  auth: {
    login: "Log in",
    register: "Sign up",
    logout: "Log out",
    fields: {
      email: "Email",
      password: "Password",
      name: "Name",
    },
    placeholders: {
      email: "user@example.com",
      password: "Password",
      name: "Alex O.",
    },
  },
  roles: {
    user: "User",
    admin: "Admin",
  },
  pages: {
    login: {
      title: "Log in",
      subtitle: "Use your account to open the organizer dashboard.",
      footerText: "No account yet?",
      footerLinkText: "Create one",
      submit: "Log in",
    },
    register: {
      title: "Create account",
      subtitle: "Sign up to create quizzes and run live sessions.",
      footerText: "Already have an account?",
      footerLinkText: "Log in",
      submit: "Create account",
    },
    organizerDashboard: {
      title: "Organizer dashboard",
      groupTitle: "My quizzes",
      groupSubtitle: "Recent quizzes and live rooms",
      viewAll: "View all",
      stats: {
        totalQuizzes: {
          label: "Total quizzes",
          trend: "+2 this month",
        },
        completedSessions: {
          label: "Completed sessions",
          trend: "+15% vs last month",
        },
        participants: {
          label: "Participants",
          trend: "+124 new",
        },
        averageScore: {
          label: "Average score",
          trend: "Stable",
        },
      },
    },
    quizCreate: {
      title: "Create quiz",
      subtitle: "Configure your new assessment session.",
      saveDraft: "Save draft",
      steps: {
        basicInfo: "Basic information",
        questions: "Questions",
        rules: "Rules",
        review: "Review",
      },
      basicInfo: {
        title: "Quiz title",
        description: "Description",
        category: "Category",
        titlePlaceholder: "Ancient Rome History",
        descriptionPlaceholder: "Brief description of the quiz",
        categoryPlaceholder: "History",
      },
      questions: {
        listTitle: "Questions ({{count}})",
        addQuestion: "Add question",
        editTitle: "Edit question {{number}}",
        questionText: "Question text",
        answerMode: "Answer type",
        answerOptions: "Answer options",
        addOption: "Add another option",
        addOptionPlaceholder: "Add option...",
        timeLimit: "Time limit",
        points: "Points",
        emptyPreview: "Empty question",
        answerModeLabels: {
          single: "Single choice",
          multiple: "Multiple choice",
        },
      },
      rules: {
        title: "Session rules",
        showLeaderboard: "Show leaderboard after each question",
        showLeaderboardDescription: "Participants see rankings after every question.",
        allowLateJoin: "Allow late join",
        allowLateJoinDescription: "New participants can join after the session starts.",
      },
      review: {
        title: "Review and publish",
        basicInfo: "Basic information",
        questions: "Questions",
        rules: "Rules",
        questionsCount: "{{count}} questions",
        enabled: "Enabled",
        disabled: "Disabled",
      },
      footer: {
        back: "Back",
        nextToQuestions: "Next: Questions",
        nextToRules: "Next: Rules",
        nextToReview: "Next: Review",
        publish: "Publish quiz",
      },
      validation: {
        titleRequired: "Enter a quiz title",
        questionsRequired: "Add at least one question",
        questionInvalid: "Check question {{number}}",
        correctAnswerRequired: "Select a correct answer for question {{number}}",
        singleCorrectRequired: "Single choice question {{number}} must have exactly one correct answer",
        questionsIncomplete: "Complete all questions before saving, or clear incomplete answers",
      },
      notifications: {
        draftSaved: "Draft saved",
        metadataSaved: "Draft metadata saved",
        published: "Quiz published",
        saveFailed: "Failed to save draft",
        publishFailed: "Failed to publish quiz",
      },
    },
  },
  layout: {
    app: {
      brand: "QuizRoom",
      bell: "Bell",
      createQuiz: "+ Create quiz",
      exit: "Exit",
      fallbackUser: "User",
      nav: {
        dashboard: "Dashboard",
        myQuizzes: "My quizzes",
        createQuiz: "Create quiz",
        activeRooms: "Active rooms",
        results: "Results",
      },
    },
  },
  quizzes: {
    title: "Quizzes",
    create: "Create quiz",
    empty: "No quizzes yet",
    status: {
      active: "Active",
      draft: "Draft",
      published: "Ready",
    },
    actions: {
      finish: "Finish",
      room: "Room",
      continue: "Continue",
      start: "Start",
      edit: "Edit",
      results: "Results",
    },
    meta: {
      questions: "{{count}} questions",
      minutes: "{{count}} min",
    },
  },
  rooms: {
    join: "Join",
    start: "Start",
    finish: "Finish",
    leaderboard: "Leaderboard",
  },
} as const;

type DeepStringify<T> = T extends string ? string : { [K in keyof T]: DeepStringify<T[K]> };

export type Translation = DeepStringify<typeof en>;
