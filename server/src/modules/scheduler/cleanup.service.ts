import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { LoggerService } from "@/modules/logger/logger.service";
import { InjectLogger } from "@/common/decorators/logger.decorator";

@Injectable()
export class CleanupService {
  @InjectLogger()
  private readonly logger!: LoggerService;

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleOtpCleanup() {
    this.logger.log("🧹 Running OTP cleanup job...");
    const result = await this.prisma.otp.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`✅ Deleted ${result.count} expired OTPs`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRefreshTokenCleanup() {
    this.logger.log("🧹 Running Refresh Token cleanup job...");
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    this.logger.log(`✅ Deleted ${result.count} expired refresh tokens`);
  }
}
