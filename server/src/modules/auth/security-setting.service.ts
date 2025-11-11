import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { LoggerService } from "@/modules/logger/logger.service";
import { InjectLogger } from "@/common/decorators/logger.decorator";
import crypto from "crypto";
import { expiryDate } from "@/lib/utils/general.util";
import type { Request } from "express";
import type {
  UpdateSecuritySettingDto,
  VerifyBackupCodeDto,
} from "@/common/dto/security-setting.dto";

@Injectable()
export class SecuritySettingService {
  @InjectLogger()
  private readonly logger!: LoggerService;
  constructor(private readonly prisma: PrismaService) {}

  async generateBackupCodes(req: Request) {
    const userId = req.user!.id;
    const count = 8;

    const codes = Array.from({ length: count }).map(() =>
      crypto.randomBytes(6).toString("hex").toUpperCase()
    );

    await this.prisma.backupCode.deleteMany({ where: { userId } });

    await this.prisma.backupCode.createMany({
      data: codes.map((code) => ({
        userId,
        code,
        isUsed: false,
        expiresAt: expiryDate("7d", true),
      })),
    });

    this.logger.log("🔢 Backup codes generated", {
      userId,
      count,
    });

    return { message: "Backup Codes Generated Successfully", data: { codes } };
  }

  async verifyBackupCode(dto: VerifyBackupCodeDto, req: Request) {
    const userId = req.user!.id;

    const backup = await this.prisma.backupCode.findFirst({
      where: { userId, code: dto.code, usedAt: null },
    });

    if (!backup) {
      throw new BadRequestException("Invalid or used backup code.");
    }

    await this.prisma.backupCode.update({
      where: { id: backup.id },
      data: { usedAt: new Date() },
    });

    this.logger.log("✅ Backup code used successfully", {
      userId,
      code: dto.code,
    });

    return { message: "Backup code verified successfully." };
  }

  async getBackupCodes(req: Request) {
    const userId = req.user!.id;

    const codes = await this.prisma.backupCode.findMany({
      where: { userId, usedAt: null },
      select: { code: true },
    });

    if (!codes.length) {
      throw new NotFoundException("No active backup codes found.");
    }

    return {
      message: "Backup codes fetched successfully.",
      data: { codes: codes.map((c) => c.code) },
    };
  }

  async updateSecuritySetting(dto: UpdateSecuritySettingDto, req: Request) {
    const userId = req.user!.id;

    await this.prisma.securitySetting.update({
      where: { userId },
      data: dto,
    });

    return { message: "Recovery information updated successfully." };
  }
}
