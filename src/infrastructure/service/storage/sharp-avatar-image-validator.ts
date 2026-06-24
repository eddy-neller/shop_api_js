import sharp from "sharp";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type { AvatarImageValidatorPort } from "@/application/user/port/avatar-image-validator.port";
import type { AvatarFile } from "@/application/user/port/avatar-uploader.port";
import { InvalidAvatarException } from "@/domain/user/exception/invalid-avatar.exception";

const DEFAULT_MAX_SIZE = 2_097_152; // 2 MiB
const DEFAULT_MAX_DIMENSION = 512;

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export class SharpAvatarImageValidator implements AvatarImageValidatorPort {
  public constructor(private readonly config: ConfigPort) {}

  public async validate(file: AvatarFile): Promise<void> {
    if (file.size <= 0 || file.buffer.length === 0) {
      throw InvalidAvatarException.missing();
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
      throw InvalidAvatarException.invalidMimeType(file.mimeType);
    }

    const maxSize = this.config.getNumber("AVATAR_MAX_SIZE", DEFAULT_MAX_SIZE);
    if (file.size > maxSize) {
      throw InvalidAvatarException.tooLarge(maxSize);
    }

    const maxDimension = this.config.getNumber(
      "AVATAR_MAX_DIMENSION",
      DEFAULT_MAX_DIMENSION,
    );

    const { width, height } = await sharp(file.buffer).metadata();

    if (
      width === undefined ||
      height === undefined ||
      width > maxDimension ||
      height > maxDimension
    ) {
      throw InvalidAvatarException.invalidDimensions(maxDimension);
    }
  }
}
