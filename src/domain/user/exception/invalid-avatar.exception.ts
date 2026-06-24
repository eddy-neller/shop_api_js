import { UserDomainException } from "@/domain/user/exception/user-domain-exception";

export class InvalidAvatarException extends UserDomainException {
  public static missing(): InvalidAvatarException {
    return new InvalidAvatarException("No avatar file provided.");
  }

  public static invalidMimeType(mimeType: string): InvalidAvatarException {
    return new InvalidAvatarException(`Invalid avatar file type: ${mimeType}.`);
  }

  public static tooLarge(maxSize: number): InvalidAvatarException {
    return new InvalidAvatarException(
      `Avatar file exceeds the maximum allowed size (${maxSize} bytes).`,
    );
  }

  public static invalidDimensions(maxDimension: number): InvalidAvatarException {
    return new InvalidAvatarException(
      `Avatar dimensions exceed the maximum allowed (${maxDimension}x${maxDimension}).`,
    );
  }
}
