import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "@/decorators/public.decorator";
import type { Request, Response } from "express";
import { TokenService } from "@/modules/token/token.service";
import { PrismaService } from "@/modules/prisma/prisma.service";

@Controller("oauth")
export class OAuthController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService
  ) {}

  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin() {}

  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = req.user!;
    await this.tokenService.createAuthSession(req, res, user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return res.redirect("/");
  }

  @Public()
  @Get("facebook")
  @UseGuards(AuthGuard("facebook"))
  facebookLogin() {}

  @Public()
  @Get("facebook/callback")
  @UseGuards(AuthGuard("facebook"))
  async facebookCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = req.user!;
    await this.tokenService.createAuthSession(req, res, user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return res.redirect("/");
  }
}
