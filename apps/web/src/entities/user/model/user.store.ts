import { makeAutoObservable, runInAction } from "mobx";

import type { CurrentUserDto } from "@quiz/shared";
import { LANG_KEYS } from "@/app/i18n";
import { errorStore } from "@/entities/error";
import {
  authApi,
  isCancelError,
  isUnauthorizedError,
  type LoginInput,
  type RegisterInput,
} from "@/shared/api";

import { getAuthErrorMessage } from "../lib/auth-error";

export interface AuthActionResult {
  success: boolean;
  message?: string;
}

export class UserStore {
  currentUser: CurrentUserDto | null = null;
  isInitialized = false;
  isInitializing = false;

  constructor() {
    makeAutoObservable(this);
  }

  get isAuthenticated() {
    return Boolean(this.currentUser);
  }

  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    try {
      if (authApi.hasAccessToken()) {
        await this.loadCurrentUser();
      }
    } finally {
      runInAction(() => {
        this.isInitializing = false;
        this.isInitialized = true;
      });
    }
  }

  async loadCurrentUser(): Promise<boolean> {
    const isFirstLoad = !this.currentUser;

    try {
      const currentUser = await authApi.me({
        level: "blocking",
        silent: !isFirstLoad,
      });

      runInAction(() => {
        this.currentUser = currentUser;
      });

      return true;
    } catch (error) {
      if (isCancelError(error)) {
        return false;
      }

      if (isUnauthorizedError(error)) {
        this.logout();

        return false;
      }

      if (isFirstLoad) {
        errorStore.pushFromUnknown(error, "Не удалось загрузить пользователя");
      }

      return false;
    }
  }

  async login(input: LoginInput): Promise<AuthActionResult> {
    try {
      const response = await authApi.login(input);

      runInAction(() => {
        this.currentUser = response.user;
        this.isInitialized = true;
      });

      return { success: true };
    } catch (error) {
      if (isCancelError(error)) {
        return { success: false };
      }

      return {
        success: false,
        message: getAuthErrorMessage(error, LANG_KEYS.auth.errors.loginFailed),
      };
    }
  }

  async register(input: RegisterInput): Promise<AuthActionResult> {
    try {
      const response = await authApi.register(input);

      runInAction(() => {
        this.currentUser = response.user;
        this.isInitialized = true;
      });

      return { success: true };
    } catch (error) {
      if (isCancelError(error)) {
        return { success: false };
      }

      return {
        success: false,
        message: getAuthErrorMessage(error, LANG_KEYS.auth.errors.registerFailed),
      };
    }
  }

  logout() {
    authApi.logout();

    runInAction(() => {
      this.currentUser = null;
      this.isInitialized = true;
      this.isInitializing = false;
    });
  }
}

export const userStore = new UserStore();
