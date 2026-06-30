import { afterAll, afterEach, describe, expect, it } from "vitest";

import { BadRequestError } from "../../../core/errors";
import {
  deleteTestUsersByEmail,
  disconnectTestPrismaClient,
  getTestPrismaClient,
} from "../../../core/testing/test-db";
import { createTestUser } from "../../../core/testing/test-users";
import { AnswerMode, QuizStatus } from "../../../generated/prisma/enums";
import type { QuestionInput } from "../quizzes.interfaces";
import { QuizServiceImpl } from "../quizzes.service";

const createdEmails: string[] = [];

const createQuizService = () => new QuizServiceImpl(getTestPrismaClient());

const createOwner = async (prefix: string) => {
  const user = await createTestUser(prefix);

  createdEmails.push(user.email);

  return user;
};

const createSingleQuestion = (orderIndex = 0, imageUrl?: string | null): QuestionInput => ({
  text: "Сколько будет 2 + 2?",
  imageUrl,
  answerMode: AnswerMode.SINGLE,
  orderIndex,
  timeLimitSec: 30,
  points: 10,
  answerOptions: [
    { text: "4", isCorrect: true, orderIndex: 0 },
    { text: "5", isCorrect: false, orderIndex: 1 },
  ],
});

const createMultipleQuestion = (orderIndex = 0): QuestionInput => ({
  text: "Выбери чётные числа",
  answerMode: AnswerMode.MULTIPLE,
  orderIndex,
  timeLimitSec: 45,
  points: 20,
  answerOptions: [
    { text: "2", isCorrect: true, orderIndex: 0 },
    { text: "3", isCorrect: false, orderIndex: 1 },
    { text: "4", isCorrect: true, orderIndex: 2 },
  ],
});

afterEach(async () => {
  await deleteTestUsersByEmail(createdEmails);
  createdEmails.length = 0;
});

afterAll(async () => {
  await disconnectTestPrismaClient();
});

describe("QuizServiceImpl", () => {
  it("создаёт квиз без вопросов", async () => {
    const owner = await createOwner("quiz-empty");
    const quizService = createQuizService();

    const quiz = await quizService.createQuiz(owner.id, {
      title: "  Первый квиз  ",
      description: "Описание",
      category: "Математика",
    });

    expect(quiz).toMatchObject({
      title: "Первый квиз",
      description: "Описание",
      category: "Математика",
      status: QuizStatus.DRAFT,
      questionsCount: 0,
      questions: [],
    });
  });

  it("создаёт квиз с вопросами и вариантами ответов", async () => {
    const owner = await createOwner("quiz-with-questions");
    const quizService = createQuizService();

    const quiz = await quizService.createQuiz(owner.id, {
      title: "Квиз с вопросами",
      questions: [createMultipleQuestion()],
    });

    expect(quiz.questionsCount).toBe(1);
    expect(quiz.questions[0]).toMatchObject({
      text: "Выбери чётные числа",
      answerMode: AnswerMode.MULTIPLE,
      points: 20,
      timeLimitSec: 45,
    });
    expect(quiz.questions[0]?.answerOptions).toHaveLength(3);
    expect(quiz.questions[0]?.answerOptions.filter((option) => option.isCorrect)).toHaveLength(2);
  });

  it("не создаёт single choice вопрос с двумя правильными вариантами", async () => {
    const owner = await createOwner("quiz-invalid-single");
    const quizService = createQuizService();
    const question = createSingleQuestion();

    question.answerOptions[1]!.isCorrect = true;

    await expect(
      quizService.createQuiz(owner.id, {
        title: "Невалидный квиз",
        questions: [question],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("не создаёт вопрос без правильного варианта", async () => {
    const owner = await createOwner("quiz-no-correct");
    const quizService = createQuizService();
    const question = createMultipleQuestion();

    question.answerOptions = question.answerOptions.map((option) => ({
      ...option,
      isCorrect: false,
    }));

    await expect(
      quizService.createQuiz(owner.id, {
        title: "Невалидный квиз",
        questions: [question],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("возвращает в списке только квизы владельца", async () => {
    const owner = await createOwner("quiz-owner");
    const anotherOwner = await createOwner("quiz-another-owner");
    const quizService = createQuizService();

    const ownQuiz = await quizService.createQuiz(owner.id, { title: "Свой квиз" });
    await quizService.createQuiz(anotherOwner.id, { title: "Чужой квиз" });

    const result = await quizService.listOwnerQuizzes(owner.id);

    expect(result.total).toBe(1);
    expect(result.items.map((quiz) => quiz.id)).toEqual([ownQuiz.id]);
  });

  it("фильтрует квизы по части названия и описания", async () => {
    const owner = await createOwner("quiz-search");
    const quizService = createQuizService();

    await quizService.createQuiz(owner.id, {
      title: "JavaScript основы",
      description: "Для новичков",
    });
    const targetQuiz = await quizService.createQuiz(owner.id, {
      title: "Python продвинутый",
      description: "Асинхронность и типы",
    });
    await quizService.createQuiz(owner.id, {
      title: "SQL базовый",
      description: "SELECT и JOIN",
    });

    const byTitle = await quizService.listOwnerQuizzes(owner.id, { search: "python" });
    const byDescription = await quizService.listOwnerQuizzes(owner.id, { search: "асинхрон" });

    expect(byTitle.total).toBe(1);
    expect(byTitle.items[0]?.id).toBe(targetQuiz.id);
    expect(byDescription.total).toBe(1);
    expect(byDescription.items[0]?.id).toBe(targetQuiz.id);
  });

  it("фильтрует квизы по статусу", async () => {
    const owner = await createOwner("quiz-status-filter");
    const quizService = createQuizService();

    const draftQuiz = await quizService.createQuiz(owner.id, { title: "Черновик" });
    const publishedQuiz = await quizService.createQuiz(owner.id, { title: "Опубликованный" });

    await quizService.updateQuiz(owner.id, publishedQuiz.id, { status: QuizStatus.PUBLISHED });

    const publishedOnly = await quizService.listOwnerQuizzes(owner.id, {
      status: QuizStatus.PUBLISHED,
    });
    const draftOnly = await quizService.listOwnerQuizzes(owner.id, {
      status: QuizStatus.DRAFT,
    });

    expect(publishedOnly.total).toBe(1);
    expect(publishedOnly.items[0]?.id).toBe(publishedQuiz.id);
    expect(draftOnly.total).toBe(1);
    expect(draftOnly.items[0]?.id).toBe(draftQuiz.id);
  });

  it("пагинирует отфильтрованный список", async () => {
    const owner = await createOwner("quiz-pagination-filter");
    const quizService = createQuizService();

    for (let index = 0; index < 5; index += 1) {
      const quiz = await quizService.createQuiz(owner.id, { title: `Математика ${index + 1}` });
      await quizService.updateQuiz(owner.id, quiz.id, { status: QuizStatus.PUBLISHED });
    }

    await quizService.createQuiz(owner.id, { title: "История" });

    const firstPage = await quizService.listOwnerQuizzes(owner.id, {
      search: "математика",
      status: QuizStatus.PUBLISHED,
      limit: 2,
      offset: 0,
    });
    const secondPage = await quizService.listOwnerQuizzes(owner.id, {
      search: "математика",
      status: QuizStatus.PUBLISHED,
      limit: 2,
      offset: 2,
    });

    expect(firstPage.total).toBe(5);
    expect(firstPage.items).toHaveLength(2);
    expect(secondPage.items).toHaveLength(2);
    expect(firstPage.items[0]?.id).not.toBe(secondPage.items[0]?.id);
  });

  it("полностью заменяет вопросы квиза", async () => {
    const owner = await createOwner("quiz-replace");
    const quizService = createQuizService();
    const quiz = await quizService.createQuiz(owner.id, {
      title: "Квиз",
      questions: [createSingleQuestion()],
    });

    const updatedQuiz = await quizService.replaceQuestions(owner.id, quiz.id, [
      createMultipleQuestion(0),
      createSingleQuestion(1),
    ]);

    expect(updatedQuiz.questionsCount).toBe(2);
    expect(updatedQuiz.questions.map((question) => question.orderIndex)).toEqual([0, 1]);
    expect(updatedQuiz.questions[0]?.answerMode).toBe(AnswerMode.MULTIPLE);
  });

  it("не отдаёт чужой квиз", async () => {
    const owner = await createOwner("quiz-private-owner");
    const anotherOwner = await createOwner("quiz-private-another");
    const quizService = createQuizService();
    const quiz = await quizService.createQuiz(owner.id, { title: "Закрытый квиз" });

    const result = await quizService.getOwnerQuiz(anotherOwner.id, quiz.id);

    expect(result).toBeNull();
  });

  it("сохраняет imageUrl при создании и замене вопросов", async () => {
    const owner = await createOwner("quiz-image-url");
    const quizService = createQuizService();
    const imageUrl = "https://example.com/question.png";

    const quiz = await quizService.createQuiz(owner.id, {
      title: "Квиз с картинкой",
      questions: [createSingleQuestion(0, imageUrl)],
    });

    expect(quiz.questions[0]?.imageUrl).toBe(imageUrl);

    const updatedQuiz = await quizService.replaceQuestions(owner.id, quiz.id, [
      createSingleQuestion(0),
      createSingleQuestion(1, imageUrl),
    ]);

    expect(updatedQuiz.questions[0]?.imageUrl).toBeNull();
    expect(updatedQuiz.questions[1]?.imageUrl).toBe(imageUrl);
  });

  it("нормализует пустой imageUrl в null", async () => {
    const owner = await createOwner("quiz-empty-image-url");
    const quizService = createQuizService();

    const quiz = await quizService.createQuiz(owner.id, {
      title: "Квиз без картинки",
      questions: [createSingleQuestion(0, "")],
    });

    expect(quiz.questions[0]?.imageUrl).toBeNull();
  });
});
