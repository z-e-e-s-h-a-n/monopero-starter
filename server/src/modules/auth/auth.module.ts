import { Module } from "@nestjs/common";
import { OtpService } from "./otp.service";
import { AuthService } from "./auth.service";
import { OAuthService } from "./oauth.service";
import { AuthController } from "./auth.controller";
import { OAuthController } from "./oauth.controller";
import { PassportModule } from "@nestjs/passport";
import { TokenModule } from "@/modules/token/token.module";

@Module({
  imports: [TokenModule, PassportModule],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, OtpService, OAuthService],
  exports: [AuthService],
})
export class AuthModule {}
