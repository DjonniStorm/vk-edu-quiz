export interface EnvConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtAccessTokenTtlSec: number;
}

export interface EnvConfigProvider {
  get(): EnvConfig;
}
