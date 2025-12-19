import { Inject } from "@nestjs/common";
import { LoggerService } from "@modules/logger/logger.service";

export function InjectLogger(context?: string): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Inject(LoggerService)(target, propertyKey);

    const originalInit = target.constructor.prototype?.onModuleInit;

    target.constructor.prototype.onModuleInit = function (...args: any[]) {
      const logger: LoggerService = (this as any)[propertyKey];
      if (logger && typeof logger.setContext === "function") {
        const ctx = context || target.constructor.name;
        logger.setContext(ctx);
      }

      if (originalInit) return originalInit.apply(this, args);
    };
  };
}
