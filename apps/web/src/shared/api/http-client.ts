import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

import { env } from "@/shared/config/env";
import { getRouteKey } from "./route-key";
import { loaderStore, type LoaderLevel, type RequestMeta } from "./loader.store";

declare module "axios" {
  interface AxiosRequestConfig {
    meta?: RequestMeta;
  }
}

const accessTokenStorageKey = "vk-edu-quiz-access-token";

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(accessTokenStorageKey);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  const meta = config.meta ?? {};
  const level: LoaderLevel = meta.level ?? "non-blocking";
  const scope = meta.scope ?? getRouteKey();
  const silent = meta.silent ?? false;
  const id = crypto.randomUUID();

  let controller: AbortController | undefined;

  if (!config.signal) {
    controller = new AbortController();
    config.signal = controller.signal;
  }

  config.meta = { ...meta, level, scope, silent, requestId: id };
  loaderStore.start({ id, level, scope, silent, startedAt: Date.now() }, controller);

  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    const id = response.config.meta?.requestId;

    if (id) {
      loaderStore.finish(id);
    }

    return response;
  },
  (error) => {
    const id = (error.config as InternalAxiosRequestConfig | undefined)?.meta?.requestId;

    if (id) {
      loaderStore.finish(id);
    }

    return Promise.reject(error);
  },
);

export const authTokenStorage = {
  getAccessToken: () => localStorage.getItem(accessTokenStorageKey),
  setAccessToken: (accessToken: string) => localStorage.setItem(accessTokenStorageKey, accessToken),
  clearAccessToken: () => localStorage.removeItem(accessTokenStorageKey),
};
