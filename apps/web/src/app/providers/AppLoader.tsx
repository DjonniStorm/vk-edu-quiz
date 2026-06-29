import { Loader, Overlay } from "@mantine/core";
import { NavigationProgress, nprogress } from "@mantine/nprogress";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";

import { loaderStore } from "@/shared/api";

const SHOW_DELAY = 250;
const MIN_VISIBLE = 400;

export const AppLoader = observer(() => {
  const blocking = loaderStore.isBlockingActive;
  const nonBlocking = loaderStore.isNonBlockingActive;
  const [overlayVisible, setOverlayVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (nonBlocking) {
      nprogress.start();
    } else {
      nprogress.complete();
    }
  }, [nonBlocking]);

  useEffect(() => {
    if (blocking) {
      if (overlayVisible) {
        return;
      }

      const timer = window.setTimeout(() => {
        shownAt.current = Date.now();
        setOverlayVisible(true);
      }, SHOW_DELAY);

      return () => window.clearTimeout(timer);
    }

    if (!overlayVisible) {
      return;
    }

    const remaining = Math.max(MIN_VISIBLE - (Date.now() - shownAt.current), 0);
    const timer = window.setTimeout(() => setOverlayVisible(false), remaining);

    return () => window.clearTimeout(timer);
  }, [blocking, overlayVisible]);

  return (
    <>
      <NavigationProgress />
      {overlayVisible ? (
        <Overlay fixed zIndex={1000} backgroundOpacity={0.35} blur={2} center>
          <Loader />
        </Overlay>
      ) : null}
    </>
  );
});
