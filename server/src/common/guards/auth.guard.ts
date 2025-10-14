import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { IS_PUBLIC_KEY } from "@/decorators/public.decorator";
import { ROLES_KEY } from "@/decorators/roles.decorator";
import type { UserRole } from "@prisma/client";
import { TokenService } from "@/modules/token/token.service";
import { LoggerService } from "@/modules/logger/logger.service";
import { InjectLogger } from "@/decorators/logger.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  @InjectLogger()
  private readonly logger!: LoggerService;

  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const accessToken = req.cookies["accessToken"];
    const refreshToken = req.cookies["refreshToken"];

    try {
      if (!accessToken) {
        this.logger.warn(`Access token missing}`, {
          route: req.url,
        });
        throw new Error("Access token is missing or expired");
      }
      const decoded = await this.tokenService.verifyToken(
        accessToken,
        "access"
      );
      if (!decoded) throw new UnauthorizedException("Invalid Access Token");
      this.checkRoles(decoded.roles, requiredRoles);
      this.tokenService.attachDecodedUser(req, decoded);
      this.logger.debug(`✅ User Attached - Auth success`, {
        userId: decoded.sub,
      });
      return true;
    } catch (err) {
      if (!refreshToken)
        throw new UnauthorizedException("Refresh token is missing");

      try {
        const decoded = await this.tokenService.verifyToken(
          refreshToken,
          "refresh"
        );
        if (!decoded) throw new Error("Invalid or expire Refresh Token");
        this.logger.debug(`Refresh token verified`, {
          userId: decoded.sub,
        });
        this.checkRoles(decoded.roles, requiredRoles);
        await this.tokenService.refreshTokens(req, res, decoded);

        if (!req["user"]) throw new UnauthorizedException("User not found");

        this.logger.log(`✅ Auth success`, {
          userId: req.user?.id,
          method: req.method,
        });

        return true;
      } catch {
        this.logger.warn(`Access denied: Missing or invalid token`);

        throw new UnauthorizedException(
          "Unauthorized: Invalid or expired token."
        );
      }
    }
  }

  private checkRoles(userRoles: UserRole[], requiredRoles?: UserRole[]) {
    if (requiredRoles?.length) {
      const hasRole = userRoles.some((role) => requiredRoles.includes(role));
      if (!hasRole) {
        throw new UnauthorizedException(
          `Forbidden: Requires ${requiredRoles.join(", ")} access.`
        );
      }
    }
  }
}
