import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  ChangeIdentifierDto,
  RequestOtpDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  ValidateOtpDto,
} from "@/dto/auth.dto";
import type { Request, Response } from "express";
import { Public } from "@/decorators/public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Public()
  @Post("signin")
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    return this.authService.signIn(dto, req, res);
  }

  @Post("signout")
  async signOut(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    return this.authService.signOut(req, res);
  }

  @Public()
  @Post("request-otp")
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Get("validate-otp")
  async validateOtp(
    @Query() dto: ValidateOtpDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    return this.authService.validateOtp(dto, req, res);
  }

  @Public()
  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("change-identifier")
  async changeIdentifier(@Body() dto: ChangeIdentifierDto) {
    return this.authService.changeIdentifierReq(dto);
  }

  @Public()
  @Get("change-identifier")
  async verifyIdentifier(@Query() dto: ChangeIdentifierDto) {
    return this.authService.changeIdentifier(dto);
  }
}
