import { Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

export interface RoomTimerProps {
  endsAt: string;
  label?: string;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const RoomTimer = ({ endsAt, label }: RoomTimerProps) => {
  const { t } = useTranslation();
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    const update = () => {
      const diffMs = new Date(endsAt).getTime() - Date.now();
      setRemainingSec(Math.max(0, Math.ceil(diffMs / 1000)));
    };

    update();
    const intervalId = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [endsAt]);

  return (
    <Text size="sm" fw={600}>
      {label ?? t(LANG_KEYS.pages.room.play.remaining)}: {formatTime(remainingSec)}
    </Text>
  );
};
