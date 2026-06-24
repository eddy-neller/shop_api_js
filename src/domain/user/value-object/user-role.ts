import { InvalidRoleException } from '@/domain/user/exception/invalid-role.exception';

export enum UserRole {
  User = 'ROLE_USER',
  Moderator = 'ROLE_MODERATEUR',
  Admin = 'ROLE_ADMIN',
  SuperAdmin = 'ROLE_SUPER_ADMIN'
}

export function toUserRole(value: string): UserRole {
  const roles = Object.values(UserRole) as string[];

  if (!roles.includes(value)) {
    throw InvalidRoleException.unknown(value);
  }

  const role = value as UserRole;

  if (role === UserRole.SuperAdmin) {
    throw InvalidRoleException.notAssignable(value);
  }

  return role;
}
