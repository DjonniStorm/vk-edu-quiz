import { Paper, Stack, Switch, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

import { quizCreateStore } from "../../model/quiz-create.store";

export const RulesStep = observer(() => {
  const { t } = useTranslation();
  const { draft } = quizCreateStore;

  return (
    <Stack gap="md">
      <Title order={4}>{t(LANG_KEYS.pages.quizCreate.rules.title)}</Title>

      <Paper withBorder p="md" radius="md">
        <Switch
          label={t(LANG_KEYS.pages.quizCreate.rules.showLeaderboard)}
          description={t(LANG_KEYS.pages.quizCreate.rules.showLeaderboardDescription)}
          checked={draft.showLeaderboardAfterQuestion}
          onChange={(event) =>
            quizCreateStore.updateRules({
              ...draft,
              showLeaderboardAfterQuestion: event.currentTarget.checked,
            })
          }
        />
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Switch
          label={t(LANG_KEYS.pages.quizCreate.rules.allowLateJoin)}
          description={t(LANG_KEYS.pages.quizCreate.rules.allowLateJoinDescription)}
          checked={draft.allowLateJoin}
          onChange={(event) =>
            quizCreateStore.updateRules({
              ...draft,
              allowLateJoin: event.currentTarget.checked,
            })
          }
        />
      </Paper>
    </Stack>
  );
});
