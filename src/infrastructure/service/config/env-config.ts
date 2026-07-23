import { Injectable } from "@nestjs/common";
import type { ConfigPort } from "@/application/shared/port/config.port";

const DEFAULT_STRING_VALUES: Readonly<Record<string, string>> = {
  REGISTER_TOKEN_TTL: "P2D",
  RESET_PASSWORD_TOKEN_TTL: "PT15M",
  JWT_ACCESS_TTL: "PT15M",
  JWT_REFRESH_TTL: "P30D",
  AVATAR_UPLOAD_DIR: "public/uploads/images/user/avatar",
  AVATAR_BASE_URL: "/uploads/images/user/avatar",
};

const DEFAULT_NUMBER_VALUES: Readonly<Record<string, number>> = {
  BCRYPT_SALT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  AVATAR_MAX_SIZE: 2_097_152,
  AVATAR_MAX_DIMENSION: 512,
};

@Injectable()
export class EnvConfig implements ConfigPort {
  public getString(name: string, defaultValue?: string): string {
    const value = process.env[name];

    if (value !== undefined && value.trim() !== "") {
      return value;
    }

    return this.getDefaultStringValue(name, defaultValue);
  }

  public getNumber(name: string, defaultValue?: number): number {
    const value = process.env[name];

    if (value === undefined || value.trim() === "") {
      return this.getDefaultNumberValue(name, defaultValue);
    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : this.getDefaultNumberValue(name, defaultValue);
  }

  private getDefaultStringValue(name: string, defaultValue?: string): string {
    const value = defaultValue ?? DEFAULT_STRING_VALUES[name];

    if (value === undefined) {
      throw new Error(`${name} must be defined.`);
    }

    return value;
  }

  private getDefaultNumberValue(name: string, defaultValue?: number): number {
    const value = defaultValue ?? DEFAULT_NUMBER_VALUES[name];

    if (value === undefined) {
      throw new Error(`${name} must be defined and finite.`);
    }

    return value;
  }
}
