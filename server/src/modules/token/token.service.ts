import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { expiryDate } from "@/lib/utils/general.util";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { UserRole } from "@prisma/client";
import { EnvService } from "@/modules/env/env.service";
import type { Request, Response } from "express";
import { CookieService } from "@/lib/actions/cookie.action";

export interface TokenPayload {
  sub: string;
  roles: UserRole[];
}

interface TokensType {
  accessToken: string;
  refreshToken: string;
  tokenId: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly env: EnvService,
    private readonly prisma: PrismaService,
    private readonly cookieService: CookieService
  ) {}

  async generateTokens(req: Request, payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.env.get("JWT_ACCESS_SECRET"),
        expiresIn: this.env.get("ACCESS_TOKEN_EXP"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.env.get("JWT_REFRESH_SECRET"),
        expiresIn: this.env.get("REFRESH_TOKEN_EXP"),
      }),
    ]);

    const tokenId = req.cookies["tokenId"] || "undefined";
    const refreshExp = expiryDate(this.env.get("REFRESH_TOKEN_EXP"), true);

    const tokenData = {
      token: refreshToken,
      userId: payload.sub,
      ip: req.ip || "Unknown IP",
      userAgent: req.headers["user-agent"] || "Unknown User Agent",
      lastUsed: new Date(),
      blacklisted: false,
      isActive: true,
      expiresAt: refreshExp,
    };

    const newToken = await this.prisma.refreshToken.upsert({
      where: { id: tokenId },
      update: tokenData,
      create: tokenData,
    });

    return { accessToken, refreshToken, tokenId: newToken.id };
  }

  async verifyToken(
    token: string,
    type: "access" | "refresh"
  ): Promise<TokenPayload | null> {
    const secret =
      type === "access"
        ? this.env.get("JWT_ACCESS_SECRET")
        : this.env.get("JWT_REFRESH_SECRET");
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(token, { secret });
    } catch (error) {
      return null;
    }
  }

  async refreshTokens(req: Request, res: Response, payload: TokenPayload) {
    const refreshToken = req.cookies["refreshToken"];

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken, blacklisted: false },
    });

    if (!tokenRecord) {
      throw new Error("Invalid or expired refresh token.");
    }

    await this.createAuthSession(req, res, {
      id: payload.sub,
      roles: payload.roles,
    });
  }

  async createAuthSession(req: Request, res: Response, user: Express.User) {
    const tokens = await this.generateTokens(req, {
      sub: user.id,
      roles: user.roles,
    });
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  attachDecodedUser = (req: Request, decoded: TokenPayload) => {
    if (decoded) req["user"] = { id: decoded.sub, roles: decoded.roles };
  };

  setAuthCookies(res: Response, tokens: TokensType): void {
    const { accessToken, refreshToken, tokenId } = tokens;
    const accessExp = expiryDate(this.env.get("ACCESS_TOKEN_EXP"), true);
    const refreshExp = expiryDate(this.env.get("REFRESH_TOKEN_EXP"), true);

    this.cookieService.setCookie(res, "accessToken", accessToken, {
      expires: accessExp,
    });
    this.cookieService.setCookie(res, "refreshToken", refreshToken, {
      expires: refreshExp,
    });
    this.cookieService.setCookie(res, "tokenId", tokenId, {
      expires: refreshExp,
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("tokenId");
  }
}
