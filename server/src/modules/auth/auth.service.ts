import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import argon2 from "argon2";
import { PrismaService } from "@/modules/prisma/prisma.service";
import {
  ChangeIdentifierDto,
  RequestOtpDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  ValidateOtpDto,
} from "@/dto/auth.dto";
import { TokenService } from "@/modules/token/token.service";
import { Prisma, type User } from "@prisma/client";
import { OtpService } from "./otp.service";
import { NotificationService } from "@/modules/notification/notification.service";
import { LoggerService } from "@/modules/logger/logger.service";
import { InjectLogger } from "@/common/decorators/logger.decorator";

@Injectable()
export class AuthService {
  @InjectLogger()
  private readonly logger!: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    private readonly notifyService: NotificationService
  ) {}

  async signUp(dto: SignUpDto) {
    const { key, value, query } = this.parseIdentifier(dto.identifier);
    this.logger.log(`🔐 Sign-up attempt`, {
      identifier: dto.identifier,
    });

    const existingUser = await this.prisma.user.findUnique({
      where: query,
    });

    if (existingUser) {
      throw new BadRequestException(`${key} already in use.`);
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        [key]: value,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        displayName: `${dto.firstName} ${dto.lastName}`.trim(),
        username: dto.username,
        roles: { create: [{ role: "customer" }] },
      },
    });

    await this.otpService.sendOtp({
      userId: newUser.id,
      identifier: value,
      purpose: "verifyIdentifier",
      metadata: { user: newUser },
    });

    await this.notifyService.sendNotification({
      userId: newUser.id,
      purpose: "signup",
      to: value,
      metadata: { user: newUser },
    });

    this.logger.log(`✅ Sign-up success`, {
      userId: newUser.id,
      identifier: dto.identifier,
    });

    return {
      message: `User created successfully. Please verify your ${key}.`,
    };
  }

  async signIn(dto: SignInDto, req: Request, res: Response) {
    const { user, key, value } = await this.findUserByIdentifier(
      dto.identifier,
      {
        roles: true,
        securitySetting: true,
      }
    );

    this.logger.log(`🔐 Sign-in attempt`, {
      identifier: dto.identifier,
    });

    if (!user.password) {
      await this.otpService.sendOtp({
        userId: user.id,
        purpose: "setPassword",
        identifier: value,
        type: "token",
        metadata: { user },
      });

      throw new UnauthorizedException(
        "Password not set. Please set your password to continue."
      );
    }

    const isPasswordValid = await this.verifyPassword(
      dto.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.checkVerificationStatus(user, key, value, "unverified");

    if (user.securitySetting?.isMfaEnabled) {
      const otp = await this.otpService.sendOtp({
        userId: user.id,
        identifier: value,
        purpose: "verifyMfa",
        metadata: { user },
      });
      return {
        message: "MFA code sent. Please verify to complete login.",
        data: { secret: otp.secret },
      };
    }

    const roles = user.roles.map((r) => r.role);

    await this.tokenService.createAuthSession(req, res, {
      id: user.id,
      roles: roles,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.notifyService.sendNotification({
      userId: user.id,
      purpose: "signin",
      to: value,
      metadata: { user },
    });

    this.logger.log(`✅ Sign-in success`, {
      userId: user.id,
      identifier: dto.identifier,
    });
    return {
      message: "Signed in successfully",
      data: { id: user.id, roles: roles },
    };
  }

  async signOut(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    const tokenId = req.cookies.tokenId;

    if (refreshToken && tokenId) {
      await this.prisma.refreshToken.update({
        where: { token: refreshToken, id: tokenId },
        data: { blacklisted: true },
      });
    }

    this.tokenService.clearAuthCookies(res);
    this.logger.log("🚪 User signed out", { tokenId });

    return { message: "Signed out successfully" };
  }

  async requestOtp(dto: RequestOtpDto) {
    const { user, key, value } = await this.findUserByIdentifier(
      dto.identifier,
      { securitySetting: true }
    );

    if (dto.purpose === "verifyIdentifier") {
      await this.checkVerificationStatus(user, key, value, "verified");
      await this.otpService.sendOtp({
        userId: user.id,
        identifier: value,
        purpose: dto.purpose,
        metadata: { user },
      });
      return { message: `Verification OTP sent.` };
    }

    if (dto.purpose.includes("Password")) {
      if (dto.purpose === "setPassword" && user.password) {
        throw new BadRequestException(
          "Password already set. Use resetPassword."
        );
      } else if (dto.purpose === "resetPassword" && !user.password) {
        throw new BadRequestException("No password set. Use setPassword.");
      }

      await this.otpService.sendOtp({
        userId: user.id,
        identifier: value,
        purpose: dto.purpose,
        metadata: { user },
      });
      return { message: `${dto.purpose} OTP sent.` };
    }

    if (dto.purpose === "changeIdentifier") {
      await this.otpService.sendOtp({
        userId: user.id,
        identifier: value,
        purpose: dto.purpose,
        metadata: { user },
      });
      return { message: `Change ${key} Otp Send` };
    }

    if (dto.purpose.includes("Mfa")) {
      if (dto.purpose === "enableMfa") {
        if (user.securitySetting?.isMfaEnabled) {
          throw new BadRequestException("MFA is already enabled.");
        }
      } else if (dto.purpose === "disableMfa") {
        if (!user.securitySetting?.isMfaEnabled) {
          throw new BadRequestException("MFA is already disabled.");
        }
      }
      await this.otpService.sendOtp({
        userId: user.id,
        identifier: value,
        purpose: dto.purpose,
        metadata: { user },
      });
      return { message: `${dto.purpose} OTP sent.` };
    }

    throw new BadRequestException(`Invalid purpose: ${dto.purpose}`);
  }

  async validateOtp(dto: ValidateOtpDto, req: Request, res: Response) {
    const { key, value, user } = await this.findUserByIdentifier(
      dto.identifier
    );

    await this.otpService.verifyOtp({
      userId: user.id,
      purpose: dto.purpose,
      secret: dto.secret,
      type: dto.type,
    });

    if (dto.purpose === "verifyIdentifier") {
      await this.prisma.user.update({
        where: { id: user.id },
        data:
          key === "email"
            ? { isEmailVerified: true }
            : { isPhoneVerified: true },
      });

      return { message: `${key} verified successfully.` };
    }

    if (dto.purpose.includes("Password")) {
      const otp = await this.otpService.sendOtp({
        userId: user.id,
        identifier: value,
        purpose: dto.purpose,
        type: "token",
        notify: false,
        metadata: { user },
      });
      return {
        message: "OTP validated successfully.",
        data: { secret: otp.secret },
      };
    }

    if (dto.purpose === "changeIdentifier") {
      const otp = await this.otpService.sendOtp({
        userId: user.id,
        identifier: value,
        purpose: dto.purpose,
        type: "token",
        notify: false,
        metadata: { user },
      });

      return {
        message: "OTP validated successfully.",
        data: { secret: otp.secret },
      };
    }

    if (dto.purpose.includes("Mfa")) {
      //TODO add logic enable mfa
      if (dto.purpose === "enableMfa") {
        await this.prisma.securitySetting.update({
          where: { userId: user.id },
          data: { isMfaEnabled: true }, // TODO add mfa method details
        });
      } else if (dto.purpose === "disableMfa") {
        await this.prisma.securitySetting.update({
          where: { userId: user.id },
          data: { isMfaEnabled: false },
        });
      } else if (dto.purpose === "verifyMfa") {
        const roles = user.roles.map((r) => r.role);

        await this.tokenService.createAuthSession(req, res, {
          id: user.id,
          roles: roles,
        });

        return {
          message: "MFA verified. Signed in successfully.",
          data: { id: user.id, roles: roles },
        };
      }

      await this.notifyService.sendNotification({
        userId: user.id,
        to: dto.identifier,
        purpose: dto.purpose,
        metadata: { user },
      });

      return { message: `${dto.purpose} Successfully` };
    }

    throw new BadRequestException(`Invalid purpose: ${dto.purpose}`);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { user } = await this.findUserByIdentifier(dto.identifier);

    const isTokenValid = await this.otpService.verifyOtp({
      userId: user.id,
      purpose: dto.purpose,
      secret: dto.secret,
      type: "token",
    });

    if (!isTokenValid) {
      throw new BadRequestException("Invalid Token");
    }

    const hashedPassword = await this.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.notifyService.sendNotification({
      userId: user.id,
      to: dto.identifier,
      purpose: dto.purpose,
      metadata: { user },
    });

    this.logger.log(`🔑 Password reset successful`, { userId: user.id });

    return { message: "Password reset successfully" };
  }

  async changeIdentifierReq(dto: ChangeIdentifierDto) {
    const { user } = await this.findUserByIdentifier(dto.identifier);

    const {
      key: newKey,
      value: newValue,
      query: newQuery,
    } = this.parseIdentifier(dto.newIdentifier);

    const existingUser = await this.prisma.user.findFirst({
      where: newQuery,
    });

    if (existingUser) {
      throw new BadRequestException(`${newKey} already in use.`);
    }

    const isTokenValid = await this.otpService.verifyOtp({
      userId: user.id,
      purpose: dto.purpose,
      secret: dto.secret,
      type: "token",
    });

    if (!isTokenValid) {
      throw new BadRequestException("Invalid Token");
    }

    await this.otpService.sendOtp({
      userId: user.id,
      identifier: newValue,
      purpose: dto.purpose,
      metadata: { user },
    });

    this.logger.log("🔄 Identifier change requested", {
      userId: user.id,
      newIdentifier: dto.newIdentifier,
    });

    return {
      message: `Link sent to new ${newKey}. Please verify to complete the change.`,
    };
  }

  async changeIdentifier(dto: ChangeIdentifierDto) {
    const { user, key } = await this.findUserByIdentifier(dto.identifier);

    await this.otpService.verifyOtp({
      userId: user.id,
      purpose: dto.purpose,
      secret: dto.secret,
      type: "token",
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { [key]: dto.newIdentifier },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { blacklisted: true },
    });

    await this.notifyService.sendNotification({
      userId: user.id,
      to: dto.newIdentifier,
      purpose: dto.purpose,
      metadata: {
        user,
        identifier: dto.identifier,
        newIdentifier: dto.newIdentifier,
      },
    });

    this.logger.log("✅ Identifier changed successfully", { userId: user.id });

    return { message: `${key} changed successfully.` };
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  private async findUserByIdentifier(
    identifier: string,
    include: Prisma.UserInclude = {}
  ) {
    const { key, value, query } = this.parseIdentifier(identifier);
    const user = await this.prisma.user.findUnique({
      where: query,
      include,
    });
    if (!user) throw new BadRequestException("User not found");
    return { user, key, value };
  }

  private async checkVerificationStatus(
    user: User,
    key: IdentifierKey,
    value: string,
    check: "verified" | "unverified"
  ) {
    const isVerified =
      key === "email" ? user.isEmailVerified : user.isPhoneVerified;

    if (check === "verified" && isVerified) {
      throw new BadRequestException(`${key} is already verified.`);
    }

    if (check === "unverified" && !isVerified) {
      await this.otpService.sendOtp({
        userId: user.id,
        identifier: value,
        purpose: "verifyIdentifier",
        metadata: { user },
      });
      this.logger.log(
        "📨 Auto-sent verification OTP due to unverified identifier",
        { userId: user.id, key, value }
      );

      throw new UnauthorizedException(`${key} not verified`);
    }
  }

  private parseIdentifier(identifier: string): {
    key: IdentifierKey;
    value: string;
    query: Prisma.UserWhereUniqueInput;
  } {
    const isEmail = identifier.includes("@");
    const key = isEmail ? "email" : "phone";
    const value = isEmail ? identifier.toLowerCase() : identifier;
    const query = key === "email" ? { email: value } : { phone: value };

    return { key, value, query };
  }
}
