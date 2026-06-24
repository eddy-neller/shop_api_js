import type { UserId } from "@/domain/user/value-object/user-id";

export const AVATAR_UPLOADER = Symbol("AVATAR_UPLOADER");

export type AvatarFile = {
  buffer: Buffer;
  mimeType: string;
  size: number;
  originalName: string;
};

export interface AvatarUploaderPort {
  upload(userId: UserId, file: AvatarFile): Promise<string>;
  delete(avatarName: string): Promise<void>;
}
