import type { NavigateFunction } from "react-router";

import { ROUTES } from "@/app/routes";

export const SECTION_SCROLL_MARGIN = 80;

export const sectionAnchorStyle = {
  scrollMarginTop: SECTION_SCROLL_MARGIN,
} as const;

export const scrollToSection = (sectionId: string) => {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const navigateToSection = (
  navigate: NavigateFunction,
  pathname: string,
  sectionId: string,
) => {
  navigateToPageSection(navigate, pathname, ROUTES.main, sectionId);
};

export const navigateToPageSection = (
  navigate: NavigateFunction,
  pathname: string,
  route: string,
  sectionId: string,
) => {
  if (pathname === route) {
    scrollToSection(sectionId);
    window.history.replaceState(null, "", `${route}#${sectionId}`);
    return;
  }

  navigate(`${route}#${sectionId}`);
};
