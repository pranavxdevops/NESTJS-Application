import { Injectable, Logger, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import {
  CreatePaymentRequestDto,
  CustomerDetailsDto,
  TransactionType,
  TransactionClass,
} from "../dto/payment.dto";
import { PaymentStatus } from "../schemas/payment.schema";
import { Member } from "@modules/member/schemas/member.schema";
import { ConfigService } from "@shared/config/config.service";
import axios from "axios";

/**
 * PayTabs response code to status letter mapping
 * Maps PayTabs response codes to status letters (A=Authorized, E=Error, D=Declined, etc.)
 */
const PAYTABS_CODE_TO_STATUS: Record<string, string> = {
  // Auth
  "0": "A",
  // Error
  "1": "E", "2": "E", "3": "E", "4": "E", "5": "E",
  "100": "E", "101": "E", "102": "E", "103": "E", "104": "E", "105": "E",
  "106": "E", "107": "E", "108": "E", "109": "E", "110": "E", "111": "E",
  "112": "E", "113": "E", "114": "E", "115": "E", "116": "E", "117": "E",
  "118": "E", "119": "E", "120": "E", "121": "E", "123": "E",
  "200": "E", "201": "E", "202": "E", "203": "E", "204": "E", "205": "E",
  "207": "E", "208": "E", "209": "E", "211": "E", "212": "E", "214": "E",
  "215": "E", "216": "E", "349": "E", "400": "E", "401": "E", "402": "E",
  // Declined
  "122": "D", "206": "D", "213": "D", "300": "D", "301": "D", "302": "D",
  "303": "D", "304": "D", "305": "D", "306": "D", "307": "D", "308": "D",
  "309": "D", "310": "D", "311": "D", "312": "D", "313": "D", "314": "D",
  "315": "D", "316": "D", "317": "D", "318": "X", "319": "D", "320": "D",
  "321": "C", "322": "D", "323": "D", "324": "D", "325": "D", "326": "D",
  "327": "D", "328": "D", "329": "D", "330": "D", "331": "D", "332": "D",
  "333": "D", "334": "D", "335": "D", "336": "D", "337": "D", "338": "D",
  "339": "D", "340": "D", "341": "D", "342": "D", "343": "D", "344": "D",
  "345": "D", "346": "D", "347": "D", "348": "D", "350": "D", "351": "D",
  "500": "D", "501": "D", "502": "D", "503": "D", "504": "D",
  // Pending / hold / cancelled
  "600": "P",
  "601": "H",
};

/**
 * PayTabs Payment Gateway Service
 * Handles all PayTabs-specific payment gateway operations
 * Uses PayTabs PT2 library for communication
 */
@Injectable()
export class PaytabPaymentGatewayService {
  private readonly logger = new Logger(PaytabPaymentGatewayService.name);
  private readonly profileId: number;
  private readonly serverKey: string;
  private readonly region: string;
  private initialized = false;

  /**
   * Get payment link expiry time in minutes
   * Defaults to 20 minutes if not configured
   */
  getPaymentLinkExpiryMinutes(): number {
    return this.configService.getPaymentGatewayPaymentLinkExpiryInMinutes() || 20;
  }

  constructor(private readonly configService: ConfigService) {
    // Get PayTabs configuration from ConfigService
    this.profileId = this.configService.getPaymentGatewayProfileId();
    this.serverKey = this.configService.getPaymentGatewayServerKey();
    this.region = this.configService.getPaymentGatewayRegion();

    if (!this.serverKey) {
      this.logger.warn(
        "PAYMENT_GATEWAY_SERVER_KEY is not configured. Payment gateway operations may fail.",
      );
    }

    // Initialize PayTabs configuration
    try {
      this.initialized = true;
      this.logger.log(
        `PayTabs gateway service initialized with profile ID: ${this.profileId}, region: ${this.region}`,
      );
    } catch (error) {
      this.logger.error("Failed to initialize PayTabs configuration:", error);
      throw new InternalServerErrorException("Failed to initialize payment gateway");
    }
  }

  /**
   * Ensure PayTabs is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialized = true;
    }
  }

  /**
   * Create payment link for a member
   * Handles all PayTabs-specific logic: extracts customer details, builds request, calls PayTabs
   */
  async createPaymentLinkForMember(member: Member, amount: number, currency: string, cartId: string): Promise<any> {
    // Extract customer details from member
    const customerDetails = this.extractCustomerDetailsFromMember(member);

    // Build PayTabs payment request
    const paymentRequest = this.buildPaymentRequest({
      memberId: member.memberId,
      amount,
      currency,
      cartId,
      customerDetails,
      userId: member.userSnapshots?.[0]?.id,
    });

    // Call PayTabs to create payment page
    const gatewayResponse = await this.createPaymentRequest(paymentRequest);

    return gatewayResponse;
  }

  /**
   * Build PayTabs payment request from member details and amount
   * This constructs the full CreatePaymentRequestDto with PayTabs-specific defaults
   */
  private buildPaymentRequest(params: {
    memberId: string;
    amount: number;
    currency: string;
    cartId: string;
    customerDetails: CustomerDetailsDto;
    userId?: string;
  }): CreatePaymentRequestDto {
    const profileId = this.configService.getPaymentGatewayProfileId();
    
    // Get expiry in minutes for PayTabs API
    const expiresIn = this.configService.getPaymentGatewayPaymentLinkExpiryInMinutes();

    return {
      profileId,
      tranType: TransactionType.SALE,
      tranClass: TransactionClass.ECOM,
      cartId: params.cartId,
      cartCurrency: params.currency,
      cartAmount: params.amount,
      cartDescription: `Membership payment for ${params.memberId}`,
      customerDetails: params.customerDetails,
      hideShipping: true,
      callback: this.configService.getPaymentGatewayCallbackUrl(),
      return: this.configService.getPaymentGatewayReturnUrl(),
      tokenise: 2,
      showSaveCard: false,
      expiresIn,
    };
  }

  /**
   * Extract customer details from member for PayTabs
   */
  private extractCustomerDetailsFromMember(member: Member): CustomerDetailsDto {
    // Get primary user (first user snapshot or primary contact)
    const primaryUser =
      member.userSnapshots?.find((u) => u.userType === "Primary") ||
      member.userSnapshots?.[0];

    if (!primaryUser) {
      throw new BadRequestException(
        `Member ${member.memberId} does not have any associated users`,
      );
    }

    // Get address from organisation info
    const address = member.organisationInfo?.address;

    if (!address) {
      throw new BadRequestException(
        `Member ${member.memberId} does not have address information`,
      );
    }

    // Construct customer name
    const firstName = primaryUser.firstName || "";
    const lastName = primaryUser.lastName || "";
    const name = `${firstName} ${lastName}`.trim() || primaryUser.email.split("@")[0];

    // Map country code (if needed, convert from full name to ISO code)
    let countryCode = address.country;
    if (countryCode && countryCode.length > 3) {
      countryCode = this.mapCountryNameToCode(countryCode);
    }

    return {
      name,
      email: primaryUser.email,
      phone: primaryUser.contactNumber || "",
      country: countryCode || "ARE", // Default to UAE if not found
      state: address.state || "Dubai",
      city: address.city || "Dubai",
      street1: address.line1 || "",
      zip: address.zip || "",
    };
  }

  /**
   * Map country name to ISO 3166-1 alpha-3 code
   */
  private mapCountryNameToCode(countryName: string): string {
    const countryMap: Record<string, string> = {
      "United Arab Emirates": "ARE",
      "United States": "USA",
      "United Kingdom": "GBR",
      "Saudi Arabia": "SAU",
      // Add more mappings as needed
    };

    return countryMap[countryName] || countryName;
  }

  /**
   * Get PayTabs API endpoint based on region
   */
  private getPayTabsEndpoint(): string {
    const regions_urls: Record<string, string> = {
      ARE: "https://secure.paytabs.com/",
      SAU: "https://secure.paytabs.sa/",
      OMN: "https://secure-oman.paytabs.com/",
      JOR: "https://secure-jordan.paytabs.com/",
      EGY: "https://secure-egypt.paytabs.com/",
      KWT: "https://secure-kuwait.paytabs.com/",
      GLOBAL: "https://secure-global.paytabs.com/",
    };

    return regions_urls[this.region] || regions_urls.GLOBAL;
  }

  /**
   * Create a payment request with PayTabs
   * Returns payment page URL
   * Uses direct API call to support expires_in parameter
   */
  async createPaymentRequest(dto: CreatePaymentRequestDto): Promise<any> {
    try {
      this.ensureInitialized();
      this.logger.log(`Creating PayTabs payment request for cart: ${dto.cartId}`);

      // Build customer details object
      const customerDetails = {
        name: dto.customerDetails.name,
        email: dto.customerDetails.email,
        phone: dto.customerDetails.phone || "",
        street1: dto.customerDetails.street1,
        city: dto.customerDetails.city,
        state: dto.customerDetails.state,
        country: dto.customerDetails.country,
        zip: dto.customerDetails.zip || "",
        ip: "", // IP address (optional)
      };

      // Use customer details as shipping details if hideShipping is true
      const shippingDetails = dto.hideShipping ? customerDetails : {
        name: dto.customerDetails.name,
        email: dto.customerDetails.email,
        phone: dto.customerDetails.phone || "",
        street1: dto.customerDetails.street1,
        city: dto.customerDetails.city,
        state: dto.customerDetails.state,
        country: dto.customerDetails.country,
        zip: dto.customerDetails.zip || "",
        ip: "", // IP address (optional)
      };

      // Build request payload
      const requestData: any = {
        profile_id: this.profileId,
        payment_methods: ["all"],
        tran_type: dto.tranType,
        tran_class: dto.tranClass,
        cart_id: dto.cartId,
        cart_currency: dto.cartCurrency,
        cart_amount: parseFloat(dto.cartAmount.toString()),
        cart_description: dto.cartDescription,
        paypage_lang: "en",
        customer_details: customerDetails,
        shipping_details: shippingDetails,
        callback: dto.callback || "",
        return: dto.return || "",
        framed: false,
        hide_shipping: dto.hideShipping,
      };

      // Add expires_in if provided
      if (dto.expiresIn !== undefined && dto.expiresIn !== null) {
        requestData.expires_in = dto.expiresIn;
      }

      // Add optional fields
      if (dto.tokenise !== undefined) {
        requestData.tokenise = dto.tokenise;
      }
      if (dto.showSaveCard !== undefined) {
        requestData.show_save_card = dto.showSaveCard;
      }

      const url = `${this.getPayTabsEndpoint()}payment/request`;

      this.logger.debug(`Sending PayTabs payment request to: ${url}`, {
        cartId: dto.cartId,
        hasExpiresIn: dto.expiresIn !== undefined,
      });

      // Make direct API call to PayTabs
      const response = await axios.post(url, requestData, {
        headers: {
          authorization: this.serverKey,
        },
      });

      const result = response.data;
      this.logger.debug(`createPaymentPage result for ${dto.cartId}:`, result);

      // Success if tran_ref and redirect_url are available
      if (result && result.tran_ref && result.redirect_url) {
        // Success - payment page created
        this.logger.log(
          `PayTabs payment page created successfully for cart: ${dto.cartId}, tran_ref: ${result.tran_ref}`,
        );
        return {
          transactionId: result.tran_ref,
          tranRef: result.tran_ref,
          paymentLink: result.redirect_url,
          redirect_url: result.redirect_url,
          responseCode: result.response_code || "4001",
          responseMessage: result.result || "Payment page created successfully",
          ...result,
        };
      } else {
        // Error response - missing tran_ref or redirect_url
        const errorMessage =
          result?.result || result?.message || "Failed to create payment page - missing tran_ref or redirect_url";
        this.logger.error(`PayTabs error for cart ${dto.cartId}:`, errorMessage, result);
        throw new BadRequestException(
          `PayTabs payment creation failed: ${errorMessage}`,
        );
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleGatewayError(error, "createPaymentRequest");
    }
  }

  /**
   * Check if payment is successful based on payment_result
   * Payment is successful if response_status is "A" and response_message is "Authorised"
   */
  private isPaymentSuccessful(paymentResult: any): boolean {
    const statusLetter = this.extractStatusLetter(paymentResult);
    return statusLetter === "A" && paymentResult?.response_message === "Authorised";
  }

  /**
   * Build paymentResult object from PayTabs response
   * Includes payment_result if exists, otherwise includes error response fields
   */
  private buildPaymentResult(result: any): any {
    return result.payment_result
      ? result.payment_result
      : {
        response_code: result.response_code,
        result: result.result,
        message: result.message,
        ...result,
      };
  }

  /**
   * Extract PayTabs status letter from payment_result or response_code
   */
  private extractStatusLetter(paymentResult: any): string | null {
    if (paymentResult?.response_status) {
      return paymentResult.response_status;
    }

    const code = paymentResult?.response_code?.toString();
    if (!code) return null;

    return PAYTABS_CODE_TO_STATUS[code] || null;
  }

  /**
   * Validate payment using PayTabs payment/query endpoint
   * This is used to get payment status and details
   */
  async getPaymentStatus(transactionReference: string): Promise<any> {
    try {
      this.ensureInitialized();
      this.logger.log(`Validating PayTabs payment: ${transactionReference}`);

      const url = `${this.getPayTabsEndpoint()}payment/query`;
      const requestData = {
        profile_id: this.profileId,
        tran_ref: transactionReference,
      };

      this.logger.debug(`Sending PayTabs payment query to: ${url}`, {
        transactionReference,
      });

      const response = await axios.post(url, requestData, {
        headers: {
          authorization: this.serverKey,
        },
      });

      const result = response.data;
      this.logger.debug(`validatePayment result for ${transactionReference}:`, result);

      // Check if payment is successful
      const isSuccess = this.isPaymentSuccessful(result?.payment_result);

      // Build paymentResult object
      const paymentResult = this.buildPaymentResult(result);

      // Map status from payment_result response_status or response_code
      const statusLetter =
        this.extractStatusLetter(result.payment_result) ||
        result.payment_result?.response_status;
      const mappedStatus = this.mapGatewayStatusToPaymentStatus(statusLetter || "pending");

      if (isSuccess) {
        // Payment validated successfully
        this.logger.log(`Payment validated successfully: ${transactionReference}`);
        return {
          transactionId: result.tran_ref,
          status: mappedStatus,
          responseCode: result.response_code,
          responseMessage: result.payment_result?.response_message,
          paymentResult, // Include payment_result or error response in DB storage
          ...result,
        };
      } else {
        // Validation failed or payment not found
        const errorMessage = result?.payment_result?.response_message || result?.result || result?.message || "Payment validation failed";
        this.logger.warn(`PayTabs validation result for ${transactionReference}:`, errorMessage);
        return {
          transactionId: transactionReference,
          status: mappedStatus || "failed", // Use mapped status, fallback to "failed"
          responseCode: result?.response_code || result?.payment_result?.response_code || "4000",
          responseMessage: errorMessage,
          paymentResult, // Include payment_result or error response in DB storage
          ...result,
        };
      }
    } catch (error: any) {
      this.logger.error(`Error validating payment ${transactionReference}:`, error);
      
      // Handle axios errors
      if (error.response) {
        const errorResult = error.response.data;
        return {
          transactionId: transactionReference,
          status: "failed",
          responseCode: errorResult?.response_code || "4000",
          responseMessage: errorResult?.result || errorResult?.message || "Payment validation failed",
          paymentResult: errorResult,
        };
      }
      
      this.handleGatewayError(error, "getPaymentStatus");
    }
  }


  /**
   * Process refund through PayTabs using payment/request endpoint with refund transaction type
   */
  async processRefund(
    transactionReference: string,
    cartId: string,
    cartCurrency: string,
    cartAmount: number,
    cartDescription: string,
    refundAmount?: number,
  ): Promise<any> {
    try {
      this.ensureInitialized();
      this.logger.log(`Processing PayTabs refund for transaction: ${transactionReference}`);

      // Use refund amount if provided, otherwise use full cart amount
      const refundAmountValue = refundAmount || cartAmount;

      const url = `${this.getPayTabsEndpoint()}payment/request`;
      const requestData = {
        profile_id: this.profileId,
        tran_ref: transactionReference,
        tran_type: "refund",
        tran_class: "ecom",
        cart_id: cartId,
        cart_currency: cartCurrency,
        cart_amount: parseFloat(refundAmountValue.toString()),
        cart_description: cartDescription || `Refund for ${cartId}`,
      };

      this.logger.debug(`Sending PayTabs refund request to: ${url}`, {
        transactionReference,
        refundAmount: refundAmountValue,
      });

      const response = await axios.post(url, requestData, {
        headers: {
          authorization: this.serverKey,
        },
      });

      const result = response.data;
      this.logger.debug(`queryTransaction result for ${transactionReference}:`, result);

      // Check if refund is successful
      const isSuccess = this.isPaymentSuccessful(result?.payment_result);

      // Build paymentResult object
      const paymentResult = this.buildPaymentResult(result);

      if (isSuccess || result?.response_code === "4001") {
        this.logger.log(
          `Refund processed successfully for transaction: ${transactionReference}`,
        );
        return {
          refundId: result.tran_ref || result.refund_ref || transactionReference,
          transactionId: transactionReference,
          amount: refundAmountValue,
          responseCode: result.response_code,
          responseMessage: result.payment_result?.response_message || result.result,
          paymentResult,
          ...result,
        };
      } else {
        const errorMessage = result?.payment_result?.response_message || result?.result || result?.message || "Refund failed";
        this.logger.error(
          `PayTabs refund error for ${transactionReference}:`,
          errorMessage,
        );
        throw new BadRequestException(`PayTabs refund failed: ${errorMessage}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing refund ${transactionReference}:`, error);
      
      // Handle axios errors
      if (error.response) {
        const errorResult = error.response.data;
        const errorMessage = errorResult?.result || errorResult?.message || "Refund failed";
        throw new BadRequestException(`PayTabs refund failed: ${errorMessage}`);
      }
      
      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.handleGatewayError(error, "processRefund");
    }
  }

  /**
   * Normalize PayTabs gateway response to standard format
   */
  normalizeGatewayResponse(gatewayResponse: any): {
    gatewayTransactionId: string;
    gatewayName: string;
    paymentResult?: any;
    paymentLink?: string;
  } {
    return {
      gatewayTransactionId: gatewayResponse.tran_ref || "",
      gatewayName: "paytabs",
      paymentResult: gatewayResponse.payment_result, // Explicitly save payment_result for easy access
      paymentLink: gatewayResponse.redirect_url,
    };
  }

  /**
   * Map PayTabs response status to our payment status
   */
  mapGatewayStatusToPaymentStatus(gatewayStatus: string): PaymentStatus {
    if (!gatewayStatus) return "pending";

    const normalizedUpper = gatewayStatus.toString().toUpperCase();
    const normalizedLower = gatewayStatus.toString().toLowerCase();

    const statusMap: Record<string, PaymentStatus> = {
      success: "paid",
      completed: "paid",
      paid: "paid",
      pending: "pending",
      processing: "processing",
      failed: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
      partially_refunded: "partially_refunded",
      // PayTabs specific status codes
      A: "paid", // Authorized
      V: "paid", // Captured
      H: "pending", // Hold
      E: "failed", // Error
      D: "failed", // Declined
      X: "failed", // Authorization expired
      P: "pending", // Pending
      C: "cancelled", // Cancelled
    };

    return (
      statusMap[normalizedUpper] ||
      statusMap[normalizedLower] ||
      "pending"
    );
  }

  /**
   * Process PayTabs callback and extract payment information
   * Accepts generic callback data but processes it as PayTabs format
   */
  processCallback(callbackData: Record<string, any>): {
    transactionRef: string | null;
    paymentReferenceId: string | null;
    status: PaymentStatus;
    gatewayResponse: any;
  } {
    // Extract PayTabs-specific fields from callback data
    const transactionRef = callbackData.tran_ref || null;
    const cartId = callbackData.cart_id || null;

    // Determine status from callback data
    // Check if payment is successful using common method
    const isSuccess = this.isPaymentSuccessful(callbackData.payment_result);

    const status = isSuccess
      ? "paid"
      : this.mapGatewayStatusToPaymentStatus(
        callbackData.status ||
        callbackData.payment_result?.response_status ||
        "pending",
      );

    return {
      transactionRef,
      paymentReferenceId: cartId,
      status,
      gatewayResponse: callbackData,
    };
  }

  /**
   * Handle payment gateway errors
   */
  private handleGatewayError(error: unknown, operation: string): never {
    this.logger.error(`PayTabs error in ${operation}:`, error);

    if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
      throw error;
    }

    throw new InternalServerErrorException(
      `PayTabs gateway error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

