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
