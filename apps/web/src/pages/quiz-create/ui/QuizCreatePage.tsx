import { Button, Group, Paper, Stack, Stepper, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { ROUTES } from "@/app/routes";
import { AppLayout } from "@/widgets/app-layout";

import { quizCreateStore } from "../model/quiz-create.store";
import { QUIZ_CREATE_STEPS } from "../model/quiz-create.types";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { QuestionsStep } from "./steps/QuestionsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { RulesStep } from "./steps/RulesStep";

export const QuizCreatePage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeStep } = quizCreateStore;

  useEffect(() => {
    quizCreateStore.reset();
  }, []);

  const handleSaveDraft = () => {
    void quizCreateStore.saveDraft();
  };

  const handleNext = () => {
    if (activeStep === QUIZ_CREATE_STEPS.review) {
      void quizCreateStore.publish().then((isSuccess) => {
        if (isSuccess) {
          navigate(ROUTES.main, { replace: true });
        }
      });
      return;
    }

    quizCreateStore.nextStep();
  };

  const nextLabel =
    activeStep === QUIZ_CREATE_STEPS.basicInfo
      ? t(LANG_KEYS.pages.quizCreate.footer.nextToQuestions)
      : activeStep === QUIZ_CREATE_STEPS.questions
        ? t(LANG_KEYS.pages.quizCreate.footer.nextToRules)
        : activeStep === QUIZ_CREATE_STEPS.rules
          ? t(LANG_KEYS.pages.quizCreate.footer.nextToReview)
          : t(LANG_KEYS.pages.quizCreate.footer.publish);

  return (
    <AppLayout title={t(LANG_KEYS.pages.quizCreate.title)} activeNav="createQuiz">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>{t(LANG_KEYS.pages.quizCreate.title)}</Title>
            <Text c="dimmed">{t(LANG_KEYS.pages.quizCreate.subtitle)}</Text>
          </Stack>
          <Button variant="default" onClick={handleSaveDraft}>
            {t(LANG_KEYS.pages.quizCreate.saveDraft)}
          </Button>
        </Group>

        <Stepper active={activeStep} onStepClick={(step) => quizCreateStore.setStep(step)}>
          <Stepper.Step label={t(LANG_KEYS.pages.quizCreate.steps.basicInfo)} />
          <Stepper.Step label={t(LANG_KEYS.pages.quizCreate.steps.questions)} />
          <Stepper.Step label={t(LANG_KEYS.pages.quizCreate.steps.rules)} />
          <Stepper.Step label={t(LANG_KEYS.pages.quizCreate.steps.review)} />
        </Stepper>

        <Paper withBorder p="xl" radius="md">
          {activeStep === QUIZ_CREATE_STEPS.basicInfo && <BasicInfoStep />}
          {activeStep === QUIZ_CREATE_STEPS.questions && <QuestionsStep />}
          {activeStep === QUIZ_CREATE_STEPS.rules && <RulesStep />}
          {activeStep === QUIZ_CREATE_STEPS.review && <ReviewStep />}
        </Paper>

        <Group justify="space-between">
          <Button
            variant="default"
            onClick={() => quizCreateStore.prevStep()}
            disabled={activeStep === QUIZ_CREATE_STEPS.basicInfo}
          >
            {t(LANG_KEYS.pages.quizCreate.footer.back)}
          </Button>
          <Button onClick={handleNext}>{nextLabel}</Button>
        </Group>
      </Stack>
    </AppLayout>
  );
});
