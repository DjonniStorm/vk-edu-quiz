import { makeAutoObservable } from "mobx";

import { getApiErrorMessage } from "@/shared/api";
import { showErrorNotification } from "@/shared/lib";

export interface AppErrorItem {
  id: string;
  message: string;
  createdAt: number;
}

export class ErrorStore {
  errors: AppErrorItem[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  push(message: string): string {
    const item: AppErrorItem = {
      id: crypto.randomUUID(),
      message,
      createdAt: Date.now(),
    };

    this.errors.push(item);
    showErrorNotification(message);

    return item.id;
  }

  pushFromUnknown(error: unknown, fallback: string): string {
    return this.push(getApiErrorMessage(error, fallback));
  }

  remove(id: string): void {
    this.errors = this.errors.filter((item) => item.id !== id);
  }

  clear(): void {
    this.errors = [];
  }
}

export const errorStore = new ErrorStore();
