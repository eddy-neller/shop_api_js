import type { User } from "@/domain/user/model/user.aggregate";

export class UserReadModel {
  public constructor(
    public readonly id: string,
    public readonly firstname: string | null,
    public readonly lastname: string | null,
    public readonly username: string,
    public readonly email: string,
    public readonly roles: string[],
    public readonly status: number,
    public readonly avatarName: string | null,
    public readonly lastVisit: string,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}

  public static fromUser(user: User): UserReadModel {
    return new UserReadModel(
      user.getId().toString(),
      user.getFirstname(),
      user.getLastname(),
      user.getUsername().toString(),
      user.getEmail().toString(),
      user.getRoles(),
      user.getStatus().toNumber(),
      user.getAvatarName(),
      user.getLastVisit().toISOString(),
      user.getCreatedAt().toISOString(),
      user.getUpdatedAt().toISOString(),
    );
  }
}
