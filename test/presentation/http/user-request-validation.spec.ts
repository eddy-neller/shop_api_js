import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { UpdatePasswordRequest } from "@/presentation/http/account/dto/update-password.request";
import { RegisterUserRequest } from "@/presentation/http/onboarding/dto/register-user.request";

const VALIDATION_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
} as const;

async function validateRequest<T extends object>(
  cls: new () => T,
  payload: Record<string, unknown>,
): Promise<string[]> {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance, VALIDATION_OPTIONS);

  return errors.flatMap((error) => collectProperties(error));
}

function collectProperties(error: {
  property: string;
  children?: { property: string; children?: unknown[] }[];
}): string[] {
  if (!error.children || error.children.length === 0) {
    return [error.property];
  }

  return error.children.flatMap((child) =>
    collectProperties(child as never).map((path) => `${error.property}.${path}`),
  );
}

describe("RegisterUserRequest validation", () => {
  const base = {
    email: "jane@example.com",
    username: "jane",
    password: "Password1!",
  };

  it("accepts a valid payload without preferences", async () => {
    expect(await validateRequest(RegisterUserRequest, base)).toEqual([]);
  });

  it("accepts a valid 2-letter lang", async () => {
    expect(
      await validateRequest(RegisterUserRequest, {
        ...base,
        preferences: { lang: "fr" },
      }),
    ).toEqual([]);
  });

  it("rejects a non-string lang", async () => {
    expect(
      await validateRequest(RegisterUserRequest, {
        ...base,
        preferences: { lang: 42 },
      }),
    ).toContain("preferences.lang");
  });

  it("accepts a valid en lang", async () => {
    expect(
      await validateRequest(RegisterUserRequest, {
        ...base,
        preferences: { lang: "en" },
      }),
    ).toEqual([]);
  });

  it("rejects unknown keys inside preferences", async () => {
    expect(
      await validateRequest(RegisterUserRequest, {
        ...base,
        preferences: { lang: "fr", evil: "x" },
      }),
    ).toContain("preferences.evil");
  });
});

describe("UpdatePasswordRequest validation", () => {
  it("accepts a well-formed password change request", async () => {
    expect(
      await validateRequest(UpdatePasswordRequest, {
        currentPassword: "OldPass1!",
        newPassword: "NewPass1!",
      }),
    ).toEqual([]);
  });

  it("rejects a new password that violates the password policy", async () => {
    expect(
      await validateRequest(UpdatePasswordRequest, {
        currentPassword: "OldPass1!",
        newPassword: "weak",
      }),
    ).toContain("newPassword");
  });
});
