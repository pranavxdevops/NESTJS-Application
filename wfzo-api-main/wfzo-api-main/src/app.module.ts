import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@shared/config/config.module";
import { ConfigService } from "@shared/config/config.service";
import { LoggingModule } from "@shared/logging/logging.module";
import { ErrorCatalogModule } from "@shared/errors/error-catalog.module";
import { BlobModule } from "@shared/blob/blob.module";
import { EmailModule } from "@shared/email/email.module";
import { EnquiriesModule } from "@modules/enquiries/enquiries.module";
import { MemberModule } from "@modules/member/member.module";
import { AuthModule } from "@modules/auth/auth.module";
import { AdminModule } from "@modules/admin/admin.module";
import { AnalyticsModule } from "@modules/admin/analytics/analytics.module";
import { GAAnalyticsModule } from "@modules/admin/ga-analytics/ga-analytics.module";
import { CmsModule } from "@modules/cms/cms.module";
import { MasterdataModule } from "@modules/masterdata/masterdata.module";
import { EventsModule } from "@modules/events/events.module";
import { DocumentModule } from "@modules/document/document.module";
import { MembershipModule } from "@modules/membership/membership.module";
import { UserModule } from "@modules/user/user.module";
import { SearchModule } from "@modules/search/search.module";
import { PaymentModule } from "@modules/payment/payment.module";
import { ConnectionModule } from "@modules/connection/connection.module";
import { ChatModule } from "@modules/chat/chat.module";
import { ArticleModule } from "@modules/article/article.module";
import { OrganizationModule } from "@modules/organization/organization.module";
import { ReportModule } from "@modules/report/report.module";
import { MailerLiteModule } from "@modules/mailerlite/mailerlite.module";
import { RequestsModule } from "@modules/requests/requests.module";
import { MigrationModule } from "./database/migrations/migration.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    ErrorCatalogModule,
    BlobModule,
    EmailModule,
    EnquiriesModule,
    AuthModule,
    AdminModule,
    AnalyticsModule,
    GAAnalyticsModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.getMongoUri(),
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    MigrationModule,
    MemberModule,
    RequestsModule,
    CmsModule,
    MasterdataModule,
    EventsModule,
    DocumentModule,
    MembershipModule,
    UserModule,
    SearchModule,
    PaymentModule,
    ConnectionModule,
    ChatModule,
    ArticleModule,
    OrganizationModule,
    ReportModule,
    MailerLiteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
