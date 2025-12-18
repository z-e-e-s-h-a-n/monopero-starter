import { LoggerService } from "@modules/logger/logger.service";
import type { Request, Response } from "express";
import {
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
  type ArgumentsHost,
} from "@nestjs/common";
import { InjectLogger } from "@decorators/logger.decorator";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  @InjectLogger()
  private readonly logger!: LoggerService;

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any = "Internal server error";

    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (
        res &&
        typeof res === "object" &&
        "message" in res &&
        Array.isArray((res as any).message)
      ) {
        message = (res as any).message;
      } else if (typeof res === "string") {
        message = res;
      } else if (typeof exception.message === "string") {
        message = exception.message;
      }
    }
    // if (response.headersSent) return;

    this.logger.error(`❌ Exception caught`, {
      message: exception.message,
      stack: exception.stack,
      status,
      path: req.url,
      method: req.method,
    });

    res.status(status).json({
      status,
      data: null,
      message,
      success: false,
    });
  }
}
