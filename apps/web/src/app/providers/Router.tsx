import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ROUTES } from "../routes";
import { LazyPage } from "./LazyPage";
import { ProtectedRoute } from "@/features/protected-route";
import { loaderStore } from "@/shared/api";
import { getRouteKey } from "@/shared/api/route-key";

const OrganizerDashboardPage = lazy(async () => {
  const module = await import("@/pages/organizer-dashboard");

  return {
    default: module.OrganizerDashboardPage,
  };
});

const LoginPage = lazy(async () => {
  const module = await import("@/pages/auth/login");

  return {
    default: module.LoginPage,
  };
});

const RegisterPage = lazy(async () => {
  const module = await import("@/pages/auth/register");

  return {
    default: module.RegisterPage,
  };
});

const QuizCreatePage = lazy(async () => {
  const module = await import("@/pages/quiz-create");

  return {
    default: module.QuizCreatePage,
  };
});

const router = createBrowserRouter([
  {
    path: ROUTES.main,
    element: (
      <LazyPage>
        <ProtectedRoute>
          <OrganizerDashboardPage />
        </ProtectedRoute>
      </LazyPage>
    ),
  },
  {
    path: ROUTES.login,
    element: (
      <LazyPage>
        <LoginPage />
      </LazyPage>
    ),
  },
  {
    path: ROUTES.register,
    element: (
      <LazyPage>
        <RegisterPage />
      </LazyPage>
    ),
  },
  {
    path: ROUTES.quizCreate,
    element: (
      <LazyPage>
        <ProtectedRoute>
          <QuizCreatePage />
        </ProtectedRoute>
      </LazyPage>
    ),
  },
]);

let prevRouteKey = getRouteKey(router.state.location.pathname);

router.subscribe((state) => {
  const nextRouteKey = getRouteKey(state.location.pathname);

  if (nextRouteKey !== prevRouteKey) {
    loaderStore.abortScope(prevRouteKey);
    prevRouteKey = nextRouteKey;
  }
});

export const Router = () => {
  return <RouterProvider router={router} />;
};
