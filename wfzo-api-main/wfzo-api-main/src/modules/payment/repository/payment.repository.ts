import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { BaseRepository } from "@shared/common/base.repository";
import { Payment, PaymentDocument, PaymentType } from "../schemas/payment.schema";

@Injectable()
export class PaymentRepository extends BaseRepository<Payment> {
  constructor(@InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>) {
    super(paymentModel as unknown as Model<Payment>);
  }

  /**
   * Find payment by payment ID
   */
  async findByPaymentId(paymentId: string): Promise<Payment | null> {
    return this.findOne({ paymentId } as FilterQuery<Payment>);
  }

  /**
   * Find payment by payment reference ID
   */
  async findByPaymentReferenceId(paymentReferenceId: string): Promise<Payment | null> {
    return this.findOne({ paymentReferenceId } as FilterQuery<Payment>);
  }

  /**
  * Find payment by gateway transaction ID
  */
  async findByGatewayTransactionId(gatewayTransactionId: string): Promise<Payment | null> {
    return this.findOne({ gatewayTransactionId } as FilterQuery<Payment>);
  }

  /**
   * Add refund information to payment
   */
  async addRefund(
    paymentId: string,
    refundInfo: NonNullable<Payment["refunds"]>[0],
  ): Promise<Payment | null> {
    return this.updateOne(
      { paymentId } as FilterQuery<Payment>,
      {
        $push: { refunds: refundInfo },
      }
    );
  }

  /**
   * Find payment by entity ID and payment type
   * Returns the most recent payment (sorted by createdAt descending)
   */
  async findByEntityIdAndPaymentType(entityId: string, paymentType: PaymentType): Promise<Payment | null> {
    const merged = { entityId, paymentType, deletedAt: null } as FilterQuery<Payment>;
    const res = await this.paymentModel
      .findOne(merged)
      .sort({ createdAt: -1 }) // Get most recent payment first
      .lean<Payment>()
      .exec();
    return res as Payment | null;
  }
}
