import type {
  LeaderboardItemDto,
  LiveQuestionDto,
  RoomSummaryDto,
} from "@quiz/shared";
import { RealtimeEventType, RoomStatus, AnswerMode } from "@quiz/shared";
import { makeAutoObservable, runInAction } from "mobx";

import { LANG_KEYS } from "@/app/i18n";
import i18n from "@/app/i18n";
import { buildRoomPlayPath } from "@/app/routes";
import { errorStore } from "@/entities/error";
import type { AnswerResultDto } from "@/shared/api";
import { getApiErrorMessage, isCancelError, quizzesApi, roomsApi } from "@/shared/api";

import type { RoomRealtimeEvent } from "./room-realtime";
import { roomRealtimeClient } from "./room-realtime";
import { roomSessionStorage } from "./room-session";

export type ParticipantPhase = "join" | "waiting" | "answering" | "submitted" | "finished";

export interface RoomQuestionMeta {
  id: string;
  orderIndex: number;
}

export class RoomStore {
  roomId: string | null = null;
  room: RoomSummaryDto | null = null;
  quizTitle = "";
  questions: RoomQuestionMeta[] = [];
  currentQuestion: LiveQuestionDto | null = null;
  leaderboard: LeaderboardItemDto[] = [];
  joinedCount = 0;
  answeredCount = 0;
  wsConnected = false;
  isLoading = false;
  loadError: string | null = null;
  isActionPending = false;

  roomParticipantId: string | null = null;
  displayName = "";
  phase: ParticipantPhase = "join";
  selectedOptionIds: string[] = [];
  lastAnswerResult: AnswerResultDto | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get inviteUrl(): string {
    if (!this.roomId) {
      return "";
    }

    return `${window.location.origin}${buildRoomPlayPath(this.roomId)}`;
  }

  get currentQuestionNumber(): number {
    if (!this.currentQuestion) {
      return 0;
    }

    const index = this.questions.findIndex((question) => question.id === this.currentQuestion?.id);

    return index >= 0 ? index + 1 : this.currentQuestion.orderIndex + 1;
  }

  get totalQuestions(): number {
    return this.questions.length;
  }

  get topLeaderboard(): LeaderboardItemDto[] {
    return this.leaderboard.slice(0, 3);
  }

  get isLive(): boolean {
    return this.room?.status === RoomStatus.Active;
  }

  get isWaiting(): boolean {
    return this.room?.status === RoomStatus.Waiting;
  }

  get isFinished(): boolean {
    return this.room?.status === RoomStatus.Finished;
  }

  async initHost(roomId: string): Promise<boolean> {
    this.reset();
    this.roomId = roomId;
    this.isLoading = true;

    try {
      const room = await roomsApi.getRoom(roomId);

      if (!room) {
        runInAction(() => {
          this.loadError = i18n.t(LANG_KEYS.pages.room.errors.notFound);
        });

        return false;
      }

      const [quiz, leaderboard] = await Promise.all([
        quizzesApi.getQuiz(room.quizId),
        roomsApi.getLeaderboard(roomId),
      ]);

      runInAction(() => {
        this.room = room;
        this.quizTitle = quiz.title;
        this.questions = [...quiz.questions]
          .sort((left, right) => left.orderIndex - right.orderIndex)
          .map((question) => ({ id: question.id, orderIndex: question.orderIndex }));
        this.leaderboard = leaderboard;
        this.joinedCount = leaderboard.length;

        if (room.status === RoomStatus.Finished) {
          this.phase = "finished";
        }
      });

      this.connectRealtime("organizer");
      await this.syncActiveQuestionState();

      return true;
    } catch (error) {
      if (isCancelError(error)) {
        return false;
      }

      runInAction(() => {
        this.loadError = getApiErrorMessage(error, i18n.t(LANG_KEYS.pages.room.errors.loadFailed));
      });

      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async initPlay(roomId: string): Promise<boolean> {
    this.reset();
    this.roomId = roomId;
    this.isLoading = true;

    try {
      const room = await roomsApi.getRoom(roomId);

      if (!room) {
        runInAction(() => {
          this.loadError = i18n.t(LANG_KEYS.pages.room.errors.notFound);
        });

        return false;
      }

      const session = roomSessionStorage.get(roomId);

      runInAction(() => {
        this.room = room;

        if (room.status === RoomStatus.Finished) {
          this.phase = "finished";
        } else if (session) {
          this.roomParticipantId = session.roomParticipantId;
          this.displayName = session.displayName;
          this.phase = "waiting";
        } else {
          this.phase = "join";
        }
      });

      if (session) {
        this.connectRealtime("participant", session.roomParticipantId);

        if (room.status === RoomStatus.Active) {
          await this.syncActiveQuestionState(session.roomParticipantId);
        }
      }

      if (room.status === RoomStatus.Finished) {
        const leaderboard = await roomsApi.getLeaderboard(roomId);

        runInAction(() => {
          this.leaderboard = leaderboard;
        });
      }

      return true;
    } catch (error) {
      if (isCancelError(error)) {
        return false;
      }

      runInAction(() => {
        this.loadError = getApiErrorMessage(error, i18n.t(LANG_KEYS.pages.room.errors.loadFailed));
      });

      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  dispose(): void {
    roomRealtimeClient.disconnect();

    runInAction(() => {
      this.wsConnected = false;
    });
  }

  reset(): void {
    this.roomId = null;
    this.room = null;
    this.quizTitle = "";
    this.questions = [];
    this.currentQuestion = null;
    this.leaderboard = [];
    this.joinedCount = 0;
    this.answeredCount = 0;
    this.wsConnected = false;
    this.isLoading = false;
    this.loadError = null;
    this.isActionPending = false;
    this.roomParticipantId = null;
    this.displayName = "";
    this.phase = "join";
    this.selectedOptionIds = [];
    this.lastAnswerResult = null;
  }

  async join(displayName: string): Promise<boolean> {
    if (!this.roomId) {
      return false;
    }

    this.isActionPending = true;

    try {
      const participant = await roomsApi.join(this.roomId, {
        displayName: displayName.trim(),
      });

      roomSessionStorage.set(this.roomId, {
        roomParticipantId: participant.id,
        displayName: participant.displayName,
      });

      runInAction(() => {
        this.roomParticipantId = participant.id;
        this.displayName = participant.displayName;
        this.phase = "waiting";
      });

      this.connectRealtime("participant", participant.id);

      if (this.room?.status === RoomStatus.Active) {
        await this.syncActiveQuestionState(participant.id);
      }

      return true;
    } catch (error) {
      if (isCancelError(error)) {
        return false;
      }

      errorStore.push(
        getApiErrorMessage(error, i18n.t(LANG_KEYS.pages.room.errors.joinFailed)),
      );

      return false;
    } finally {
      runInAction(() => {
        this.isActionPending = false;
      });
    }
  }

  toggleOption(optionId: string, answerMode: LiveQuestionDto["answerMode"]): void {
    if (this.phase !== "answering") {
      return;
    }

    if (answerMode === AnswerMode.Single) {
      this.selectedOptionIds = [optionId];
      return;
    }

    if (this.selectedOptionIds.includes(optionId)) {
      this.selectedOptionIds = this.selectedOptionIds.filter((id) => id !== optionId);
      return;
    }

    this.selectedOptionIds = [...this.selectedOptionIds, optionId];
  }

  async submitAnswer(): Promise<void> {
    if (!this.roomId || !this.roomParticipantId || !this.currentQuestion || this.isActionPending) {
      return;
    }

    if (this.selectedOptionIds.length === 0) {
      return;
    }

    this.isActionPending = true;

    const answerTimeMs = Math.max(
      0,
      Date.now() - new Date(this.currentQuestion.startedAt).getTime(),
    );

    try {
      const result = await roomsApi.submitAnswer(this.roomId, {
        roomParticipantId: this.roomParticipantId,
        questionId: this.currentQuestion.id,
        answerOptionIds: this.selectedOptionIds,
        answerTimeMs,
      });

      runInAction(() => {
        this.lastAnswerResult = result;
        this.phase = "submitted";
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.push(
        getApiErrorMessage(error, i18n.t(LANG_KEYS.pages.room.errors.submitFailed)),
      );
    } finally {
      runInAction(() => {
        this.isActionPending = false;
      });
    }
  }

  async start(): Promise<void> {
    if (!this.roomId || this.isActionPending) {
      return;
    }

    this.isActionPending = true;

    try {
      const question = await roomsApi.start(this.roomId);

      runInAction(() => {
        if (this.room) {
          this.room = { ...this.room, status: RoomStatus.Active };
        }

        this.applyQuestion(question);
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.push(
        getApiErrorMessage(error, i18n.t(LANG_KEYS.pages.room.errors.startFailed)),
      );
    } finally {
      runInAction(() => {
        this.isActionPending = false;
      });
    }
  }

  async nextQuestion(): Promise<void> {
    if (!this.roomId || !this.currentQuestion || this.isActionPending) {
      return;
    }

    const currentIndex = this.questions.findIndex((question) => question.id === this.currentQuestion?.id);
    const nextQuestion = currentIndex >= 0 ? this.questions[currentIndex + 1] : undefined;

    if (!nextQuestion) {
      await this.finish();
      return;
    }

    this.isActionPending = true;

    try {
      const question = await roomsApi.showQuestion(this.roomId, {
        questionId: nextQuestion.id,
      });

      runInAction(() => {
        this.applyQuestion(question);
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.push(
        getApiErrorMessage(error, i18n.t(LANG_KEYS.pages.room.errors.nextFailed)),
      );
    } finally {
      runInAction(() => {
        this.isActionPending = false;
      });
    }
  }

  async finish(): Promise<void> {
    if (!this.roomId || this.isActionPending) {
      return;
    }

    this.isActionPending = true;

    try {
      const leaderboard = await roomsApi.finish(this.roomId);

      runInAction(() => {
        this.leaderboard = leaderboard;

        if (this.room) {
          this.room = { ...this.room, status: RoomStatus.Finished, currentQuestionId: null };
        }

        this.currentQuestion = null;
        this.phase = "finished";
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      errorStore.push(
        getApiErrorMessage(error, i18n.t(LANG_KEYS.pages.room.errors.finishFailed)),
      );
    } finally {
      runInAction(() => {
        this.isActionPending = false;
      });
    }
  }

  async copyInviteLink(): Promise<void> {
    if (!this.inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(this.inviteUrl);
  }

  private connectRealtime(role: "organizer" | "participant", roomParticipantId?: string): void {
    if (!this.roomId) {
      return;
    }

    roomRealtimeClient.onEvent((event) => {
      this.handleRealtimeEvent(event);
    });

    roomRealtimeClient.onConnectionChange((isConnected) => {
      runInAction(() => {
        this.wsConnected = isConnected;
      });
    });

    if (role === "organizer") {
      roomRealtimeClient.connectOrganizer(this.roomId);
    } else if (roomParticipantId) {
      roomRealtimeClient.connectParticipant(this.roomId, roomParticipantId);
    }
  }

  private handleRealtimeEvent(event: RoomRealtimeEvent): void {
    switch (event.type) {
      case RealtimeEventType.RoomStarted:
        runInAction(() => {
          if (this.room) {
            this.room = { ...this.room, status: RoomStatus.Active };
          }

          this.applyQuestion(event.question);

          if (this.roomParticipantId && this.phase !== "finished") {
            this.phase = event.question ? "answering" : "waiting";
          }
        });
        break;

      case RealtimeEventType.QuestionShown:
        runInAction(() => {
          this.applyQuestion(event.question);

          if (this.roomParticipantId && this.phase !== "finished") {
            this.phase = "answering";
          }
        });
        break;

      case RealtimeEventType.ParticipantJoined:
        runInAction(() => {
          this.joinedCount += 1;
        });
        break;

      case RealtimeEventType.AnswerSubmitted:
        runInAction(() => {
          this.answeredCount = event.answeredCount;
        });
        break;

      case RealtimeEventType.LeaderboardUpdated:
        runInAction(() => {
          this.leaderboard = event.leaderboard;
        });
        break;

      case RealtimeEventType.RoomFinished:
        runInAction(() => {
          this.leaderboard = event.leaderboard;
          this.currentQuestion = null;

          if (this.room) {
            this.room = { ...this.room, status: RoomStatus.Finished, currentQuestionId: null };
          }

          if (this.roomParticipantId) {
            this.phase = "finished";
          }
        });
        break;

      default:
        break;
    }
  }

  private async syncActiveQuestionState(roomParticipantId?: string): Promise<void> {
    if (!this.roomId || this.room?.status !== RoomStatus.Active) {
      return;
    }

    try {
      const state = await roomsApi.getCurrentQuestion(this.roomId, roomParticipantId);

      runInAction(() => {
        this.restoreCurrentQuestionState(
          state.question,
          state.answeredCount,
          roomParticipantId
            ? { hasAnswered: state.participantHasAnswered }
            : undefined,
        );

        if (roomParticipantId && !state.question) {
          this.phase = "waiting";
        }
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }
    }
  }

  private restoreCurrentQuestionState(
    question: LiveQuestionDto | null,
    answeredCount: number,
    participantOptions?: { hasAnswered: boolean },
  ): void {
    this.currentQuestion = question;
    this.answeredCount = answeredCount;

    if (this.room && question) {
      this.room = { ...this.room, currentQuestionId: question.id };
    }

    if (participantOptions && question) {
      this.phase = participantOptions.hasAnswered ? "submitted" : "answering";

      if (!participantOptions.hasAnswered) {
        this.selectedOptionIds = [];
        this.lastAnswerResult = null;
      }
    }
  }

  private applyQuestion(question: LiveQuestionDto | null): void {
    this.currentQuestion = question;
    this.answeredCount = 0;
    this.selectedOptionIds = [];
    this.lastAnswerResult = null;

    if (this.room && question) {
      this.room = { ...this.room, currentQuestionId: question.id };
    }
  }
}

export const roomStore = new RoomStore();
