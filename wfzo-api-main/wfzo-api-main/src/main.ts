import * as express from "express";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { applyAppSettings } from "./bootstrap/app-setup";
import { getConnectionToken } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { setGlobalConnection } from "@modules/member/validators/decorators/validate-dropdown-value.decorator";
import { setGlobalUserConnection } from "@modules/member/validators/decorators/validate-email-unique.decorator";
import { ValidationPipe } from "@nestjs/common/pipes";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  // Set the global connection for validators
  const connection = app.get<Connection>(getConnectionToken());
  setGlobalConnection(connection);
  setGlobalUserConnection(connection);
  
  app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidUnknownValues: false,
    validateCustomDecorators: true,
    transformOptions: {
      enableImplicitConversion: true, // ❗ SUPER IMPORTANT
    },
  }),
);
  
  applyAppSettings(app);

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
