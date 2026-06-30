import type { ParticipantQuizHistoryItemDto } from "@quiz/shared";
import { makeAutoObservable, runInAction } from "mobx";

import { LANG_KEYS } from "@/app/i18n";
import i18n from "@/app/i18n";
import { errorStore } from "@/entities/error";
import { historyApi, isCancelError } from "@/shared/api";

const HISTORY_PAGE_SIZE = 12;

export class ProfileStore {
  historyItems: ParticipantQuizHistoryItemDto[] = [];
  total = 0;
  page = 1;
  readonly pageSize = HISTORY_PAGE_SIZE;
  isLoading = false;
  loadError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  reset() {
    this.historyItems = [];
    this.total = 0;
    this.page = 1;
    this.isLoading = false;
    this.loadError = null;
  }

  async load() {
    this.isLoading = true;
    this.loadError = null;

    try {
      const page = await historyApi.listParticipant({
        limit: this.pageSize,
        offset: (this.page - 1) * this.pageSize,
      });

      runInAction(() => {
        this.historyItems = page.items;
        this.total = page.total;
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      runInAction(() => {
        this.loadError = i18n.t(LANG_KEYS.pages.profile.loadFailed);
      });

      errorStore.pushFromUnknown(error, i18n.t(LANG_KEYS.pages.profile.loadFailed));
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async setPage(page: number) {
    this.page = page;
    await this.load();
  }
}

export const profileStore = new ProfileStore();
