import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { EnvModule } from "@/modules/env/env.module";
import { validateEnv } from "@/schemas/env.schema";
import { AuthGuard } from "@/guards/auth.guard";
import { AuthModule } from "@/modules/auth/auth.module";
import { TokenModule } from "@/modules/token/token.module";
import { PublicModule } from "@/modules/public/public.module";
import { TokenService } from "@/modules/token/token.service";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { LoggerModule } from "@/modules/logger/logger.module";
import { SchedulerModule } from "@/modules/scheduler/scheduler.module";
import { NotificationModule } from "@/modules/notification/notification.module";
import { TemplateModule } from "@/modules/template/template.module";
import { AllExceptionsFilter } from "@/common/filters/exceptions.filter";
import { ResponseInterceptor } from "@/common/interceptors/response.interceptor";

@Module({
  imports: [
    PublicModule,
    PrismaModule,
    LoggerModule,
    EnvModule,
    AuthModule,
    TokenModule,
    TemplateModule,
    NotificationModule,
    SchedulerModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
  ],

  providers: [
    {
      provide: APP_GUARD,
      useFactory: (tokenService, reflector) =>
        new AuthGuard(tokenService, reflector),
      inject: [TokenService, Reflector],
    },
    AllExceptionsFilter,
    ResponseInterceptor,
  ],
})
export class AppModule {}
