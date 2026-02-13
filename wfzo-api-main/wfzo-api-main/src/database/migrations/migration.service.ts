import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { MigrationRunner } from "./migration-runner";
import { Migration } from "./migration.interface";
import { DatabaseIndexesMigration } from "./001-database-indexes.migration";
import { AddApprovalOrderMigration } from "./seeds/002-add-approval-order.migration";
import { DropdownValuesSeedMigration } from "./seeds/006-dropdown-values-seed.migration";
import { CommonMemberInitialFormFieldsMigration } from "./seeds/007-common-member-initial-form-fields.migration";
import { VotingFormDropdownValuesMigration } from "./seeds/008-voting-form-dropdown-values.migration";
import { AddMembershipTypeToFormFieldsMigration } from "./seeds/009-add-membership-type-to-form-fields.migration";
import { AssociateMemberFormFieldsMigration } from "./seeds/010-associate-member-form-fields.migration";
import { RolesPrivilegesSeedMigration } from "./seeds/011-roles-privileges-seed.migration";
import { InitializeMemberCounterMigration } from "./seeds/012-initialize-member-counter.migration";
import { EmailTemplatesSeedMigration } from "./seeds/013-email-templates-seed.migration";
import { WorkflowEmailTemplatesMigration } from "./seeds/014-workflow-email-templates.migration";
import { InitializeApplicationCounterMigration } from "./seeds/015-initialize-application-counter.migration";
import { UpdateEmailTemplatesWithProcess } from "./seeds/016-update-email-templates-with-process.migration";
import { EventEmailTemplatesMigration } from "./seeds/017-event-email-templates.migration";
import { EnquiryEmailTemplatesMigration } from "./seeds/018-enquiry-email-templates.migration";
import { ArticleEmailTemplatesMigration } from "./seeds/019-article-email-templates.migration";
import { ReportEmailTemplatesMigration } from "./seeds/020-report-email-templates.migration";
import { ChatEmailTemplatesMigration } from "./seeds/021-chat-email-templates.migration";
import { ConnectionEmailTemplatesMigration } from "./seeds/022-connection-email-templates.migration";
import { OrganizationEmailTemplatesMigration } from "./seeds/023-organization-email-templates.migration";
import { UpdatePaymentLinkTemplateMigration } from "./seeds/024-update-payment-link-template.migration";
import { WorkflowTransitionsMigration } from "./seeds/015-workflow-transitions.migration";
import { UpdateWorkflowTransitionsMigration } from "./seeds/025-update-workflow-transitions.migration";
import { UpdateRolesPrivilegesMigration } from "./seeds/026-update-roles-privileges.migration";
import { UpdateApprovalOrdersMigration } from "./seeds/027-update-approval-orders.migration";
import { MembershipFeaturesSeedMigration } from "./seeds/028-membership-features-seed.migration";
import { UpdateSignatoryPositionFieldTranslationMigration } from "./seeds/029-update-signatory-position-field-translation.migration";
import { UpdatePaymentLinkTemplateProcessMigration } from "./seeds/030-update-payment-link-template-process.migration";
import { Member } from "../../modules/member/schemas/member.schema";
import { Event } from "../../modules/events/schemas/event.schema";
import { User } from "../../modules/user/schemas/user.schema";
import { Document } from "../../modules/document/schemas/document.schema";
import { Membership } from "../../modules/membership/schemas/membership.schema";
import { DropdownValue } from "../../modules/masterdata/schemas/dropdown-value.schema";
import { FormField } from "../../modules/masterdata/schemas/form-field.schema";
import { WorkflowTransition } from "../../modules/masterdata/schemas/workflow-transition.schema";
import { Counter } from "../../shared/schemas/counter.schema";
import { EmailTemplate } from "../../shared/email/schemas/email-template.schema";

/**
 * Migration service - orchestrates database migrations
 * Automatically runs pending migrations on application startup
 */
@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);
  private runner: MigrationRunner;
  private migrations: Migration[];

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Member.name) private readonly memberModel: Model<Member>,
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Document.name) private readonly documentModel: Model<Document>,
    @InjectModel(Membership.name) private readonly membershipModel: Model<Membership>,
    @InjectModel(DropdownValue.name) private readonly dropdownValueModel: Model<DropdownValue>,
    @InjectModel(FormField.name) private readonly formFieldModel: Model<FormField>,
    @InjectModel(WorkflowTransition.name)
    private readonly workflowTransitionModel: Model<WorkflowTransition>,
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
    @InjectModel(EmailTemplate.name) private readonly emailTemplateModel: Model<EmailTemplate>,
  ) {
    this.runner = new MigrationRunner(connection);

    // Register all migrations in order
    this.migrations = [
      // 1. Create all database indexes
      new DatabaseIndexesMigration(
        this.memberModel,
        this.eventModel,
        this.userModel,
        this.documentModel,
        this.membershipModel,
      ),
      // 2. Add order field to approval history
      new AddApprovalOrderMigration(this.memberModel),
      // 3. Seed dropdown values
      new DropdownValuesSeedMigration(this.dropdownValueModel),
      // 4. Seed common member form fields
      new CommonMemberInitialFormFieldsMigration(this.formFieldModel),
      // 5. Seed voting form dropdown values
      new VotingFormDropdownValuesMigration(this.dropdownValueModel),
      // 6. Add membership type to form fields
      new AddMembershipTypeToFormFieldsMigration(this.formFieldModel),
      // 7. Seed associate member form fields
      new AssociateMemberFormFieldsMigration(this.formFieldModel),
      // 8. Seed roles and privileges
      new RolesPrivilegesSeedMigration(this.connection),
      // 9. Initialize member counter
      new InitializeMemberCounterMigration(this.counterModel),
      // 10. Seed email templates
      new EmailTemplatesSeedMigration(this.emailTemplateModel),
      // 11. Seed workflow email templates
      new WorkflowEmailTemplatesMigration(this.emailTemplateModel),
      // 12. Initialize application counter
      new InitializeApplicationCounterMigration(this.counterModel),
      // 13. Update email templates with process field
      new UpdateEmailTemplatesWithProcess(this.emailTemplateModel),
      // 14. Seed event email templates
      new EventEmailTemplatesMigration(this.emailTemplateModel),
      // 15. Seed enquiry email templates
      new EnquiryEmailTemplatesMigration(this.emailTemplateModel),
      // 16. Seed article email templates
      new ArticleEmailTemplatesMigration(this.emailTemplateModel),
      // 17. Seed report email templates
      new ReportEmailTemplatesMigration(this.emailTemplateModel),
      // 18. Seed chat email templates
      new ChatEmailTemplatesMigration(this.emailTemplateModel),
      // 19. Seed connection email templates
      new ConnectionEmailTemplatesMigration(this.emailTemplateModel),
      // 20. Seed organization email templates
      new OrganizationEmailTemplatesMigration(this.emailTemplateModel),
      // 21. Update payment link template
      new UpdatePaymentLinkTemplateMigration(this.emailTemplateModel),
      // 22. Seed workflow transitions
      new WorkflowTransitionsMigration(this.workflowTransitionModel),
      // 23. Update workflow transitions to remove board approval
      new UpdateWorkflowTransitionsMigration(this.workflowTransitionModel),
      // 24. Update roles privileges to remove board role
      new UpdateRolesPrivilegesMigration(this.connection),
      // 25. Update approval orders to remove board stage
      new UpdateApprovalOrdersMigration(this.memberModel),
      // 26. Seed membership features
      new MembershipFeaturesSeedMigration(this.connection),
      // 29. Update signatory position field translation
      new UpdateSignatoryPositionFieldTranslationMigration(this.formFieldModel),
      // 30. Update payment link template process field
      new UpdatePaymentLinkTemplateProcessMigration(this.emailTemplateModel),
    ];
  }

  /**
   * Run migrations automatically on module initialization
   */
  async onModuleInit(): Promise<void> {
    const runMigrationsOnStartup = process.env.RUN_MIGRATIONS_ON_STARTUP !== "false";

    if (runMigrationsOnStartup) {
      this.logger.log("Running database migrations on startup...");
      await this.runPendingMigrations();
    } else {
      this.logger.log("Automatic migrations disabled (RUN_MIGRATIONS_ON_STARTUP=false)");
    }
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations(): Promise<void> {
    try {
      await this.runner.runMigrations(this.migrations);
      this.logger.log("✓ All migrations completed");
    } catch (error) {
      this.logger.error("Migration failed:", error);
      throw error;
    }
  }

  /**
   * Rollback the last migration
   */
  async rollbackLastMigration(): Promise<void> {
    try {
      await this.runner.rollbackLastMigration(this.migrations);
      this.logger.log("✓ Migration rolled back successfully");
    } catch (error) {
      this.logger.error("Rollback failed:", error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<any> {
    return this.runner.getStatus();
  }
}
