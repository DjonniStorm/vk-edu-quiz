import { AnswerMode } from "@quiz/shared";
import {
  ActionIcon,
  Anchor,
  Checkbox,
  Group,
  NumberInput,
  Radio,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

import { quizCreateStore } from "../../model/quiz-create.store";
import { TIME_LIMIT_PRESETS } from "../../model/quiz-create.types";

interface AnswerOptionsEditorProps {
  questionClientId: string;
  answerMode: AnswerMode;
}

export const AnswerOptionsEditor = observer(
  ({ questionClientId, answerMode }: AnswerOptionsEditorProps) => {
    const { t } = useTranslation();
    const question = quizCreateStore.draft.questions.find((q) => q.clientId === questionClientId);

    if (!question) {
      return null;
    }

    return (
      <Stack gap="sm">
        <Text fw={600} size="sm">
          {t(LANG_KEYS.pages.quizCreate.questions.answerOptions)}
        </Text>

        {question.answerOptions.map((option) => (
          <Group key={option.clientId} align="center" wrap="nowrap">
            {answerMode === AnswerMode.Single ? (
              <Radio
                checked={option.isCorrect}
                onChange={() => quizCreateStore.setOptionCorrect(questionClientId, option.clientId, true)}
              />
            ) : (
              <Checkbox
                checked={option.isCorrect}
                onChange={(event) =>
                  quizCreateStore.setOptionCorrect(
                    questionClientId,
                    option.clientId,
                    event.currentTarget.checked,
                  )
                }
              />
            )}
            <TextInput
              style={{ flex: 1 }}
              value={option.text}
              placeholder={t(LANG_KEYS.pages.quizCreate.questions.addOptionPlaceholder)}
              onChange={(event) =>
                quizCreateStore.updateOption(questionClientId, option.clientId, event.currentTarget.value)
              }
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => quizCreateStore.removeOption(questionClientId, option.clientId)}
              disabled={question.answerOptions.length <= 2}
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>
        ))}

        <Anchor
          component="button"
          type="button"
          size="sm"
          onClick={() => quizCreateStore.addOption(questionClientId)}
        >
          + {t(LANG_KEYS.pages.quizCreate.questions.addOption)}
        </Anchor>
      </Stack>
    );
  },
);

export const QuestionEditorPanel = observer(() => {
  const { t } = useTranslation();
  const question = quizCreateStore.selectedQuestion;
  const questionIndex = quizCreateStore.selectedQuestionIndex;

  if (!question) {
    return null;
  }

  const timeLimitOptions = TIME_LIMIT_PRESETS.map((value) => ({
    value: String(value),
    label: `${value}s`,
  }));

  return (
    <Stack gap="md">
      <Title order={4}>
        {t(LANG_KEYS.pages.quizCreate.questions.editTitle, { number: questionIndex + 1 })}
      </Title>

      <Textarea
        label={t(LANG_KEYS.pages.quizCreate.questions.questionText)}
        value={question.text}
        minRows={3}
        onChange={(event) =>
          quizCreateStore.updateQuestion(question.clientId, { text: event.currentTarget.value })
        }
      />

      <Select
        label={t(LANG_KEYS.pages.quizCreate.questions.answerMode)}
        value={question.answerMode}
        data={[
          {
            value: AnswerMode.Single,
            label: t(LANG_KEYS.pages.quizCreate.questions.answerModeLabels.single),
          },
          {
            value: AnswerMode.Multiple,
            label: t(LANG_KEYS.pages.quizCreate.questions.answerModeLabels.multiple),
          },
        ]}
        onChange={(value) => {
          if (value === AnswerMode.Single || value === AnswerMode.Multiple) {
            quizCreateStore.setQuestionAnswerMode(question.clientId, value);
          }
        }}
      />

      <AnswerOptionsEditor questionClientId={question.clientId} answerMode={question.answerMode} />

      <Group grow align="flex-start">
        <Select
          label={t(LANG_KEYS.pages.quizCreate.questions.timeLimit)}
          value={String(question.timeLimitSec)}
          data={timeLimitOptions}
          onChange={(value) => {
            if (value) {
              quizCreateStore.updateQuestion(question.clientId, {
                timeLimitSec: Number(value),
              });
            }
          }}
        />
        <NumberInput
          label={t(LANG_KEYS.pages.quizCreate.questions.points)}
          value={question.points}
          min={1}
          onChange={(value) =>
            quizCreateStore.updateQuestion(question.clientId, {
              points: typeof value === "number" ? value : question.points,
            })
          }
        />
      </Group>
    </Stack>
  );
});
