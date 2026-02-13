import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(private readonly logger: PinoLogger) {}

  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }
  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }
  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }
  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }
  verbose(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  // child loggers not exposed by PinoLogger typing; omit for now
}
