import type { AxiosRequestConfig } from "axios";

import { httpClient } from "./http-client";

export abstract class BaseApi {
  protected constructor(protected readonly prefix: string) {}

  protected path(segment: string): string {
    return `${this.prefix}${segment}`;
  }

  protected get<T>(segment: string, config?: AxiosRequestConfig) {
    return httpClient.get<T>(this.path(segment), config);
  }

  protected post<T>(segment: string, body?: unknown, config?: AxiosRequestConfig) {
    return httpClient.post<T>(this.path(segment), body, config);
  }

  protected patch<T>(segment: string, body?: unknown, config?: AxiosRequestConfig) {
    return httpClient.patch<T>(this.path(segment), body, config);
  }

  protected put<T>(segment: string, body?: unknown, config?: AxiosRequestConfig) {
    return httpClient.put<T>(this.path(segment), body, config);
  }

  protected delete<T>(segment: string, config?: AxiosRequestConfig) {
    return httpClient.delete<T>(this.path(segment), config);
  }
}
