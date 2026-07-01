import type {
  HostParticipantDto,
  HostQuestionStateDto,
  LeaderboardItemDto,
  LiveQuestionDto,
  RoomSummaryDto,
} from "@quiz/shared";
import { RealtimeEventType, RoomStatus, AnswerMode, SessionRole } from "@quiz/shared";
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
  hostParticipants: HostParticipantDto[] = [];
  joinedCount = 0;
  answeredCount = 0;
  activeParticipantCount = 0;
  optionRespondents = new Map<string, string[]>();
  revealedCorrectOptionIds: string[] | null = null;
  isQuestionClosing = false;
  wsConnected = false;
  wsEverConnected = false;
  wsAuthFailed = false;
  isLoading = false;
  loadError: string | null = null;
  isActionPending = false;
  isLoadingParticipants = false;

  roomParticipantId: string | null = null;
  displayName = "";
  realtimeRole: SessionRole | null = null;
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

  async initHost(identifier: string): Promise<boolean> {
    this.reset();
    this.isLoading = true;

    try {
      const room = await roomsApi.getRoom(identifier);

      if (!room) {
        runInAction(() => {
          this.loadError = i18n.t(LANG_KEYS.pages.room.errors.notFound);
        });

        return false;
      }

      const roomId = room.id;

      const [quiz, leaderboard] = await Promise.all([
        quizzesApi.getQuiz(room.quizId),
        roomsApi.getLeaderboard(roomId),
      ]);

      runInAction(() => {
        this.roomId = roomId;
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

      this.connectRealtime(SessionRole.Organizer);
      await Promise.all([this.syncHostState(), this.loadHostParticipants()]);

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

  async initPlay(identifier: string): Promise<boolean> {
    this.reset();
    this.isLoading = true;

    try {
      const room = await roomsApi.getRoom(identifier);

      if (!room) {
        runInAction(() => {
          this.loadError = i18n.t(LANG_KEYS.pages.room.errors.notFound);
        });

        return false;
      }

      const roomId = room.id;
      const session = roomSessionStorage.get(roomId);

      runInAction(() => {
        this.roomId = roomId;
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
        this.connectRealtime(SessionRole.Participant, session.roomParticipantId);

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
    this.hostParticipants = [];
    this.joinedCount = 0;
    this.answeredCount = 0;
    this.activeParticipantCount = 0;
    this.optionRespondents = new Map();
    this.revealedCorrectOptionIds = null;
    this.isQuestionClosing = false;
    this.wsConnected = false;
    this.wsEverConnected = false;
    this.wsAuthFailed = false;
    this.isLoading = false;
    this.loadError = null;
    this.isActionPending = false;
    this.isLoadingParticipants = false;
    this.roomParticipantId = null;
    this.displayName = "";
    this.realtimeRole = null;
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

      this.connectRealtime(SessionRole.Participant, participant.id);

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

        this.resetQuestionLiveState();
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
    if (
      !this.roomId ||
      !this.currentQuestion ||
      this.isActionPending ||
      this.isQuestionClosing ||
      !this.wsConnected
    ) {
      return;
    }

    this.isActionPending = true;

    try {
      await roomsApi.advance(this.roomId);
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

  async copyRoomCode(): Promise<void> {
    if (!this.room?.code) {
      return;
    }

    await navigator.clipboard.writeText(this.room.code);
  }

  private connectRealtime(role: SessionRole, roomParticipantId?: string): void {
    if (!this.roomId) {
      return;
    }

    this.realtimeRole = role;
    this.wsAuthFailed = false;

    roomRealtimeClient.onEvent((event) => {
      this.handleRealtimeEvent(event);
    });

    roomRealtimeClient.onConnectionChange((isConnected) => {
      // проверяем ДО обновления wsEverConnected — только реальный reconnect
      const isReconnect =
        isConnected && this.wsEverConnected && this.realtimeRole === SessionRole.Organizer;

      runInAction(() => {
        this.wsConnected = isConnected;

        if (isConnected) {
          this.wsEverConnected = true;
        }
      });

      if (isReconnect && this.roomId) {
        const roomId = this.roomId;

        void roomsApi
          .getRoom(roomId)
          .then((room) => {
            if (!room) return;

            runInAction(() => {
              this.room = room;
            });

            if (room.status === RoomStatus.Active) {
              void this.syncHostState();
            }
          })
          .catch(() => {
            // ignore
          });

        void roomsApi
          .getLeaderboard(roomId)
          .then((leaderboard) => {
            runInAction(() => {
              this.leaderboard = leaderboard;
            });
          })
          .catch(() => {
            // ignore
          });
      }
    });

    roomRealtimeClient.onAuthFailure(() => {
      runInAction(() => {
        this.wsAuthFailed = true;
      });
    });

    if (role === SessionRole.Organizer) {
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

          this.resetQuestionLiveState();
          this.applyQuestion(event.question);

          if (this.roomParticipantId && this.phase !== "finished") {
            this.phase = event.question ? "answering" : "waiting";
          }
        });
        break;

      case RealtimeEventType.QuestionShown:
        runInAction(() => {
          this.resetQuestionLiveState();
          this.applyQuestion(event.question);

          if (this.roomParticipantId && this.phase !== "finished") {
            this.phase = "answering";
          }
        });
        break;

      case RealtimeEventType.ParticipantJoined:
        runInAction(() => {
          if (this.realtimeRole === SessionRole.Organizer) {
            this.joinedCount += 1;
          }
        });

        if (this.realtimeRole === SessionRole.Organizer) {
          void this.loadHostParticipants();
        }
        break;

      case RealtimeEventType.AnswerSubmitted:
        if (this.realtimeRole !== SessionRole.Organizer) {
          break;
        }

        runInAction(() => {
          this.answeredCount = event.answeredCount;
          this.activeParticipantCount = event.activeParticipantCount;
          this.appendSubmissionToOptionRespondents(
            event.submission.answerOptionIds,
            this.formatSubmissionLabel(event.submission),
          );
        });
        break;

      case RealtimeEventType.QuestionRevealed:
        runInAction(() => {
          this.isQuestionClosing = true;
          this.revealedCorrectOptionIds = event.correctOptionIds;
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

  private async syncHostState(): Promise<void> {
    if (!this.roomId || this.room?.status !== RoomStatus.Active) {
      return;
    }

    try {
      const state = await roomsApi.getHostState(this.roomId);

      runInAction(() => {
        this.applyHostState(state);
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }
    }
  }

  async loadHostParticipants(): Promise<void> {
    if (!this.roomId || this.realtimeRole !== SessionRole.Organizer || this.isLoadingParticipants) {
      return;
    }

    this.isLoadingParticipants = true;

    try {
      const participants = await roomsApi.getHostParticipants(this.roomId);

      runInAction(() => {
        this.hostParticipants = participants;
        this.joinedCount = participants.length;
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }
    } finally {
      runInAction(() => {
        this.isLoadingParticipants = false;
      });
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

  private applyHostState(state: HostQuestionStateDto): void {
    this.currentQuestion = state.question;
    this.answeredCount = state.answeredCount;
    this.activeParticipantCount = state.activeParticipantCount;
    this.isQuestionClosing = state.phase === "revealing";
    this.revealedCorrectOptionIds =
      state.phase === "revealing" ? (state.correctOptionIds ?? null) : null;
    this.optionRespondents = this.buildOptionRespondentsFromSubmissions(state.submissions);

    if (this.room && state.question) {
      this.room = { ...this.room, currentQuestionId: state.question.id };
    }
  }

  private buildOptionRespondentsFromSubmissions(
    submissions: HostQuestionStateDto["submissions"],
  ): Map<string, string[]> {
    const respondents = new Map<string, string[]>();

    for (const submission of submissions) {
      this.appendSubmissionToOptionRespondents(
        submission.answerOptionIds,
        this.formatSubmissionLabel(submission),
        respondents,
      );
    }

    return respondents;
  }

  private formatSubmissionLabel(
    submission: Pick<HostQuestionStateDto["submissions"][number], "displayName" | "email">,
  ): string {
    if (submission.email) {
      return `${submission.displayName} · ${submission.email}`;
    }

    return submission.displayName;
  }

  private appendSubmissionToOptionRespondents(
    answerOptionIds: string[],
    displayName: string,
    target: Map<string, string[]> = this.optionRespondents,
  ): void {
    for (const optionId of answerOptionIds) {
      const names = target.get(optionId) ?? [];

      if (!names.includes(displayName)) {
        target.set(optionId, [...names, displayName]);
      }
    }
  }

  private resetQuestionLiveState(): void {
    this.answeredCount = 0;
    this.optionRespondents = new Map();
    this.revealedCorrectOptionIds = null;
    this.isQuestionClosing = false;
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
    this.selectedOptionIds = [];
    this.lastAnswerResult = null;

    if (this.room && question) {
      this.room = { ...this.room, currentQuestionId: question.id };
    }
  }
}

export const roomStore = new RoomStore();
