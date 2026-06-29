import { Loader } from "@mantine/core";
import type { ReactNode } from "react";
import { Suspense } from "react";

interface LazyPageProps {
  children: ReactNode;
}

export const LazyPage = ({ children }: LazyPageProps) => {
  return (
    <Suspense fallback={<Loader />}>
      {children}
    </Suspense>
  );
};
