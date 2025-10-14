import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import { EnvService } from "@/modules/env/env.service";
import { NotificationStatus, NotificationType, Prisma } from "@prisma/client";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { TemplateService } from "@/modules/template/template.service";
import { LoggerService } from "@/modules/logger/logger.service";
import { InjectLogger } from "@/common/decorators/logger.decorator";

interface SendNotificationProps {
  userId: string;
  purpose: NotificationPurpose;
  to: string;
  metadata: Record<string, any>;
}

@Injectable()
export class NotificationService {
  @InjectLogger()
  private readonly logger!: LoggerService;
  private readonly resend: Resend;

  constructor(
    private readonly env: EnvService,
    private readonly prisma: PrismaService,
    private readonly templateService: TemplateService
  ) {
    this.resend = new Resend(this.env.get("RESEND_API_KEY"));
  }

  async sendNotification({
    userId,
    purpose,
    to,
    metadata,
  }: SendNotificationProps) {
    const { html, subject, text } = this.templateService.resolveTemplate(
      purpose,
      metadata
    );
    const type: Exclude<NotificationType, "inApp"> = to.includes("@")
      ? "email"
      : "sms";

    try {
      const notification = await this.createNotificationRecord({
        userId,
        type,
        title: subject,
        message: text,
        purpose,
        metadata,
      });

      this.logger.debug(`Notification record created`, {
        notification: notification.id,
      });

      if (type === "email") {
        const from = "Your App <onboarding@resend.dev>";
        await this.resend.emails.send({ from, to, subject, html });
      } else if (type === "sms") {
        // TODO integrate Twilio/Nexmo here
        console.log(`Sending SMS to ${to}: ${purpose} with data`, metadata);
      }

      await this.updateNotificationStatus(notification.id, "sent");
    } catch (error) {
      this.logger.error(`❌ Notification send Failed`, {
        type,
        to,
        error,
      });
      throw error;
    }
  }

  async notifyInApp(
    userId: string,
    purpose: NotificationPurpose,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ) {
    return this.createNotificationRecord({
      userId,
      type: "inApp",
      title,
      message,
      purpose,
      metadata,
      status: "sent",
    });
  }

  private async createNotificationRecord(
    data: Prisma.NotificationUncheckedCreateInput
  ) {
    return this.prisma.notification.create({ data });
  }

  private async updateNotificationStatus(
    id: string,
    status: NotificationStatus
  ) {
    return this.prisma.notification.update({
      where: { id },
      data: { status },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: "read", readAt: new Date() },
    });
  }
}
