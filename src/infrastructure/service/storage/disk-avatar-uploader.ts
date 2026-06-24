import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ConfigPort } from "@/application/shared/port/config.port";
import type {
  AvatarFile,
  AvatarUploaderPort,
} from "@/application/user/port/avatar-uploader.port";
import type { UserId } from "@/domain/user/value-object/user-id";

const DEFAULT_UPLOAD_DIR = "public/uploads/images/user/avatar";

const EXTENSION_BY_MIME_TYPE: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class DiskAvatarUploader implements AvatarUploaderPort {
  public constructor(private readonly config: ConfigPort) {}

  public async upload(userId: UserId, file: AvatarFile): Promise<string> {
    const directory = this.uploadDir();
    await mkdir(directory, { recursive: true });

    const avatarName = this.buildName(userId, file);
    await writeFile(join(directory, avatarName), file.buffer);

    return avatarName;
  }

  public async delete(avatarName: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir(), avatarName));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  private uploadDir(): string {
    return this.config.getString("AVATAR_UPLOAD_DIR", DEFAULT_UPLOAD_DIR);
  }

  private buildName(userId: UserId, file: AvatarFile): string {
    const hash = createHash("sha256")
      .update(userId.toString())
      .update(randomUUID())
      .update(file.buffer)
      .digest("hex")
      .slice(0, 32);

    const extension = EXTENSION_BY_MIME_TYPE[file.mimeType] ?? "bin";

    return `${hash}.${extension}`;
  }
}
