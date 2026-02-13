import fs from "node:fs";
import path from "node:path";
import PropertiesReader from "properties-reader";
import { Injectable } from "@nestjs/common";

type PropReader = ReturnType<typeof PropertiesReader>;

@Injectable()
export class ConfigService {
  private readonly props: PropReader;

  constructor() {
    const filePath = path.resolve(process.cwd(), "config", "application.properties");
    if (!fs.existsSync(filePath)) {
      // ensure directory exists and create an empty properties file so PropertiesReader can load it
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, "");
    }
    this.props = PropertiesReader(filePath);
  }

  private getString(key: string, def?: string): string | undefined {
    // Try process.env first (populated by NestJS ConfigModule or dotenv)
    const envVal = process.env[key];
    if (envVal !== undefined && envVal !== "") return envVal;
    // Fallback to properties file
    const propVal = this.props.get(key);
    if (typeof propVal === "string" && propVal !== "") return propVal;
    return def;
  }

  getPort(): number {
    const v = this.getString("PORT", "3000");
    return Number(v);
  }

  getLogLevel(): string {
    return this.getString("LOG_LEVEL", "info")!;
  }

  getMongoUri(): string {
    return this.getString("MONGODB_URI", "mongodb://localhost:27017/wfzo")!;
  }

  getJwtSecret(): string {
    return this.getString("JWT_SECRET", "dev-secret")!;
  }

  getJwtIssuer(): string | undefined {
    return this.getString("JWT_ISSUER");
  }

  getJwtAudience(): string | undefined {
    return this.getString("JWT_AUDIENCE");
  }

  getBlobConnectionString(): string | undefined {
    return this.getString("AZURE_BLOB_CONNECTION_STRING");
  }

  getBlobAccountUrl(): string | undefined {
    return this.getString("AZURE_BLOB_ACCOUNT_URL");
  }

  getBlobSas(): string | undefined {
    return this.getString("AZURE_BLOB_SAS");
  }

  getBlobContainer(): string {
    return this.getString("AZURE_BLOB_CONTAINER", "wfzo-assets")!;
  }

  getOpenaiApiKey(): string | undefined {
    return this.getString("OPENAI_API_KEY");
  }

  getOpenaiModel(): string {
    return this.getString("OPENAI_MODEL", "text-embedding-3-small")!;
  }

  getTypesenseHost(): string {
    return this.getString("TYPESENSE_HOST", "localhost")!;
  }

  getTypesensePort(): string {
    return this.getString("TYPESENSE_PORT", "8108")!;
  }

  getTypesenseProtocol(): string {
    return this.getString("TYPESENSE_PROTOCOL", "http")!;
  }

  getTypesenseApiKey(): string {
    return this.getString("TYPESENSE_API_KEY", "")!;
  }

  getTypesenseCollection(): string {
    return this.getString("TYPESENSE_COLLECTION", "documents")!;
  }

  getPaymentGatewayProfileId(): number {
    const v = this.getString("PAYMENT_GATEWAY_PROFILE_ID", "");
    return parseInt(v || "0", 10);
  }

  getPaymentGatewayServerKey(): string {
    return this.getString("PAYMENT_GATEWAY_SERVER_KEY", "")!;
  }

  getPaymentGatewayRegion(): string {
    return this.getString("PAYMENT_GATEWAY_REGION", "ARE")!;
  }

  getPaymentGatewayCurrency(): string {
    return this.getString("PAYMENT_GATEWAY_CURRENCY", "USD")!;
  }

  getPaymentGatewayCallbackUrl(): string {
    return this.getString("PAYMENT_GATEWAY_CALLBACK_URL", "")!;
  }

  getPaymentGatewayReturnUrl(): string {
    return this.getString("PAYMENT_GATEWAY_RETURN_URL", "")!;
  }

  getMembershipFeeAmount(): number {
    const v = this.getString("MEMBERSHIP_FEE_AMOUNT", "0");
    return parseFloat(v || "0");
  }

  getPaymentGatewayExpiresIn(): number | undefined {
    const v = this.getString("PAYMENT_GATEWAY_EXPIRES_IN");
    if (v) {
      return parseInt(v, 10);
    }
    return undefined;
  }

  getPaymentGatewayPaymentLinkExpiryInMinutes(): number | undefined {
    const v = this.getString("PAYMENT_GATEWAY_PAYMENT_LINK_EXPIRY_IN_MINUTES");
    if (v) {
      return parseInt(v, 10);
    }
    return undefined;
  }

  // Search parameter defaults
  getSearchParamSearchType(): string {
    return this.getString("SEARCH_PARAM_SEARCH_TYPE", "semantic")!;
  }

  getSearchParamHybridAlpha(): number {
    const v = this.getString("SEARCH_PARAM_HYBRID_ALPHA", "0.7");
    return parseFloat(v || "0.7");
  }

  getSearchParamPrioritizeExactMatch(): boolean {
    const v = this.getString("SEARCH_PARAM_PRIORITIZE_EXACT_MATCH", "true");
    return v?.toLowerCase() === "true" || v === "1";
  }

  getSearchParamNumTypos(): number {
    const v = this.getString("SEARCH_PARAM_NUM_TYPOS", "2");
    return parseInt(v || "2", 10);
  }

  getSearchParamEfMultiplier(): number {
    const v = this.getString("SEARCH_PARAM_EF_MULTIPLIER", "3");
    return parseFloat(v || "3");
  }

  getSearchParamFlatSearchCutoff(): number {
    const v = this.getString("SEARCH_PARAM_FLAT_SEARCH_CUTOFF", "20");
    return parseInt(v || "20", 10);
  }

  getSearchParamDistanceThreshold(): number {
    const v = this.getString("SEARCH_PARAM_DISTANCE_THRESHOLD", "0.8");
    return parseFloat(v || "0.8");
  }

  getApiKey(): string | undefined {
    return this.getString("API_KEY");
  }
}
