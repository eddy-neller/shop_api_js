import { randomInt } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type {
  SplitToken,
  TokenProviderPort,
} from "@/application/user/port/token-provider.port";
import type { Email } from "@/domain/user/value-object/email";

const KEYSPACE =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TOKEN_SEPARATOR = "&";

@Injectable()
export class Base64TokenProvider implements TokenProviderPort {
  public generateRandomToken(): string {
    const pieces: string[] = [];

    for (let index = 0; index < 64; index += 1) {
      pieces.push(KEYSPACE[randomInt(0, KEYSPACE.length)] ?? "");
    }

    return pieces.join("");
  }

  public encode(token: string, email: Email): string {
    return Buffer.from(`${email.toString()}${TOKEN_SEPARATOR}${token}`).toString(
      "base64",
    );
  }

  public split(encodedToken: string): SplitToken {
    const decoded = Buffer.from(encodedToken, "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(TOKEN_SEPARATOR);

    if (separatorIndex < 0) {
      return {};
    }

    return {
      email: decoded.slice(0, separatorIndex),
      token: decoded.slice(separatorIndex + TOKEN_SEPARATOR.length),
    };
  }
}
