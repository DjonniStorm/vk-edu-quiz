import { Box } from "@mantine/core";
import { useEffect, useState } from "react";

import { questionFallbackImage } from "@/shared/assets";

export interface QuizImageProps {
  imageUrl: string | null | undefined;
  alt: string;
  maxHeight?: number;
  fit?: "cover" | "contain";
}

export const QuizImage = ({
  imageUrl,
  alt,
  maxHeight = 240,
  fit = "contain",
}: QuizImageProps) => {
  const trimmedUrl = imageUrl?.trim();
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [trimmedUrl]);

  if (!trimmedUrl) {
    return null;
  }

  const src = useFallback ? questionFallbackImage : trimmedUrl;

  return (
    <Box
      style={{
        width: "100%",
        maxHeight,
        borderRadius: 8,
        overflow: "hidden",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setUseFallback(true)}
        style={{
          display: "block",
          width: "100%",
          maxHeight,
          objectFit: fit,
        }}
      />
    </Box>
  );
};
