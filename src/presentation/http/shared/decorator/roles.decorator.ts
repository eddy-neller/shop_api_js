import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@/domain/user/value-object/access/user-role";

export const ROLES_KEY = "roles";

// Restreint une route aux porteurs d'au moins un des roles requis (RolesGuard).
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
