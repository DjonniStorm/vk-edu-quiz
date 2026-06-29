import { makeAutoObservable } from "mobx";

export type LoaderLevel = "blocking" | "non-blocking";

export interface RequestMeta {
  level?: LoaderLevel;
  scope?: string;
  silent?: boolean;
  requestId?: string;
}

export interface LoaderRecord {
  id: string;
  level: LoaderLevel;
  scope: string;
  silent: boolean;
  startedAt: number;
}

export class LoaderStore {
  private records = new Map<string, LoaderRecord>();
  private controllers = new Map<string, AbortController>();

  constructor() {
    makeAutoObservable<this, "controllers">(this, {
      controllers: false,
      isScopeActive: false,
    });
  }

  start(record: LoaderRecord, controller?: AbortController): void {
    this.records.set(record.id, record);

    if (controller) {
      this.controllers.set(record.id, controller);
    }
  }

  finish(id: string): void {
    this.records.delete(id);
    this.controllers.delete(id);
  }

  abortScope(scope: string): void {
    for (const [id, record] of this.records) {
      if (record.scope === scope) {
        this.controllers.get(id)?.abort();
      }
    }
  }

  abortAll(): void {
    for (const controller of this.controllers.values()) {
      controller.abort();
    }
  }

  get isBlockingActive(): boolean {
    for (const record of this.records.values()) {
      if (!record.silent && record.level === "blocking") {
        return true;
      }
    }

    return false;
  }

  get isNonBlockingActive(): boolean {
    for (const record of this.records.values()) {
      if (!record.silent && record.level === "non-blocking") {
        return true;
      }
    }

    return false;
  }

  isScopeActive(scope: string): boolean {
    for (const record of this.records.values()) {
      if (record.scope === scope) {
        return true;
      }
    }

    return false;
  }
}

export const loaderStore = new LoaderStore();
