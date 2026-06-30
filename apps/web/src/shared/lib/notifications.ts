import { notifications } from "@mantine/notifications";

import i18n, { LANG_KEYS } from "@/app/i18n";

type NotificationType = "error" | "success" | "info" | "warning";

const PRESETS: Record<NotificationType, { color: string; titleKey: string; autoClose: number }> = {
  error: {
    color: "red",
    titleKey: LANG_KEYS.notifications.titles.error,
    autoClose: 6000,
  },
  success: {
    color: "green",
    titleKey: LANG_KEYS.notifications.titles.success,
    autoClose: 4000,
  },
  info: {
    color: "blue",
    titleKey: LANG_KEYS.notifications.titles.info,
    autoClose: 4000,
  },
  warning: {
    color: "yellow",
    titleKey: LANG_KEYS.notifications.titles.warning,
    autoClose: 5000,
  },
};

class Notify {
  private static show(type: NotificationType, message: string, title?: string): void {
    const preset = PRESETS[type];

    notifications.show({
      title: title ?? i18n.t(preset.titleKey),
      message,
      color: preset.color,
      withBorder: true,
      autoClose: preset.autoClose,
    });
  }

  static error(message: string, title?: string): void {
    Notify.show("error", message, title);
  }

  static success(message: string, title?: string): void {
    Notify.show("success", message, title);
  }

  static info(message: string, title?: string): void {
    Notify.show("info", message, title);
  }

  static warning(message: string, title?: string): void {
    Notify.show("warning", message, title);
  }
}

export { Notify as notify };
