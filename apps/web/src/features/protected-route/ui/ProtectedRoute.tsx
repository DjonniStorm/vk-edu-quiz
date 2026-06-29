import { observer } from "mobx-react-lite";
import { useEffect, type PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router";

import { buildLoginPath } from "@/app/routes";
import { userStore } from "@/entities/user";

export const ProtectedRoute = observer(({ children }: PropsWithChildren) => {
  const location = useLocation();

  useEffect(() => {
    void userStore.initialize();
  }, []);

  // Во время первой инициализации визуал даёт глобальный blocking overlay (me() level: "blocking"),
  // поэтому здесь не рисуем второй лоадер, а просто блокируем рендер защищённого контента.
  if (!userStore.isInitialized || userStore.isInitializing) {
    return null;
  }

  if (!userStore.isAuthenticated) {
    const returnUrl = `${location.pathname}${location.search}`;

    return <Navigate to={buildLoginPath(returnUrl)} replace />;
  }

  return children;
});
