import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsEmail,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

export enum TransactionType {
  SALE = "sale",
  AUTHORIZE = "authorize",
}

export enum TransactionClass {
  ECOM = "ecom",
  MOTO = "moto",
}

export enum Tokenise {
  NO = 0,
  YES = 1,
  YES_WITH_SAVE_CARD = 2,
}

/**
 * Customer details for payment
 */
export class CustomerDetailsDto {
  @ApiProperty({ description: "Customer name", example: "Test Test" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "Customer email", example: "email@domain.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: "Customer phone", example: "+971501234567" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: "Country code (ISO 3166-1 alpha-3)", example: "ARE" })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ description: "State/Province", example: "Dubai" })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ description: "City", example: "Dubai" })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ description: "Street address", example: "address street" })
  @IsString()
  @IsNotEmpty()
  street1!: string;

  @ApiPropertyOptional({ description: "ZIP/Postal code", example: "12345" })
  @IsString()
  @IsOptional()
  zip?: string;
}

/**
 * Simplified DTO for creating a payment request from backend
 * Only requires memberId and amount - member details are fetched automatically
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: "Entity ID for the payment",
    example: "MEMBER-001",
  })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiProperty({
    description: "Entity type for the payment",
    example: "member",
  })
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiProperty({
    description: "Entity details for the payment",
    example: {},
  })
  @IsString()
  @IsNotEmpty()
  entity?: Record<string, any>;

  @ApiProperty({
    description: "Payment amount",
    example: 100,
  })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: "Currency",
    example: "USD",
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;
}

/**
 * DTO for creating a payment request (full gateway request)
 */
export class CreatePaymentRequestDto {
  @ApiProperty({ description: "Profile ID from payment gateway", example: 49280 })
  @IsNumber()
  profileId!: number;

  @ApiProperty({
    description: "Transaction type",
    enum: TransactionType,
    example: TransactionType.SALE,
  })
  @IsEnum(TransactionType)
  tranType!: TransactionType;

  @ApiProperty({
    description: "Transaction class",
    enum: TransactionClass,
    example: TransactionClass.ECOM,
  })
  @IsEnum(TransactionClass)
  tranClass!: TransactionClass;

  @ApiProperty({ description: "Cart/Order ID", example: "ORDER_10005" })
  @IsString()
  @IsNotEmpty()
  cartId!: string;

  @ApiProperty({ description: "Currency code (ISO 4217)", example: "AED" })
  @IsString()
  @IsNotEmpty()
  cartCurrency!: string;

  @ApiProperty({ description: "Cart amount", example: 1 })
  @IsNumber()
  cartAmount!: number;

  @ApiProperty({
    description: "Cart description",
    example: "Payment with tok enabled, save card enabled",
  })
  @IsString()
  @IsNotEmpty()
  cartDescription!: string;

  @ApiProperty({ description: "Customer details", type: CustomerDetailsDto })
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customerDetails!: CustomerDetailsDto;

  @ApiPropertyOptional({ description: "Hide shipping information", example: true })
  @IsBoolean()
  @IsOptional()
  hideShipping?: boolean;

  @ApiPropertyOptional({ description: "Callback URL for payment gateway" })
  @IsString()
  @IsOptional()
  callback?: string;

  @ApiPropertyOptional({ description: "Return URL after payment" })
  @IsString()
  @IsOptional()
  return?: string;

  @ApiProperty({
    description: "Tokenise option (0=No, 1=Yes, 2=Yes with save card)",
    enum: Tokenise,
    example: Tokenise.YES_WITH_SAVE_CARD,
  })
  @IsEnum(Tokenise)
  @IsOptional()
  tokenise?: Tokenise;

  @ApiPropertyOptional({ description: "Show save card option", example: false })
  @IsBoolean()
  @IsOptional()
  showSaveCard?: boolean;

  @ApiPropertyOptional({ 
    description: "Payment link expiration time in minutes", 
    example: 20 
  })
  @IsNumber()
  @IsOptional()
  expiresIn?: number;
}

/**
 * DTO for payment response
 */
export class PaymentResponseDto {
  @ApiProperty({ description: "Payment ID" })
  paymentId!: string;

  @ApiProperty({ description: "Payment status" })
  status!: string;

  @ApiPropertyOptional({ description: "Payment link URL" })
  paymentLink?: string;

  @ApiPropertyOptional({ description: "Gateway transaction ID" })
  gatewayTransactionId?: string;

  @ApiProperty({ description: "Payment Reference ID" })
  paymentReferenceId!: string;

  @ApiProperty({ description: "Amount" })
  amount!: number;

  @ApiProperty({ description: "Currency" })
  currency!: string;

  @ApiPropertyOptional({ description: "Total refunded amount" })
  refundedAmount?: number;

  @ApiPropertyOptional({ description: "Payment link expiration timestamp" })
  paymentLinkExpiresAt?: Date;

  @ApiPropertyOptional({ description: "Whether payment link is expired" })
  isPaymentLinkExpired?: boolean;
}

/**
 * DTO for refund request
 */
export class RefundPaymentDto {
  @ApiProperty({ description: "Refund amount", example: 100 })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: "Refund reason", example: "Customer requested refund" })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: "User ID who initiated the refund" })
  @IsString()
  @IsOptional()
  refundedBy?: string;
}

/**
 * DTO for PayTabs callback/webhook
 * PayTabs sends this data to the callback URL after payment processing
 */
export class PayTabsCallbackDto {
  @ApiProperty({ description: "Transaction reference from PayTabs" })
  @IsString()
  @IsOptional()
  tranRef?: string;

  @ApiProperty({ description: "Cart ID" })
  @IsString()
  @IsOptional()
  cartId?: string;

  @ApiProperty({ description: "Payment result status" })
  @IsString()
  @IsOptional()
  paymentResult?: string;

  @ApiProperty({ description: "Response code" })
  @IsString()
  @IsOptional()
  responseCode?: string;

  @ApiPropertyOptional({ description: "Result message" })
  @IsString()
  @IsOptional()
  result?: string;

  // Allow any additional fields from PayTabs callback
  [key: string]: any;
}

