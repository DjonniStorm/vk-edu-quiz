import { Grid, Paper, Text } from "@mantine/core";

import type { DashboardStatDto } from "@/shared/services";

export interface DashboardStatsProps {
  stats: DashboardStatDto[];
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <Grid>
      {stats.map((stat) => (
        <Grid.Col key={stat.id} span={{ base: 12, sm: 6, lg: 3 }}>
          <Paper p="lg" radius="md" withBorder>
            <Text size="sm" c="dimmed" fw={600}>
              {stat.label}
            </Text>
            <Text mt={8} size="xl" fw={800}>
              {stat.value}
            </Text>
            <Text mt={6} size="xs" c="blue.7">
              {stat.trend}
            </Text>
          </Paper>
        </Grid.Col>
      ))}
    </Grid>
  );
};
