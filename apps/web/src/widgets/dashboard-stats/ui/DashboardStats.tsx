import { Grid, Paper, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { DASHBOARD_STAT_KEYS } from "@/app/i18n";
import type { DashboardStatDto } from "@/shared/services";

export interface DashboardStatsProps {
  stats: DashboardStatDto[];
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const { t } = useTranslation();

  return (
    <Grid>
      {stats.map((stat) => {
        const statKeys = DASHBOARD_STAT_KEYS[stat.id as keyof typeof DASHBOARD_STAT_KEYS];

        return (
          <Grid.Col key={stat.id} span={{ base: 12, sm: 6, lg: 3 }}>
            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" fw={600}>
                {statKeys ? t(statKeys.label) : stat.label}
              </Text>
              <Text mt={8} size="xl" fw={800}>
                {stat.value}
              </Text>
              <Text mt={6} size="xs" c="blue.7">
                {statKeys ? t(statKeys.trend) : stat.trend}
              </Text>
            </Paper>
          </Grid.Col>
        );
      })}
    </Grid>
  );
};
