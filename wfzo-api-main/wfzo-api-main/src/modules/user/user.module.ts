import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { MembershipModule } from "@modules/membership/membership.module";
import { AuthModule } from "@modules/auth/auth.module";
import { EmailModule } from "@shared/email/email.module";
import { UserRepository } from "./repository/user.repository";
import { User, UserSchema } from "./schemas/user.schema";

@Module({
  imports: [
    MembershipModule,
    AuthModule,
    EmailModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
