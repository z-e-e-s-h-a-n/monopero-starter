import { Module } from "@nestjs/common";
import { TokenService } from "./token.service";
import { JwtModule } from "@nestjs/jwt";
import { CookieService } from "@utils/cookie.util";

@Module({
  imports: [JwtModule.register({})],
  providers: [TokenService, CookieService],
  exports: [TokenService],
})
export class TokenModule {}
