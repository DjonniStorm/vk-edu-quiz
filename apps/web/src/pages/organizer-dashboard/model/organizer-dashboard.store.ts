import { makeAutoObservable, runInAction } from "mobx";

import { LANG_KEYS } from "@/app/i18n";
import i18n from "@/app/i18n";
import { errorStore } from "@/entities/error";
import { historyApi, isCancelError, quizzesApi } from "@/shared/api";
import type { DashboardQuizDto, DashboardStatDto } from "@/shared/services";

import {
  buildDashboardStats,
  mapQuizListItemToCard,
} from "./organizer-dashboard.mapper";

export class OrganizerDashboardStore {
  stats: DashboardStatDto[] = [];
  quizzes: DashboardQuizDto[] = [];
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async loadDashboard() {
    this.isLoading = true;

    try {
      const [quizzesPage, summary] = await Promise.all([
        quizzesApi.list({ limit: 20 }),
        historyApi.getOrganizerSummary(),
      ]);

      runInAction(() => {
        this.stats = buildDashboardStats(quizzesPage.total, summary);
        this.quizzes = quizzesPage.items.map(mapQuizListItemToCard);
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.pushFromUnknown(error, i18n.t(LANG_KEYS.pages.organizerDashboard.loadFailed));
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}

export const organizerDashboardStore = new OrganizerDashboardStore();
