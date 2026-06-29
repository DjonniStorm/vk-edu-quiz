import { notifications } from "@mantine/notifications";

export type AppNotificationType = "error" | "success" | "info" | "warning";

export interface AppNotificationInput {
  type: AppNotificationType;
  message: string;
  title?: string;
}

const NOTIFICATION_PRESETS: Record<
  AppNotificationType,
  { color: string; title: string; autoClose: number }
> = {
  error: {
    color: "red",
    title: "Ошибка",
    autoClose: 6000,
  },
  success: {
    color: "green",
    title: "Успешно",
    autoClose: 4000,
  },
  info: {
    color: "blue",
    title: "Информация",
    autoClose: 4000,
  },
  warning: {
    color: "yellow",
    title: "Внимание",
    autoClose: 5000,
  },
};

export const showAppNotification = ({ type, message, title }: AppNotificationInput): void => {
  const preset = NOTIFICATION_PRESETS[type];

  notifications.show({
    title: title ?? preset.title,
    message,
    color: preset.color,
    withBorder: true,
    autoClose: preset.autoClose,
  });
};

export const showErrorNotification = (message: string, title?: string): void => {
  showAppNotification({ type: "error", message, title });
};

export const showSuccessNotification = (message: string, title?: string): void => {
  showAppNotification({ type: "success", message, title });
};

export const showInfoNotification = (message: string, title?: string): void => {
  showAppNotification({ type: "info", message, title });
};

export const showWarningNotification = (message: string, title?: string): void => {
  showAppNotification({ type: "warning", message, title });
};
