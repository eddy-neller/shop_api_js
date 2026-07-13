import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { UserRole } from "@/domain/user/value-object/access/user-role";
import type { AuthenticatedUser } from "@/presentation/http/shared/auth/authenticated-user";
import { ROLES_KEY } from "@/presentation/http/shared/decorator/roles.decorator";

// Hierarchie de roles (miroir du role_hierarchy de l'API source): un role herite
// des privileges des roles situes en dessous.
const ROLE_HIERARCHY: Record<string, readonly string[]> = {
  [UserRole.SuperAdmin]: [UserRole.Admin],
  [UserRole.Admin]: [UserRole.Moderator],
  [UserRole.Moderator]: [UserRole.User],
  [UserRole.User]: [],
};

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (user === undefined) {
      throw new ForbiddenException("Authentication required.");
    }

    const granted = this.expandRoles(user.roles);
    const allowed = requiredRoles.some((role) => granted.has(role));

    if (!allowed) {
      throw new ForbiddenException("Insufficient role.");
    }

    return true;
  }

  private expandRoles(roles: string[]): Set<string> {
    const granted = new Set<string>();
    const stack = [...roles];

    while (stack.length > 0) {
      const role = stack.pop();

      if (role === undefined || granted.has(role)) {
        continue;
      }

      granted.add(role);
      stack.push(...(ROLE_HIERARCHY[role] ?? []));
    }

    return granted;
  }
}
