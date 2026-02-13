import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminService } from "./services/admin.service";
import { AdminController } from "./admin.controller";
import { InternalUser, InternalUserSchema } from "./schemas/internal-user.schema";
import { Role, RoleSchema } from "./schemas/role.schema";
import { InternalUserRepository } from "./repository/internal-user.repository";
import { RoleService } from "./services/role.service";
import { ConfigModule } from "@shared/config/config.module";
import { EmailModule } from "@shared/email/email.module";

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: InternalUser.name, schema: InternalUserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, InternalUserRepository, RoleService],
  exports: [AdminService, RoleService],
})
export class AdminModule {}
