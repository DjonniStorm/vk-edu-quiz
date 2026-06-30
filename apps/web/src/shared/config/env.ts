const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const deriveWsBaseUrl = (httpUrl: string): string => {
  if (httpUrl.startsWith("https://")) {
    return httpUrl.replace("https://", "wss://");
  }

  return httpUrl.replace("http://", "ws://");
};

export const env = {
  apiBaseUrl,
  wsBaseUrl: import.meta.env.VITE_WS_URL ?? deriveWsBaseUrl(apiBaseUrl),
} as const;
