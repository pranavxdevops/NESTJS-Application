import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type MemberDocument = HydratedDocument<Member>;

/**
 * User snapshot stored in Member document
 * This is a denormalized copy of essential user data for quick access
 * Prevents N+1 queries and prepares for microservices architecture
 */
@Schema({ _id: false })
export class UserSnapshot {
  @Prop({ required: true })
  id!: string; // User ID from User collection

  @Prop({ required: true })
  email!: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ enum: ["Primary", "Secondry", "Non Member", "Internal"] })
  userType?: string;

  @Prop()
  correspondanceUser?: boolean;

  @Prop()
  marketingFocalPoint?: boolean;

  @Prop()
  investorFocalPoint?: boolean;

  @Prop()
  contactNumber?: string;

  @Prop()
  designation?: string;

  @Prop()
  newsLetterSubscription?: boolean;

  @Prop()
  profileImageUrl?: string;

  @Prop({ type: Date })
  lastSyncedAt?: Date; // Track when this snapshot was last updated
}

@Schema({ _id: false })
export class Address {
  @Prop({ required: true })
  line1!: string;

  @Prop()
  line2?: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  country!: string;

  @Prop()
  countryCode?: string;

  @Prop()
  zip?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;
}

@Schema({ _id: false })
export class OrganisationQuestionnaire {
  @Prop({ type: Number })
  establishedYear?: number;

  @Prop({ type: Number })
  numberOfEmployees?: number;

  @Prop({ type: String })
  companyProfileDescription?: string;

  @Prop({ type: String })
  whyJoinWorldFZO?: string;

  @Prop({ type: String })
  fzTotalSize?: string;

  @Prop({ type: Number })
  fzFoundedYear?: number;

  @Prop({ type: Number })
  fzNumberOfCompanies?: number;

  @Prop({ type: Number })
  fzNumberOfEmployees?: number;

  @Prop({ type: Number })
  fzJobsCreated?: number;

  @Prop({ type: String })
  fzServicesBenefits?: string;

  @Prop({ type: String })
  fzMainActivitySectors?: string;

  @Prop({ type: String })
  fzTaxIncentives?: string;

  @Prop({ type: Boolean })
  needsConsulting?: boolean;

  @Prop({ type: String })
  needsConsultingAreas?: string;

  @Prop({ type: Boolean })
  needsTraining?: boolean;

  @Prop({ type: String })
  needsTrainingAreas?: string;

  @Prop({ type: Boolean })
  attendConferences?: boolean;

  @Prop({ type: Boolean })
  customizedEvents?: boolean;

  @Prop({ type: Boolean })
  recognizedFreeZone?: boolean;

  // Associate Member specific field
  @Prop()
  howDidYouHearAboutWorldFZO?: string;
}

@Schema({ _id: false })
export class SocialMediaHandle {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  url!: string;
}

@Schema({ _id: false })
export class OrganisationInfo {
  @Prop()
  typeOfTheOrganization?: string;

  @Prop()
  companyName?: string;

  @Prop()
  websiteUrl?: string;

  @Prop()
  linkedInUrl?: string;

  @Prop({ type: [String] })
  industries?: string[];

  @Prop()
  memberLogoUrl?: string;

  @Prop()
  memberLogoUrlExpiresAt?: string; // ISO timestamp when signed URL expires

  @Prop()
  memberLogoUrlExpiresIn?: number; // Seconds until expiration

  @Prop()
  organisationImageUrl?: string;

  @Prop()
  memberVideoUrl?: string;

  @Prop({ type: OrganisationQuestionnaire })
  organisationQuestionnaire?: OrganisationQuestionnaire;

  @Prop({ type: Address })
  address?: Address;

  @Prop()
  signatoryName?: string;

  @Prop()
  signatoryPosition?: string;

  @Prop()
  signature?: string;

  @Prop()
  memberLicenceUrl?: string;

  @Prop()
  memberLicenceUrlExpiresAt?: string; // ISO timestamp when signed URL expires

  @Prop()
  memberLicenceUrlExpiresIn?: number; // Seconds until expiration

  // Associate Member specific field
  @Prop()
  position?: string; // Primary contact position for associate members

  @Prop()
  organisationContactNumber?: string;

  @Prop({ type: [SocialMediaHandle] })
  socialMediaHandle?: SocialMediaHandle[];
}

@Schema({ _id: false })
export class MemberConsent {
  @Prop()
  articleOfAssociationConsent?: boolean;

  @Prop()
  articleOfAssociationCriteriaConsent?: boolean;

  @Prop()
  memberShipFeeConsent?: boolean;

  @Prop()
  publicationConsent?: boolean;

  @Prop()
  approvalForExposure?: boolean;

  @Prop()
  termsAndConditions?: boolean;

  // Associate Member specific consent fields
  @Prop()
  termsAndConditions2?: boolean;

  @Prop()
  termsAndConditions3?: boolean;

  @Prop()
  authorizedPersonDeclaration?: boolean;
}

/**
 * Approval history entry
 * Tracks each approval step in the workflow
 */
@Schema({ _id: false })
export class ApprovalHistoryEntry {
  @Prop({ required: true, enum: ["committee", "board", "ceo"] })
  approvalStage!: string;

  @Prop({ required: true })
  order!: number; // Sequence number: 1 for committee, 2 for board, 3 for ceo

  @Prop({ required: true })
  approvedBy!: string; // Username or email of approver

  @Prop({ required: true })
  approverEmail!: string;

  @Prop()
  comments?: string;

  @Prop({ type: Date, required: true })
  approvedAt!: Date;
}

/**
 * Rejection history entry
 * Tracks rejection reasons and who rejected
 */
@Schema({ _id: false })
export class RejectionHistoryEntry {
  @Prop({ required: true, enum: ["committee", "board", "ceo", "admin"] })
  rejectionStage!: string;

  @Prop({ required: true })
  order!: number; // Sequence number: 1 for committee, 2 for board, 3 for ceo, 0 for admin

  @Prop({ required: true })
  rejectedBy!: string; // Username or email of rejector

  @Prop({ required: true })
  rejectorEmail!: string;

  @Prop({ required: true, maxlength: 2000 })
  reason!: string;

  @Prop({ type: Date, required: true })
  rejectedAt!: Date;
}

@Schema({ _id: false })
export class FocalPoint {
  @Prop()
  name?: string;

  @Prop({
    validate: {
      validator: function (v: string) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: "Invalid email address",
    },
  })
  email?: string;
}

@Schema({ _id: false })
export class SecondaryContact {
  @Prop()
  name?: string;

  @Prop({
    validate: {
      validator: function (v: string) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: "Invalid email address",
    },
  })
  email?: string;

  @Prop()
  position?: string;

  @Prop()
  countryCode?: string;

  @Prop()
  contactNumber?: string;
}

@Schema({ _id: false })
export class CompanyPhoto {
  @Prop({
    validate: {
      validator: function (v: string) {
        return !v || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: "Invalid URL",
    },
  })
  url?: string;

  @Prop()
  fileName?: string;
}

@Schema({ _id: false })
export class CompanyDetails {
  @Prop()
  marketingName?: string;

  @Prop({ type: CompanyPhoto })
  companyPhoto?: CompanyPhoto;

  @Prop({
    validate: {
      validator: function (v: string) {
        return !v || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: "Invalid URL",
    },
  })
  corporateVideoLink?: string;

  @Prop({ maxlength: 500 })
  whyJoinWorldFZO?: string;

  @Prop({ maxlength: 1500 })
  companyDescription?: string;
}

@Schema({ _id: false })
export class Newsletter {
  @Prop({ default: false })
  subscribed?: boolean;

  @Prop({
    type: [String],
    validate: [
      {
        validator: function (v: string[]) {
          return !v || v.length <= 3;
        },
        message: "Maximum 3 additional emails allowed",
      },
      {
        validator: function (v: string[]) {
          if (!v) return true;
          return v.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        },
        message: "All emails must be valid",
      },
    ],
  })
  additionalEmails?: string[];
}

@Schema({ _id: false })
export class FreeZoneInfo {
  @Prop({ type: FocalPoint })
  marketingFocalPoint?: FocalPoint;

  @Prop({ type: FocalPoint })
  investorFocalPoint?: FocalPoint;

  @Prop({ type: Number, min: 0 })
  totalAreaSqKm?: number;

  @Prop({
    type: Number,
    min: 1900,
    validate: {
      validator: function (v: number) {
        return !v || v <= new Date().getFullYear();
      },
      message: "Founded year cannot be in the future",
    },
  })
  foundedYear?: number;

  @Prop({ type: Number, min: 0 })
  numberOfCompanies?: number;

  @Prop({ type: Number, min: 0 })
  employeesInFreeZone?: number;

  @Prop({ type: Number, min: 0 })
  employeesInFreeZoneCompanies?: number;

  @Prop({ type: Number, min: 0 })
  jobsCreated?: number;

  @Prop()
  servicesOffered?: string;

  @Prop()
  mainActivitySectors?: string;

  @Prop()
  incentivesAndTaxBenefits?: string;
}

@Schema({ _id: false })
export class MemberNeeds {
  @Prop()
  consultingNeeded?: boolean;

  @Prop()
  consultingAreas?: string;

  @Prop()
  trainingNeeded?: boolean;

  @Prop()
  attendEvents?: boolean;

  @Prop()
  customizedSolutionsRequired?: boolean;

  @Prop()
  wantsGlobalSafeGreenSmartZoneRecognition?: boolean;
}

@Schema({ _id: false })
export class AdditionalInfo {
  @Prop({ type: String, enum: ["draft", "submitted"], default: "draft" })
  status: string = "draft";

  @Prop({ type: SecondaryContact })
  secondaryContact?: SecondaryContact;

  @Prop({ type: CompanyDetails })
  companyDetails?: CompanyDetails;

  @Prop({ type: Newsletter })
  newsletter?: Newsletter;

  @Prop({ type: FreeZoneInfo })
  freeZoneInfo?: FreeZoneInfo;

  @Prop({ type: MemberNeeds })
  memberNeeds?: MemberNeeds;
}

@Schema({ timestamps: true })
export class Member {
  /**
   * Application number - generated first when application starts
   * Auto-generated format: APP-001, APP-002, etc.
   */
  @Prop({ type: String, required: false })
  applicationNumber!: string;

  /**
   * Business identifier for the member
   * Auto-generated format: MEMBER-001, MEMBER-002, etc.
   * Generated along with applicationNumber
   * Unique index is created by migration 001-database-indexes.migration.ts
   */
  @Prop({ type: String, required: false })
  memberId!: string;

  /**
   * Denormalized user data for quick access and microservices readiness
   * This array contains snapshots of all users associated with this member
   */
  @Prop({ type: [UserSnapshot] })
  userSnapshots?: UserSnapshot[];

  @Prop({ required: true })
  category!: string;

  @Prop()
  tier?: string;

  @Prop({ required: true })
  status!: string;

  @Prop({ type: Date })
  validUntil?: Date;

  @Prop({ type: OrganisationInfo })
  organisationInfo?: OrganisationInfo;

  @Prop({ type: MemberConsent })
  memberConsent?: MemberConsent;

  @Prop({ type: Boolean, default: false })
  featuredMember?: boolean;

  @Prop({ type: Number })
  allowedUserCount?: number;

  @Prop({ type: AdditionalInfo })
  additionalInfo?: AdditionalInfo;

  /**
   * Approval workflow tracking
   */
  @Prop({ type: [ApprovalHistoryEntry], default: [] })
  approvalHistory?: ApprovalHistoryEntry[];

  /**
   * Rejection workflow tracking
   */
  @Prop({ type: [RejectionHistoryEntry], default: [] })
  rejectionHistory?: RejectionHistoryEntry[];

  /**
   * Payment tracking
   */
  @Prop({ type: String })
  paymentLink?: string;

  @Prop({ enum: ["pending", "paid"], default: "pending" })
  paymentStatus?: string;

  /**
   * Date when the approval letter was issued (set when member becomes active after payment)
   */
  @Prop({ type: Date })
  approvalDate?: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
// Index is created by migration 001-database-indexes.migration.ts
// MemberSchema.index({ memberId: 1 }, { unique: true });

/**
 * Pre-save hook to auto-generate applicationNumber and memberId
 * Format: APP-001, APP-002, etc. and MEMBER-001, MEMBER-002, etc.
 */
MemberSchema.pre("save", async function (next) {
  // Only generate IDs if it's a new document and they are not already set
  if (this.isNew && (!this.applicationNumber || !this.memberId)) {
    try {
      const Counter = this.db.model("Counter");

      // Generate application number if not set
      if (!this.applicationNumber) {
        const appCounter = await Counter.findOneAndUpdate(
          { name: "application" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true },
        );

        if (!appCounter || typeof appCounter.seq !== "number") {
          throw new Error("Failed to generate application number");
        }

        this.applicationNumber = `APP-${String(appCounter.seq).padStart(3, "0")}`;
      }

      // Generate member ID if not set
      if (!this.memberId) {
        const memberCounter = await Counter.findOneAndUpdate(
          { name: "member" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true },
        );

        if (!memberCounter || typeof memberCounter.seq !== "number") {
          throw new Error("Failed to generate member ID");
        }

        this.memberId = `MEMBER-${String(memberCounter.seq).padStart(3, "0")}`;
      }

      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});
