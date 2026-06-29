import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app/i18n";
import { Router } from "./app/providers/Router";
import { Theme } from "./app/providers/Theme";
import { createHead, UnheadProvider } from "@unhead/react/client";

const head = createHead();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UnheadProvider head={head}>
      <Theme>
        <Router />
      </Theme>
    </UnheadProvider>
  </StrictMode>,
);
