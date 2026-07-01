import { Autocomplete, Stack, TextInput, Textarea } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";
import { QUIZ_CATEGORY_LABEL_KEY } from "@/features/quiz-card/model/quiz-category.ui";
import { QUIZ_CATEGORY_IDS } from "@/shared/config/quiz-categories";

import { quizCreateStore } from "../../model/quiz-create.store";

export const BasicInfoStep = observer(() => {
  const { t } = useTranslation();
  const { draft } = quizCreateStore;

  return (
    <Stack gap="md">
      <TextInput
        label={t(LANG_KEYS.pages.quizCreate.basicInfo.title)}
        placeholder={t(LANG_KEYS.pages.quizCreate.basicInfo.titlePlaceholder)}
        value={draft.title}
        onChange={(event) =>
          quizCreateStore.updateBasicInfo({
            ...draft,
            title: event.currentTarget.value,
          })
        }
        required
      />
      <Textarea
        label={t(LANG_KEYS.pages.quizCreate.basicInfo.description)}
        placeholder={t(LANG_KEYS.pages.quizCreate.basicInfo.descriptionPlaceholder)}
        value={draft.description}
        minRows={3}
        onChange={(event) =>
          quizCreateStore.updateBasicInfo({
            ...draft,
            description: event.currentTarget.value,
          })
        }
      />
      <Autocomplete
        label={t(LANG_KEYS.pages.quizCreate.basicInfo.category)}
        placeholder={t(LANG_KEYS.pages.quizCreate.basicInfo.categoryPlaceholder)}
        data={QUIZ_CATEGORY_IDS.map((id) => t(QUIZ_CATEGORY_LABEL_KEY[id]))}
        value={draft.category}
        onChange={(value) =>
          quizCreateStore.updateBasicInfo({
            ...draft,
            category: value,
          })
        }
        limit={12}
        maxDropdownHeight={280}
      />
    </Stack>
  );
});
