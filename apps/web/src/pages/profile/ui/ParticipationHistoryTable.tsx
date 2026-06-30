import { Table, Text } from "@mantine/core";
import type { ParticipantQuizHistoryItemDto } from "@quiz/shared";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

const formatFinishedAt = (value: string | null) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
};

export interface ParticipationHistoryTableProps {
  items: ParticipantQuizHistoryItemDto[];
}

export const ParticipationHistoryTable = ({ items }: ParticipationHistoryTableProps) => {
  const { t } = useTranslation();

  return (
    <Table highlightOnHover striped withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t(LANG_KEYS.pages.profile.history.columns.quizTitle)}</Table.Th>
          <Table.Th>{t(LANG_KEYS.pages.profile.history.columns.score)}</Table.Th>
          <Table.Th>{t(LANG_KEYS.pages.profile.history.columns.correctAnswers)}</Table.Th>
          <Table.Th>{t(LANG_KEYS.pages.profile.history.columns.finishedAt)}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.roomId}>
            <Table.Td>
              <Text fw={500}>{item.quizTitle}</Text>
            </Table.Td>
            <Table.Td>{item.score}</Table.Td>
            <Table.Td>{item.correctAnswersCount}</Table.Td>
            <Table.Td>{formatFinishedAt(item.finishedAt)}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};
