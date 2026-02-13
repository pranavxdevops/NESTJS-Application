import { Global, Module } from "@nestjs/common";
import { BlobStorageService } from "./blob.service";

@Global()
@Module({
  providers: [BlobStorageService],
  exports: [BlobStorageService],
})
export class BlobModule {}
