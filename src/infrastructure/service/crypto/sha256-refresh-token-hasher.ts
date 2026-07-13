import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { RefreshTokenHasherPort } from "@/application/auth/port/refresh-token-hasher.port";

@Injectable()
export class Sha256RefreshTokenHasher implements RefreshTokenHasherPort {
  public hash(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }
}
