import type { OrganizerRoomHistoryItemDto, RoomResultsDto } from "@quiz/shared";
import { makeAutoObservable, runInAction } from "mobx";

import { LANG_KEYS } from "@/app/i18n";
import i18n from "@/app/i18n";
import { errorStore } from "@/entities/error";
import { getApiErrorMessage, historyApi, isCancelError } from "@/shared/api";

export class QuizResultsStore {
  sessions: OrganizerRoomHistoryItemDto[] = [];
  sessionResults = new Map<string, RoomResultsDto>();
  loadingSessionIds = new Set<string>();
  isLoading = false;
  loadError: string | null = null;
  quizTitle: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  reset() {
    this.sessions = [];
    this.sessionResults.clear();
    this.loadingSessionIds.clear();
    this.isLoading = false;
    this.loadError = null;
    this.quizTitle = null;
  }

  async load(quizId: string) {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.loadError = null;
    this.sessions = [];
    this.sessionResults.clear();
    this.loadingSessionIds.clear();
    this.quizTitle = null;

    try {
      const page = await historyApi.listOrganizer({ limit: 100 });
      const sessions = page.items
        .filter((item) => item.quizId === quizId)
        .slice()
        .sort((a, b) => {
          const aTime = a.finishedAt ?? a.startedAt ?? "";
          const bTime = b.finishedAt ?? b.startedAt ?? "";
          return bTime.localeCompare(aTime);
        });

      runInAction(() => {
        this.sessions = sessions;
        this.quizTitle = sessions[0]?.quizTitle ?? null;
      });

      const preloadSessions = sessions.slice(0, 3);

      await Promise.all(preloadSessions.map((session) => this.loadSessionResults(session.roomId)));
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      runInAction(() => {
        this.loadError = getApiErrorMessage(error, i18n.t(LANG_KEYS.pages.quizResults.loadFailed));
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  getSessionResults(roomId: string): RoomResultsDto | undefined {
    return this.sessionResults.get(roomId);
  }

  isSessionLoading(roomId: string): boolean {
    return this.loadingSessionIds.has(roomId);
  }

  async loadSessionResults(roomId: string) {
    if (this.sessionResults.has(roomId) || this.loadingSessionIds.has(roomId)) {
      return;
    }

    this.loadingSessionIds.add(roomId);

    try {
      const results = await historyApi.getRoomResults(roomId);

      runInAction(() => {
        this.sessionResults.set(roomId, results);
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.pushFromUnknown(error, i18n.t(LANG_KEYS.pages.quizResults.sessionLoadFailed));
    } finally {
      runInAction(() => {
        this.loadingSessionIds.delete(roomId);
      });
    }
  }
}

export const quizResultsStore = new QuizResultsStore();
