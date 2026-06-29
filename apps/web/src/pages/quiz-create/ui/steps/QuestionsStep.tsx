import { Grid, Paper } from "@mantine/core";
import { observer } from "mobx-react-lite";

import { quizCreateStore } from "../../model/quiz-create.store";
import { QuestionEditorPanel } from "../questions/QuestionEditorPanel";
import { QuestionListPanel } from "../questions/QuestionListPanel";

export const QuestionsStep = observer(() => {
  const handleAddQuestion = () => {
    quizCreateStore.addQuestion();
  };

  return (
    <Grid gap="lg">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper withBorder p="md" radius="md" h="100%">
          <QuestionListPanel onAddQuestion={handleAddQuestion} />
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Paper withBorder p="md" radius="md" h="100%">
          <QuestionEditorPanel />
        </Paper>
      </Grid.Col>
    </Grid>
  );
});
