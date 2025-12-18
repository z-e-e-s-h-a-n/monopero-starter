import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvSchema } from "@schemas/env.schema";
import { LoggerService } from "@modules/logger/logger.service";
import { InjectLogger } from "@decorators/logger.decorator";

@Injectable()
export class EnvService {
  @InjectLogger()
  private readonly logger!: LoggerService;

  constructor(private readonly config: ConfigService<EnvSchema>) {}

  get<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
    const value = this.config.get(key);
    if (value === undefined) {
      this.logger.warn(`Missing env key: ${String(key)}`);
      throw new Error(`Missing env key: ${String(key)}`);
    }
    return value;
  }
}
