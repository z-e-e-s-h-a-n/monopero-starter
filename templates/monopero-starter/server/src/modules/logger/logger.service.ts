import { Inject, Injectable, Scope } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import type { Logger } from "winston";

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private context?: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winston: Logger
  ) {}

  setContext(context: string) {
    this.context = context;
  }

  private withContext(meta: Record<string, any> = {}) {
    return this.context ? { context: this.context, ...meta } : meta;
  }

  log(message: string, meta: Record<string, any> = {}) {
    this.winston.info(message, this.withContext(meta));
  }

  error(message: string, meta: Record<string, any> = {}) {
    this.winston.error(message, this.withContext(meta));
  }

  warn(message: string, meta: Record<string, any> = {}) {
    this.winston.warn(message, this.withContext(meta));
  }

  debug(message: string, meta: Record<string, any> = {}) {
    this.winston.debug(message, this.withContext(meta));
  }
}
