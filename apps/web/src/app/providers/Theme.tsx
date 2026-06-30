import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";

import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type { PropsWithChildren } from "react";

import { AppLoader } from "./AppLoader";

export const Theme = ({ children }: PropsWithChildren) => {
  return (
    <MantineProvider defaultColorScheme="light" forceColorScheme="light">
      <ModalsProvider>
        <Notifications position="top-right" />
        <AppLoader />
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
};
