import { BadRequestException, ValidationPipe, type INestApplication } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { ErrorCatalogService } from "@shared/errors/error-catalog.service";
import { GlobalExceptionFilter } from "@shared/errors/global-exception.filter";

export function applyAppSettings(app: INestApplication): void {
  app.useLogger(app.get(Logger));

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://admin.theonezone.org',
      'https://www.theonezone.org',
      'https://theonezone.org',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(helmet());

  const errorCatalog = app.get<ErrorCatalogService>(ErrorCatalogService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow query params - they're validated by DTOs
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Enable automatic type conversion for query params
      },
      exceptionFactory: (errors) => {
        if (!errors?.length)
          return new BadRequestException(
            errorCatalog.getValidationMessage("validation.generic") ?? "Validation failed",
          );

        // Format all validation errors with detailed information
        const formattedErrors = errors.map((err) => {
          const constraints = err.constraints ?? {};
          return {
            property: err.property,
            constraints,
            value: err.value as unknown, // Validation values can be any type
          };
        });

        // Return BadRequestException with structured error data
        // The message array will be processed by GlobalExceptionFilter
        return new BadRequestException({
          message: formattedErrors,
          error: "Bad Request",
          statusCode: 400,
        });
      },
    }),
  );
  app.useGlobalFilters(
    new GlobalExceptionFilter(app.get<ErrorCatalogService>(ErrorCatalogService)),
  );

  // Setup Swagger documentation using NestJS Swagger module
  // IMPORTANT: Setup Swagger BEFORE setting global prefix
  const config = new DocumentBuilder()
    .setTitle("WFZO API")
    .setDescription("WFZO API Documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .addServer("/wfzo/api/v1", "API Server")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  // Set global prefix for API routes (applied after Swagger setup)
  app.setGlobalPrefix("/wfzo/api/v1");
}
