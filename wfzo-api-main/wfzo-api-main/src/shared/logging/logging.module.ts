import { Global, Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { v4 as uuid } from "uuid";
import { LoggerService } from "./logger.service";

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => req.headers["x-request-id"] ?? uuid(),
        level: process.env.LOG_LEVEL ?? "info",
        redact: {
          paths: [
            "req.headers.authorization",
            "*.password",
            "*.token",
            "*.secret",
            'req.headers["x-api-key"]',
          ],
          remove: true,
        },
        // Only enable pretty transport in local development, not in tests or production
        transport: process.env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService, LoggerModule],
})
export class LoggingModule {}
