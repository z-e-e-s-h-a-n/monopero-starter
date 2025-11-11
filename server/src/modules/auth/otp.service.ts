import { Injectable, UnauthorizedException } from "@nestjs/common";
import { OtpPurpose, OtpType } from "@prisma/client";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { NotificationService } from "@/modules/notification/notification.service";
import { expiryDate } from "@/lib/utils/general.util";
import { EnvService } from "@/modules/env/env.service";
import crypto from "crypto";
import { LoggerService } from "@/modules/logger/logger.service";
import { InjectLogger } from "@/common/decorators/logger.decorator";

interface SendOtpPayload {
  userId: string;
  identifier: string;
  purpose: OtpPurpose;
  type?: OtpType;
  notify?: boolean;
  metadata?: Record<string, any>;
}

interface verifyOtpPayload {
  userId: string;
  secret: string;
  purpose: OtpPurpose;
  type?: OtpType;
}

@Injectable()
export class OtpService {
  @InjectLogger()
  private readonly logger!: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifyService: NotificationService,
    private readonly env: EnvService
  ) {}

  async sendOtp({
    userId,
    identifier,
    purpose,
    type = "otp",
    notify = true,
    metadata,
  }: SendOtpPayload) {
    let otp = await this.prisma.otp.findFirst({
      where: {
        userId,
        purpose,
        type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      otp = await this.prisma.otp.create({
        data: {
          userId,
          purpose,
          type,
          secret: this.generateSecret(type),
          expiresAt: expiryDate(this.env.get("OTP_EXP"), true),
        },
      });
    }

    this.logger.log(`🔢 OTP generated`, {
      userId,
      purpose,
      type,
      expiresAt: otp.expiresAt,
      context: OtpService.name,
    });

    if (!notify) return otp;

    await this.notifyService.sendNotification({
      userId: userId,
      purpose,
      to: identifier,
      metadata: { otp, identifier, ...metadata },
    });

    return otp;
  }

  async verifyOtp({ userId, secret, purpose, type = "otp" }: verifyOtpPayload) {
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId,
        secret,
        purpose,
        type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      this.logger.warn(`Invalid OTP`, {
        userId,
        purpose,
        context: OtpService.name,
      });
      throw new UnauthorizedException("Invalid OTP");
    }

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    this.logger.log(`✅ OTP verified`, {
      userId,
      purpose,
      context: OtpService.name,
    });

    return otp;
  }

  private generateSecret(type: OtpType, prefix = "") {
    switch (type) {
      case "token":
        return `${prefix}${crypto.randomBytes(32).toString("hex")}`;
      case "otp":
        return crypto.randomInt(100000, 999999).toString();
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }
}
