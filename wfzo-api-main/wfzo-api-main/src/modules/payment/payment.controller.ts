import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
} from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PaymentService } from "./payment.service";
import {
  PaymentResponseDto,
  RefundPaymentDto,
} from "./dto/payment.dto";

@ApiTags("Payment")
@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get("status/:paymentId")
  @ApiOperation({
    summary: "Get payment status",
    description:
      "Retrieves the current status of a payment by payment ID. Optionally syncs with payment gateway for latest status.",
  })
  @ApiParam({
    name: "paymentId",
    required: true,
    description: "Payment ID (e.g., PAY-001)",
    example: "PAY-001",
  })
  @ApiOkResponse({
    description: "Payment status retrieved successfully",
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Payment not found",
  })
  async getPaymentStatus(@Param("paymentId") paymentId: string): Promise<PaymentResponseDto> {
    return this.paymentService.getPaymentStatus(paymentId);
  }

  @Get("details/:paymentId")
  @HttpCode(200)
  @ApiOperation({
    summary: "Get payment details",
    description:
      "Retrieves payment details from database including current status and payment link. Does not sync with payment gateway.",
  })
  @ApiParam({
    name: "paymentId",
    required: true,
    description: "Payment ID (e.g., PAY-001)",
    example: "PAY-001",
  })
  @ApiOkResponse({
    description: "Payment details retrieved successfully",
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Payment not found",
  })
  async getPaymentDetails(@Param("paymentId") paymentId: string): Promise<PaymentResponseDto> {
    return this.paymentService.getPaymentDetails(paymentId);
  }

  @Get("reference/:paymentReferenceId")
  @ApiOperation({
    summary: "Get payments by payment reference ID",
    description:
      "Retrieves all payments associated with a specific payment reference ID. Useful for finding all payments for an order.",
  })
  @ApiParam({
    name: "paymentReferenceId",
    required: true,
    description: "Payment Reference ID (e.g., ORDER_MEMBER-047)",
    example: "ORDER_MEMBER-047",
  })
  @ApiOkResponse({
    description: "Payments retrieved successfully",
    type: [PaymentResponseDto],
  })
  async getPaymentsByPaymentReferenceId(
    @Param("paymentReferenceId") paymentReferenceId: string,
  ): Promise<PaymentResponseDto[]> {
    return this.paymentService.getPaymentsByPaymentReferenceId(paymentReferenceId);
  }

  @Post("refund/:paymentId")
  @HttpCode(200)
  @ApiOperation({
    summary: "Refund a payment",
    description:
      "Processes a refund for a paid payment. Creates a refund record and updates payment status to refunded.",
  })
  @ApiParam({
    name: "paymentId",
    required: true,
    description: "Payment ID to refund (e.g., PAY-001)",
    example: "PAY-001",
  })
  @ApiOkResponse({
    description: "Refund processed successfully",
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid refund request (e.g., payment not paid)",
  })
  @ApiResponse({
    status: 404,
    description: "Payment not found",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error or payment gateway error",
  })
  async refundPayment(
    @Param("paymentId") paymentId: string,
    @Body() dto: RefundPaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.refundPayment(paymentId, dto);
  }

  @Post("callback")
  @HttpCode(200)
  @ApiOperation({
    summary: "Payment gateway callback/webhook",
    description:
      "Endpoint for payment gateway to send payment status updates. This is called automatically by the payment gateway when payment status changes. Should not be called directly by clients.",
  })
  @ApiOkResponse({
    description: "Callback processed successfully",
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid callback data",
  })
  @ApiResponse({
    status: 404,
    description: "Payment not found",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error processing callback",
  })
  async handleCallback(@Body() callbackData: Record<string, any>): Promise<PaymentResponseDto> {
    return this.paymentService.handlePaymentCallback(callbackData);
  }
}
