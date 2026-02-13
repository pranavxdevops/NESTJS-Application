import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type MembershipDocument = HydratedDocument<Membership>;

@Schema({ _id: false })
export class Quota {
  @Prop({ required: true })
  kind!: string;

  @Prop({ type: Number })
  limit?: number | null;

  @Prop({ type: Number, default: 0 })
  used!: number;

  @Prop({ type: Number })
  remaining?: number;

  @Prop()
  window?: string;

  @Prop({ type: Date })
  resetsAt?: Date | null;
}

const QuotaSchema = SchemaFactory.createForClass(Quota);

@Schema({ _id: false })
export class Monetary {
  @Prop({ default: true })
  paymentRequired!: boolean;

  @Prop({ default: false })
  discountAvailable?: boolean;

  @Prop({ type: String, enum: ["percentage", "flat", null] })
  discountType?: string | null;

  @Prop({ type: Number })
  discountValue?: number;

  @Prop()
  currency?: string;
}

const MonetarySchema = SchemaFactory.createForClass(Monetary);

@Schema({ _id: false })
export class Approval {
  @Prop({ default: true })
  required!: boolean;

  @Prop()
  authority?: string;

  @Prop({ default: "pending" })
  status?: string;
}

const ApprovalSchema = SchemaFactory.createForClass(Approval);

@Schema({ _id: false })
export class Entitlement {
  @Prop({
    required: true,
    type: String,
    enum: ["none", "restricted", "unlimited", "payment", "approval"],
  })
  access!: string;

  @Prop({ type: QuotaSchema })
  quota?: Quota;

  @Prop({ type: MonetarySchema })
  monetary?: Monetary;

  @Prop({ type: ApprovalSchema })
  approval?: Approval;

  @Prop()
  notes?: string;
}

@Schema({ timestamps: true })
export class Membership {
  @Prop({ required: true, unique: true })
  type!: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  entitlements!: Record<string, Entitlement>;

  @Prop()
  description?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);

// Create index only on type (unique constraint already creates an index)
MembershipSchema.index({ deletedAt: 1 });
