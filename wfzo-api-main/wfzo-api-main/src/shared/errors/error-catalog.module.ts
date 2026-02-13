import { Global, Module } from "@nestjs/common";
import { ErrorCatalogService } from "./error-catalog.service";

@Global()
@Module({
  providers: [ErrorCatalogService],
  exports: [ErrorCatalogService],
})
export class ErrorCatalogModule {}
