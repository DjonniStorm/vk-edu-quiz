import { Center, Loader } from "@mantine/core";
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

  if (!userStore.isInitialized || userStore.isInitializing) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!userStore.isAuthenticated) {
    const returnUrl = `${location.pathname}${location.search}`;

    return <Navigate to={buildLoginPath(returnUrl)} replace />;
  }

  return children;
});
