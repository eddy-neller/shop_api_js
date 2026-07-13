import type { AvatarFile } from "@/application/account/port/avatar-uploader.port";

export const AVATAR_IMAGE_VALIDATOR = Symbol("AVATAR_IMAGE_VALIDATOR");

export interface AvatarImageValidatorPort {
  validate(file: AvatarFile): Promise<void>;
}
