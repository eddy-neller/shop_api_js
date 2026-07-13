import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import {
  ACCESS_TOKEN_PROVIDER,
  type AccessTokenProviderPort,
} from "@/application/auth/port/access-token-provider.port";
import type { AuthenticatedUser } from "@/presentation/http/shared/auth/authenticated-user";
import { IS_PUBLIC_KEY } from "@/presentation/http/shared/decorator/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    @Inject(ACCESS_TOKEN_PROVIDER)
    private readonly accessTokens: AccessTokenProviderPort,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractBearerToken(request);

    if (token === null) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    try {
      const claims = this.accessTokens.verify(token);
      request.user = {
        id: claims.sub,
        email: claims.email,
        username: claims.username,
        roles: claims.roles,
      };
    } catch {
      throw new UnauthorizedException("Invalid bearer token.");
    }

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;

    if (header === undefined) {
      return null;
    }

    const [scheme, value] = header.split(" ");

    if (scheme !== "Bearer" || value === undefined || value.trim() === "") {
      return null;
    }

    return value;
  }
}
