import type { AvatarFile } from "@/application/account/port/avatar-uploader.port";

export class UpdateAvatarCommand {
  public constructor(
    public readonly userId: string,
    public readonly file: AvatarFile,
  ) {}
}
