import { observer } from "mobx-react-lite";
import { lazy, useEffect } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { ROUTES } from "../routes";
import { ErrorBoundary } from "./ErrorBoundary";
import { LazyPage } from "./LazyPage";
import { userStore } from "@/entities/user";
import { ProtectedRoute } from "@/features/protected-route";
import { NotFoundPage } from "@/pages/error";
import { loaderStore } from "@/shared/api";
import { getRouteKey } from "@/shared/api/route-key";

const OrganizerDashboardPage = lazy(async () => {
  const module = await import("@/pages/organizer-dashboard");

  return {
    default: module.OrganizerDashboardPage,
  };
});

const LandingPage = lazy(async () => {
  const module = await import("@/pages/landing");

  return {
    default: module.LandingPage,
  };
});

const HomeRoute = observer(() => {
  useEffect(() => {
    void userStore.initialize();
  }, []);

  if (!userStore.isInitialized || userStore.isInitializing) {
    return null;
  }

  return userStore.isAuthenticated ? <OrganizerDashboardPage /> : <LandingPage />;
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

const QuizResultsPage = lazy(async () => {
  const module = await import("@/pages/quiz-results");

  return {
    default: module.QuizResultsPage,
  };
});

const ProfilePage = lazy(async () => {
  const module = await import("@/pages/profile");

  return {
    default: module.ProfilePage,
  };
});

const RoomPlayPage = lazy(async () => {
  const module = await import("@/pages/room");

  return {
    default: module.RoomPlayPage,
  };
});

const RoomHostPage = lazy(async () => {
  const module = await import("@/pages/room");

  return {
    default: module.RoomHostPage,
  };
});

const RootLayout = () => (
  <ErrorBoundary>
    <Outlet />
  </ErrorBoundary>
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: ROUTES.main,
        element: (
          <LazyPage>
            <HomeRoute />
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
      {
        path: ROUTES.quizEdit,
        element: (
          <LazyPage>
            <ProtectedRoute>
              <QuizCreatePage />
            </ProtectedRoute>
          </LazyPage>
        ),
      },
      {
        path: ROUTES.quizResults,
        element: (
          <LazyPage>
            <ProtectedRoute>
              <QuizResultsPage />
            </ProtectedRoute>
          </LazyPage>
        ),
      },
      {
        path: ROUTES.profile,
        element: (
          <LazyPage>
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          </LazyPage>
        ),
      },
      {
        path: ROUTES.roomPlay,
        element: (
          <LazyPage>
            <RoomPlayPage />
          </LazyPage>
        ),
      },
      {
        path: ROUTES.roomHost,
        element: (
          <LazyPage>
            <ProtectedRoute>
              <RoomHostPage />
            </ProtectedRoute>
          </LazyPage>
        ),
      },
      {
        path: ROUTES.notFound,
        element: <NotFoundPage />,
      },
    ],
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
