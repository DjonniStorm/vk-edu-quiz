import type { AuthResponseDto, CurrentUserDto } from "@quiz/shared";

import { BaseApi } from "../base-api";
import { authTokenStorage } from "../http-client";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface MeResponseDto {
  user: CurrentUserDto;
}

export const AUTH_SCOPE = "auth";

class AuthApi extends BaseApi {
  private static instance: AuthApi;

  private constructor() {
    super("/auth");
  }

  static getInstance(): AuthApi {
    if (!AuthApi.instance) {
      AuthApi.instance = new AuthApi();
    }

    return AuthApi.instance;
  }

  async register(input: RegisterInput): Promise<AuthResponseDto> {
    const { data } = await this.post<AuthResponseDto>("/register", input, {
      meta: { silent: true, scope: AUTH_SCOPE },
    });

    authTokenStorage.setAccessToken(data.tokens.accessToken);

    return data;
  }

  async login(input: LoginInput): Promise<AuthResponseDto> {
    const { data } = await this.post<AuthResponseDto>("/login", input, {
      meta: { silent: true, scope: AUTH_SCOPE },
    });

    authTokenStorage.setAccessToken(data.tokens.accessToken);

    return data;
  }

  async me(): Promise<CurrentUserDto> {
    const { data } = await this.get<MeResponseDto>("/me", {
      meta: { silent: true, scope: AUTH_SCOPE },
    });

    return data.user;
  }

  logout(): void {
    authTokenStorage.clearAccessToken();
  }

  hasAccessToken(): boolean {
    return Boolean(authTokenStorage.getAccessToken());
  }
}

export const authApi = AuthApi.getInstance();
