import { Injectable } from "@nestjs/common";
import type { ConfigPort } from "@/application/shared/port/config.port";

@Injectable()
export class EnvConfig implements ConfigPort {
  public getString(name: string, defaultValue: string): string {
    const value = process.env[name];

    return value === undefined || value.trim() === "" ? defaultValue : value;
  }

  public getNumber(name: string, defaultValue: number): number {
    const value = process.env[name];

    if (value === undefined || value.trim() === "") {
      return defaultValue;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
}
