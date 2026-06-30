import { Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { QuizStatus } from "@quiz/shared";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { QUIZ_STATUS_LABEL_KEY } from "@/features/quiz-card/model/quiz-status.ui";

import { organizerDashboardStore } from "../model/organizer-dashboard.store";

const STATUS_FILTER_OPTIONS = [
  { value: "", labelKey: LANG_KEYS.pages.organizerDashboard.quizzes.statusAll },
  { value: QuizStatus.Draft, labelKey: QUIZ_STATUS_LABEL_KEY[QuizStatus.Draft] },
  { value: QuizStatus.Published, labelKey: QUIZ_STATUS_LABEL_KEY[QuizStatus.Published] },
  { value: QuizStatus.Archived, labelKey: QUIZ_STATUS_LABEL_KEY[QuizStatus.Archived] },
] as const;

export const QuizzesToolbar = observer(() => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(organizerDashboardStore.search);
  const [debouncedSearch] = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setSearchInput(organizerDashboardStore.search);
  }, [organizerDashboardStore.search]);

  useEffect(() => {
    if (debouncedSearch !== organizerDashboardStore.search) {
      organizerDashboardStore.setSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  const statusOptions = STATUS_FILTER_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));

  return (
    <Stack gap="sm">
      <Group align="flex-end" wrap="wrap">
        <TextInput
          flex={1}
          miw={220}
          value={searchInput}
          placeholder={t(LANG_KEYS.pages.organizerDashboard.quizzes.searchPlaceholder)}
          onChange={(event) => setSearchInput(event.currentTarget.value)}
        />
        <Select
          w={{ base: "100%", sm: 220 }}
          data={statusOptions}
          value={organizerDashboardStore.statusFilter ?? ""}
          onChange={(value) =>
            organizerDashboardStore.setStatusFilter(value ? (value as QuizStatus) : null)
          }
        />
        {organizerDashboardStore.hasActiveFilters ? (
          <Button variant="subtle" onClick={() => organizerDashboardStore.resetFilters()}>
            {t(LANG_KEYS.pages.organizerDashboard.quizzes.resetFilters)}
          </Button>
        ) : null}
      </Group>

      {organizerDashboardStore.hasActiveFilters ? (
        <Text size="sm" c="dimmed">
          {t(LANG_KEYS.pages.organizerDashboard.quizzes.resultsCount, {
            count: organizerDashboardStore.filteredTotal,
          })}
        </Text>
      ) : null}
    </Stack>
  );
});
