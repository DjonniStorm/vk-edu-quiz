import { QuizStatus } from "@quiz/shared";
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

const QUIZZES_PAGE_SIZE = 12;

export class OrganizerDashboardStore {
  stats: DashboardStatDto[] = [];
  quizzes: DashboardQuizDto[] = [];
  quizzesTotal = 0;
  filteredTotal = 0;
  search = "";
  statusFilter: QuizStatus | null = null;
  page = 1;
  readonly pageSize = QUIZZES_PAGE_SIZE;
  isLoading = false;
  isQuizzesLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTotal / this.pageSize));
  }

  get hasActiveFilters(): boolean {
    return this.search.trim().length > 0 || this.statusFilter !== null;
  }

  async loadDashboard() {
    this.isLoading = true;

    try {
      const [quizzesPage, summary] = await Promise.all([
        quizzesApi.list({ limit: 1 }),
        historyApi.getOrganizerSummary(),
      ]);

      runInAction(() => {
        this.quizzesTotal = quizzesPage.total;
        this.stats = buildDashboardStats(this.quizzesTotal, summary);
      });

      await this.loadQuizzes();
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

  async loadQuizzes() {
    this.isQuizzesLoading = true;

    const search = this.search.trim();

    try {
      const quizzesPage = await quizzesApi.list({
        limit: this.pageSize,
        offset: (this.page - 1) * this.pageSize,
        ...(search ? { search } : {}),
        ...(this.statusFilter ? { status: this.statusFilter } : {}),
      });

      runInAction(() => {
        this.filteredTotal = quizzesPage.total;
        this.quizzes = quizzesPage.items.map(mapQuizListItemToCard);
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.pushFromUnknown(error, i18n.t(LANG_KEYS.pages.organizerDashboard.loadFailed));
    } finally {
      runInAction(() => {
        this.isQuizzesLoading = false;
      });
    }
  }

  setSearch(value: string) {
    this.search = value;
    this.page = 1;
    void this.loadQuizzes();
  }

  setStatusFilter(value: QuizStatus | null) {
    this.statusFilter = value;
    this.page = 1;
    void this.loadQuizzes();
  }

  setPage(value: number) {
    this.page = value;
    void this.loadQuizzes();
  }

  resetFilters() {
    this.search = "";
    this.statusFilter = null;
    this.page = 1;
    void this.loadQuizzes();
  }
}

export const organizerDashboardStore = new OrganizerDashboardStore();
