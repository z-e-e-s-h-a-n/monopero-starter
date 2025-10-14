import { Global, Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { TemplateModule } from "@/modules/template/template.module";

@Global()
@Module({
  imports: [TemplateModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
