import { describe, expect, it } from "vitest";
import { InvalidFirstnameException } from "@/domain/user/exception/profile/invalid-firstname.exception";
import { InvalidLastnameException } from "@/domain/user/exception/profile/invalid-lastname.exception";
import { Firstname } from "@/domain/user/value-object/profile/firstname";
import { Lastname } from "@/domain/user/value-object/profile/lastname";

describe("Firstname value object", () => {
  it("trims and keeps a valid firstname", () => {
    expect(Firstname.fromString("  John  ").toString()).toBe("John");
  });

  it("rejects an empty firstname", () => {
    expect(() => Firstname.fromString("   ")).toThrow(InvalidFirstnameException);
  });

  it("rejects a too short firstname", () => {
    expect(() => Firstname.fromString("J")).toThrow(InvalidFirstnameException);
  });

  it("rejects a too long firstname", () => {
    expect(() => Firstname.fromString("a".repeat(51))).toThrow(
      InvalidFirstnameException,
    );
  });
});

describe("Lastname value object", () => {
  it("trims and keeps a valid lastname", () => {
    expect(Lastname.fromString("  Doe  ").toString()).toBe("Doe");
  });

  it("rejects an invalid lastname", () => {
    expect(() => Lastname.fromString("D")).toThrow(InvalidLastnameException);
  });
});
