import { Alert, Button, Center, Group, Loader, Paper, Stack, Stepper, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { QuizStatus } from "@quiz/shared";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { LANG_KEYS } from "@/app/i18n";
import { usePageHead } from "@/app/seo";
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
  const { quizId } = useParams<{ quizId?: string }>();
  const { activeStep, isLoadingQuiz, loadError, loadedStatus } = quizCreateStore;
  const isEditMode = Boolean(quizId);

  useEffect(() => {
    if (quizId) {
      void quizCreateStore.loadQuiz(quizId);
    } else {
      quizCreateStore.reset();
    }

    return () => {
      quizCreateStore.reset();
    };
  }, [quizId]);

  const handleSaveDraft = () => {
    void quizCreateStore.saveDraft();
  };

  const handleArchive = () => {
    modals.openConfirmModal({
      title: t(LANG_KEYS.pages.quizCreate.archiveConfirmTitle),
      children: (
        <Text size="sm" c="dimmed">
          {t(LANG_KEYS.pages.quizCreate.archiveConfirmBody)}
        </Text>
      ),
      labels: {
        confirm: t(LANG_KEYS.pages.quizCreate.archive),
        cancel: t(LANG_KEYS.common.cancel),
      },
      confirmProps: { color: "red" },
      onConfirm: () => {
        void quizCreateStore.archive().then((isSuccess) => {
          if (isSuccess) {
            navigate(ROUTES.main, { replace: true });
          }
        });
      },
    });
  };

  const handleNext = () => {
    if (activeStep === QUIZ_CREATE_STEPS.review) {
      if (loadedStatus === QuizStatus.Published) {
        void quizCreateStore.saveDraft().then((isSuccess) => {
          if (isSuccess) {
            navigate(ROUTES.main, { replace: true });
          }
        });
        return;
      }

      void quizCreateStore.publish().then((isSuccess) => {
        if (isSuccess) {
          navigate(ROUTES.main, { replace: true });
        }
      });
      return;
    }

    quizCreateStore.nextStep();
  };

  const pageTitle = isEditMode
    ? t(LANG_KEYS.pages.quizCreate.editTitle)
    : t(LANG_KEYS.pages.quizCreate.title);
  const pageSubtitle = isEditMode
    ? t(LANG_KEYS.pages.quizCreate.editSubtitle)
    : t(LANG_KEYS.pages.quizCreate.subtitle);

  usePageHead({ title: pageTitle, description: pageSubtitle });

  const nextLabel =
    activeStep === QUIZ_CREATE_STEPS.basicInfo
      ? t(LANG_KEYS.pages.quizCreate.footer.nextToQuestions)
      : activeStep === QUIZ_CREATE_STEPS.questions
        ? t(LANG_KEYS.pages.quizCreate.footer.nextToRules)
        : activeStep === QUIZ_CREATE_STEPS.rules
          ? t(LANG_KEYS.pages.quizCreate.footer.nextToReview)
          : loadedStatus === QuizStatus.Published
            ? t(LANG_KEYS.pages.quizCreate.footer.saveChanges)
            : t(LANG_KEYS.pages.quizCreate.footer.publish);

  if (isEditMode && isLoadingQuiz) {
    return (
      <AppLayout title={pageTitle} activeNav="createQuiz">
        <Center h={320}>
          <Loader />
        </Center>
      </AppLayout>
    );
  }

  if (isEditMode && loadError) {
    return (
      <AppLayout title={pageTitle} activeNav="createQuiz">
        <Alert color="red" title={loadError} />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={pageTitle} activeNav="createQuiz">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>{pageTitle}</Title>
            <Text c="dimmed">{pageSubtitle}</Text>
          </Stack>
          <Group gap="sm">
            {isEditMode && loadedStatus === QuizStatus.Published ? (
              <Button variant="subtle" color="gray" onClick={handleArchive}>
                {t(LANG_KEYS.pages.quizCreate.archive)}
              </Button>
            ) : null}
            <Button variant="default" onClick={handleSaveDraft}>
              {t(LANG_KEYS.pages.quizCreate.saveDraft)}
            </Button>
          </Group>
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
