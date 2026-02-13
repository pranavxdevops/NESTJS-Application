import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { ConfigService } from "./config.service";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env file explicitly to ensure process.env is populated
// NestJS ConfigModule loads env vars into its own ConfigService but may not populate process.env
// We need process.env populated because our custom ConfigService reads from it directly
const envPath = path.resolve(process.cwd(), ".env");
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn(`[ConfigModule] Failed to load .env file: ${result.error.message}`);
} else {
  console.log(`[ConfigModule] Loaded .env file from ${envPath}`);
  console.log(`[ConfigModule] SEARCH_PARAM_DISTANCE_THRESHOLD=${process.env.SEARCH_PARAM_DISTANCE_THRESHOLD}`);
}

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
      expandVariables: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
