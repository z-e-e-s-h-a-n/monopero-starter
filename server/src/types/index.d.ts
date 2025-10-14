import { OrderStatus, OtpPurpose } from "@prisma/client";

declare global {
  type IdentifierKey = "email" | "phone";

  type NotificationPurpose = "signin" | "signup" | OtpPurpose;

  type TemplateReturn = {
    subject: string;
    html: string;
    text: string;
  };
}
