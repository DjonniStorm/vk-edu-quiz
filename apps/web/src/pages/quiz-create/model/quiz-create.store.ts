import { AnswerMode, QuizStatus, createQuizSchema, questionInputSchema } from "@quiz/shared";
import { makeAutoObservable, runInAction } from "mobx";

import { LANG_KEYS } from "@/app/i18n";
import i18n from "@/app/i18n";
import { errorStore } from "@/entities/error";
import { getApiErrorMessage, isCancelError, quizzesApi } from "@/shared/api";
import { showSuccessNotification, showWarningNotification } from "@/shared/lib";

import {
  mapDraftToCreateInput,
  mapDraftToQuestionsInput,
  mapDraftToUpdateInput,
  mapQuizDetailsToDraft,
} from "./quiz-create.mapper";
import type { DraftAnswerOption, DraftQuestion, QuizDraft } from "./quiz-create.types";
import { QUIZ_CREATE_STEPS } from "./quiz-create.types";

const createEmptyOption = (orderIndex: number): DraftAnswerOption => ({
  clientId: crypto.randomUUID(),
  text: "",
  isCorrect: false,
  orderIndex,
});

const createEmptyQuestion = (): DraftQuestion => ({
  clientId: crypto.randomUUID(),
  text: "",
  imageUrl: "",
  answerMode: AnswerMode.Single,
  timeLimitSec: 30,
  points: 10,
  answerOptions: [createEmptyOption(0), createEmptyOption(1)],
});

const createInitialDraft = (): QuizDraft => ({
  title: "",
  description: "",
  category: "",
  showLeaderboardAfterQuestion: true,
  allowLateJoin: false,
  questions: [createEmptyQuestion()],
});

export class QuizCreateStore {
  activeStep = 0;
  draft: QuizDraft = createInitialDraft();
  selectedQuestionClientId: string | null = null;
  quizId: string | null = null;
  loadedStatus: QuizStatus | null = null;
  isLoadingQuiz = false;
  loadError: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.selectedQuestionClientId = this.draft.questions[0]?.clientId ?? null;
  }

  get isEditingPublished(): boolean {
    return this.loadedStatus === QuizStatus.Published;
  }

  get selectedQuestion(): DraftQuestion | null {
    if (!this.selectedQuestionClientId) {
      return null;
    }

    return this.draft.questions.find((q) => q.clientId === this.selectedQuestionClientId) ?? null;
  }

  get selectedQuestionIndex(): number {
    return this.draft.questions.findIndex((q) => q.clientId === this.selectedQuestionClientId);
  }

  setStep(step: number) {
    if (step >= QUIZ_CREATE_STEPS.basicInfo && step <= QUIZ_CREATE_STEPS.review) {
      this.activeStep = step;
    }
  }

  nextStep(): boolean {
    if (!this.validateStep(this.activeStep)) {
      return false;
    }

    if (this.activeStep < QUIZ_CREATE_STEPS.review) {
      this.activeStep += 1;
    }

    return true;
  }

  prevStep() {
    if (this.activeStep > QUIZ_CREATE_STEPS.basicInfo) {
      this.activeStep -= 1;
    }
  }

  updateBasicInfo(values: Pick<QuizDraft, "title" | "description" | "category">) {
    this.draft.title = values.title;
    this.draft.description = values.description;
    this.draft.category = values.category;
  }

  updateRules(values: Pick<QuizDraft, "showLeaderboardAfterQuestion" | "allowLateJoin">) {
    this.draft.showLeaderboardAfterQuestion = values.showLeaderboardAfterQuestion;
    this.draft.allowLateJoin = values.allowLateJoin;
  }

  selectQuestion(clientId: string) {
    this.selectedQuestionClientId = clientId;
  }

  addQuestion() {
    const question = createEmptyQuestion();
    this.draft.questions.push(question);
    this.selectedQuestionClientId = question.clientId;
  }

  removeQuestion(clientId: string) {
    if (this.draft.questions.length <= 1) {
      return;
    }

    const index = this.draft.questions.findIndex((q) => q.clientId === clientId);

    if (index === -1) {
      return;
    }

    this.draft.questions.splice(index, 1);

    if (this.selectedQuestionClientId === clientId) {
      const nextQuestion = this.draft.questions[Math.min(index, this.draft.questions.length - 1)];
      this.selectedQuestionClientId = nextQuestion?.clientId ?? null;
    }
  }

  updateQuestion(clientId: string, patch: Partial<Omit<DraftQuestion, "clientId" | "answerOptions">>) {
    const question = this.draft.questions.find((q) => q.clientId === clientId);

    if (!question) {
      return;
    }

    Object.assign(question, patch);

    if (patch.answerMode === AnswerMode.Single) {
      this.normalizeSingleChoiceAnswers(question);
    }
  }

  setQuestionAnswerMode(clientId: string, answerMode: AnswerMode) {
    this.updateQuestion(clientId, { answerMode });
  }

  private normalizeSingleChoiceAnswers(question: DraftQuestion) {
    const correctOptions = question.answerOptions.filter((option) => option.isCorrect);

    if (correctOptions.length === 0) {
      return;
    }

    const keepCorrectId = correctOptions[0]?.clientId;

    question.answerOptions.forEach((option) => {
      option.isCorrect = option.clientId === keepCorrectId;
    });
  }

  private hasPartialQuestions(): boolean {
    return this.draft.questions.some(
      (question) =>
        question.text.trim() ||
        question.imageUrl.trim() ||
        question.answerOptions.some((option) => option.text.trim() || option.isCorrect),
    );
  }

  addOption(questionClientId: string) {
    const question = this.draft.questions.find((q) => q.clientId === questionClientId);

    if (!question) {
      return;
    }

    question.answerOptions.push(createEmptyOption(question.answerOptions.length));
  }

  removeOption(questionClientId: string, optionClientId: string) {
    const question = this.draft.questions.find((q) => q.clientId === questionClientId);

    if (!question || question.answerOptions.length <= 2) {
      return;
    }

    question.answerOptions = question.answerOptions.filter((o) => o.clientId !== optionClientId);
    question.answerOptions.forEach((option, index) => {
      option.orderIndex = index;
    });
  }

  updateOption(questionClientId: string, optionClientId: string, text: string) {
    const question = this.draft.questions.find((q) => q.clientId === questionClientId);
    const option = question?.answerOptions.find((o) => o.clientId === optionClientId);

    if (option) {
      option.text = text;
    }
  }

  setOptionCorrect(questionClientId: string, optionClientId: string, isCorrect: boolean) {
    const question = this.draft.questions.find((q) => q.clientId === questionClientId);

    if (!question) {
      return;
    }

    if (question.answerMode === AnswerMode.Single && isCorrect) {
      question.answerOptions.forEach((option) => {
        option.isCorrect = option.clientId === optionClientId;
      });

      return;
    }

    const option = question.answerOptions.find((o) => o.clientId === optionClientId);

    if (option) {
      option.isCorrect = isCorrect;
    }
  }

  validateStep(step: number): boolean {
    if (step === QUIZ_CREATE_STEPS.basicInfo) {
      return this.isBasicInfoValid(true);
    }

    if (step === QUIZ_CREATE_STEPS.questions) {
      return this.areQuestionsValid(true);
    }

    return true;
  }

  private isBasicInfoValid(showWarnings: boolean): boolean {
    const result = createQuizSchema
      .pick({ title: true })
      .safeParse({ title: this.draft.title.trim() });

    if (!result.success && showWarnings) {
      showWarningNotification(i18n.t(LANG_KEYS.pages.quizCreate.validation.titleRequired));
    }

    return result.success;
  }

  private areQuestionsValid(showWarnings: boolean): boolean {
    if (this.draft.questions.length === 0) {
      if (showWarnings) {
        showWarningNotification(i18n.t(LANG_KEYS.pages.quizCreate.validation.questionsRequired));
      }

      return false;
    }

    for (const [index, question] of this.draft.questions.entries()) {
      const result = questionInputSchema.safeParse({
        text: question.text.trim(),
        imageUrl: question.imageUrl.trim() || undefined,
        answerMode: question.answerMode,
        orderIndex: index,
        timeLimitSec: question.timeLimitSec,
        points: question.points,
        answerOptions: question.answerOptions.map((option, optionIndex) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
          orderIndex: optionIndex,
        })),
      });

      if (!result.success) {
        if (showWarnings) {
          showWarningNotification(
            i18n.t(LANG_KEYS.pages.quizCreate.validation.questionInvalid, { number: index + 1 }),
          );
          this.selectedQuestionClientId = question.clientId;
        }

        return false;
      }

      if (!question.answerOptions.some((option) => option.isCorrect)) {
        if (showWarnings) {
          showWarningNotification(
            i18n.t(LANG_KEYS.pages.quizCreate.validation.correctAnswerRequired, {
              number: index + 1,
            }),
          );
          this.selectedQuestionClientId = question.clientId;
        }

        return false;
      }

      if (question.answerMode === AnswerMode.Single) {
        const correctCount = question.answerOptions.filter((option) => option.isCorrect).length;

        if (correctCount !== 1) {
          if (showWarnings) {
            showWarningNotification(
              i18n.t(LANG_KEYS.pages.quizCreate.validation.singleCorrectRequired, {
                number: index + 1,
              }),
            );
            this.selectedQuestionClientId = question.clientId;
          }

          return false;
        }
      }
    }

    return true;
  }

  async loadQuiz(quizId: string): Promise<void> {
    this.isLoadingQuiz = true;
    this.loadError = null;

    try {
      const quiz = await quizzesApi.getQuiz(quizId);

      if (quiz.hasRooms) {
        runInAction(() => {
          this.loadError = i18n.t(LANG_KEYS.pages.quizCreate.notifications.cannotEditWithRooms);
        });
        return;
      }

      runInAction(() => {
        this.quizId = quiz.id;
        this.loadedStatus = quiz.status;
        this.draft = mapQuizDetailsToDraft(quiz);
        this.selectedQuestionClientId = this.draft.questions[0]?.clientId ?? null;
        this.activeStep = QUIZ_CREATE_STEPS.basicInfo;
      });
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }

      runInAction(() => {
        this.loadError = getApiErrorMessage(
          error,
          i18n.t(LANG_KEYS.pages.quizCreate.notifications.loadFailed),
        );
      });
    } finally {
      runInAction(() => {
        this.isLoadingQuiz = false;
      });
    }
  }

  async saveDraft(): Promise<boolean> {
    if (!this.isBasicInfoValid(true)) {
      return false;
    }

    const questionsValid = this.areQuestionsValid(false);
    const hasPartialQuestions = this.hasPartialQuestions();

    if (hasPartialQuestions && !questionsValid) {
      showWarningNotification(i18n.t(LANG_KEYS.pages.quizCreate.validation.questionsIncomplete));
      return false;
    }

    const questionsPayload = questionsValid ? mapDraftToQuestionsInput(this.draft) : undefined;

    try {
      if (!this.quizId) {
        const { questions: _questions, ...createPayload } = mapDraftToCreateInput(this.draft);
        const created = await quizzesApi.create({
          ...createPayload,
          ...(questionsPayload ? { questions: questionsPayload } : {}),
        });

        runInAction(() => {
          this.quizId = created.id;
        });
      } else {
        await quizzesApi.update(this.quizId, mapDraftToUpdateInput(this.draft));

        if (questionsPayload) {
          await quizzesApi.replaceQuestions(this.quizId, questionsPayload);
        }
      }

      showSuccessNotification(
        i18n.t(
          questionsPayload
            ? LANG_KEYS.pages.quizCreate.notifications.draftSaved
            : LANG_KEYS.pages.quizCreate.notifications.metadataSaved,
        ),
      );
      return true;
    } catch (error) {
      if (isCancelError(error)) {
        return false;
      }

      errorStore.pushFromUnknown(error, i18n.t(LANG_KEYS.pages.quizCreate.notifications.saveFailed));
      return false;
    }
  }

  async publish(): Promise<boolean> {
    if (this.loadedStatus === QuizStatus.Published) {
      return this.saveDraft();
    }

    if (!this.validateStep(QUIZ_CREATE_STEPS.questions)) {
      return false;
    }

    const isSaved = await this.saveDraft();

    if (!isSaved || !this.quizId) {
      return false;
    }

    try {
      await quizzesApi.update(this.quizId, { status: QuizStatus.Published });
      showSuccessNotification(i18n.t(LANG_KEYS.pages.quizCreate.notifications.published));
      this.reset();
      return true;
    } catch (error) {
      if (isCancelError(error)) {
        return false;
      }

      errorStore.pushFromUnknown(error, i18n.t(LANG_KEYS.pages.quizCreate.notifications.publishFailed));
      return false;
    }
  }

  reset() {
    this.activeStep = QUIZ_CREATE_STEPS.basicInfo;
    this.draft = createInitialDraft();
    this.selectedQuestionClientId = this.draft.questions[0]?.clientId ?? null;
    this.quizId = null;
    this.loadedStatus = null;
    this.isLoadingQuiz = false;
    this.loadError = null;
  }
}

export const quizCreateStore = new QuizCreateStore();
