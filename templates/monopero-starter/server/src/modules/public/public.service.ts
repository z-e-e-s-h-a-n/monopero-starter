import { Injectable } from "@nestjs/common";
import { LoggerService } from "@modules/logger/logger.service";
import type { Request } from "express";
import { InjectLogger } from "@decorators/logger.decorator";

@Injectable()
export class PublicService {
  @InjectLogger()
  private readonly logger!: LoggerService;

  welcome(req: Request) {
    this.logger.log(
      `Welcome endpoint hit from IP: ${req.ip}, path: ${req.url}`
    );
    return { message: "Server is running 🚀" };
  }

  getHealth() {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    this.logger.log(`Health check requested. Uptime: ${uptime}s`);
    return {
      message: "Server is healthy",
      status: "ok",
      uptime,
      timestamp,
    };
  }
}
