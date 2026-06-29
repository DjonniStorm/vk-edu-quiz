import { makeAutoObservable, runInAction } from "mobx";

import { errorStore } from "@/entities/error";
import { isCancelError } from "@/shared/api";
import {
  organizerDashboardService,
  type DashboardQuizDto,
  type DashboardStatDto,
} from "@/shared/services";

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
      const dashboard = await organizerDashboardService.getDashboard();

      runInAction(() => {
        this.stats = dashboard.stats;
        this.quizzes = dashboard.quizzes;
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.pushFromUnknown(error, "Не удалось загрузить дашборд");
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}

export const organizerDashboardStore = new OrganizerDashboardStore();
