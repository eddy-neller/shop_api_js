import type { AvatarFile } from "@/application/user/port/avatar-uploader.port";

export class UpdateAvatarCommand {
  public constructor(
    public readonly userId: string,
    public readonly file: AvatarFile,
  ) {}
}
