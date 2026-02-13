import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { ClientSecretCredential } from "@azure/identity";

/**
 * EntraService - Microsoft Entra ID User Management
 *
 * IMPORTANT: This service is ONLY for user lifecycle management (create, update, delete).
 * It does NOT handle authentication - that's done via OAuth 2.0 SSO flow.
 *
 * For SSO authentication:
 * - Frontend uses MSAL to get JWT from Entra
 * - Backend validates JWT using EntraJwtStrategy
 * - Passwords NEVER touch this backend
 *
 * This service handles:
 * - Creating users in Entra ID (for admin user management)
 * - Updating user profiles
 * - Deleting users
 * - Mock mode for local development
 */
@Injectable()
export class EntraService {
  private readonly logger = new Logger(EntraService.name);
  private readonly isMockMode: boolean;
  private graphClient: Client | null = null;

  // Mock storage for development (in-memory)
  private mockUsers: Map<
    string,
    {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }
  > = new Map();

  constructor(private readonly configService: ConfigService) {
    this.isMockMode = this.configService.get<string>("ENTRA_INTEGRATION_MODE") === "mock";
    this.logger.log(`EntraService initialized in ${this.isMockMode ? "MOCK" : "REAL"} mode`);
    if (this.isMockMode) {
      this.logger.warn(
        "⚠️  Entra ID is running in MOCK MODE - not suitable for production! " +
          "User management operations will be simulated in-memory.",
      );
    } else {
      this.initializeEntraClient();
    }
  }

  /**
   * Initialize Microsoft Graph API client for user management
   * Note: MSAL is NOT needed here - authentication is done via OAuth 2.0 SSO flow
   */
  private initializeEntraClient(): void {
    try {
      const tenantId = this.configService.get<string>("ENTRA_TENANT_ID");
      const clientId = this.configService.get<string>("ENTRA_CLIENT_ID");
      const clientSecret = this.configService.get<string>("ENTRA_CLIENT_SECRET");
      this.logger.log("Initializing Microsoft Graph API client for Entra ID user management");
      // Check if we have placeholder/dummy values (all zeros or dummy secret)
      const hasPlaceholderValues =
        !tenantId ||
        !clientId ||
        !clientSecret ||
        tenantId === "00000000-0000-0000-0000-000000000000" ||
        clientId === "00000000-0000-0000-0000-000000000000" ||
        clientSecret.includes("dummy");

      if (hasPlaceholderValues) {
        this.logger.warn(
          "⚠️  Entra ID credentials not configured (using placeholders). " +
            "User management will fail in real mode. " +
            "Set ENTRA_INTEGRATION_MODE=mock for development, or configure real credentials.",
        );
        this.graphClient = null;
        return;
      }

      // Initialize Graph API client for user management ONLY
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: [this.configService.get<string>("ENTRA_SCOPES") || ".default"],
      });

      this.graphClient = Client.initWithMiddleware({ authProvider });

      this.logger.log("✅ Microsoft Graph API client initialized for user management");
    } catch (error) {
      this.logger.error("❌ Failed to initialize Graph API client:", error);
      this.logger.warn("   Falling back to non-functional mode. User management will fail.");
      this.graphClient = null;
    }
  }

  /**
   * Create a new user in Microsoft Entra ID
   *
   * @param userData User information
   * @returns Entra user ID
   */
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ entraUserId: string; temporaryPassword: string }> {
    this.logger.debug(`Entra createUser called for ${userData.email}`, {
      isMockMode: this.isMockMode,
      graphClientExists: !!this.graphClient,
    });

    if (this.isMockMode) {
      return this.createMockUser(userData);
    }

    try {
      const isExternalId = this.configService.get<string>("ENTRA_TYPE") === "external";

      if (isExternalId) {
        // For Entra External ID (CIAM), create user with local account (email/password)
        this.logger.log(
          `Creating external user in Entra External ID: ${userData.email}`,
        );

        const temporaryPassword = this.generateTemporaryPassword();
        const defaultDomain = "worldfzousers.onmicrosoft.com";
        
        // Create a UPN using the tenant domain (required by Entra)
        const mailNickname = userData.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
        const userPrincipalName = `${mailNickname}_${Date.now()}@${defaultDomain}`;

        // Create user with email-based local account
        const user = (await this.graphClient!.api("/users").post({
          accountEnabled: true,
          displayName: `${userData.firstName} ${userData.lastName}`,
          givenName: userData.firstName,
          surname: userData.lastName,
          mobilePhone: userData.phone,
          mailNickname: mailNickname,
          userPrincipalName: userPrincipalName, // Use tenant domain for UPN
          passwordProfile: {
            forceChangePasswordNextSignIn: false,
            password: temporaryPassword,
          },
          identities: [
            {
              signInType: "emailAddress",
              issuer: defaultDomain,
              issuerAssignedId: userData.email, // User signs in with their email
            }
          ],
        })) as { id: string };

        this.logger.log(
          `✅ Created external user in Entra External ID: ${userData.email} (ID: ${user.id})`,
        );
        this.logger.log(`   User can sign in with email: ${userData.email}`);

        return {
          entraUserId: user.id,
          temporaryPassword,
        };
      } else {
        // For standard Entra ID, use the old method (create internal users)
        const temporaryPassword = this.generateTemporaryPassword();
        const defaultDomain = this.configService.get<string>("ENTRA_DEFAULT_DOMAIN");

        if (!defaultDomain) {
          throw new Error(
            "ENTRA_DEFAULT_DOMAIN not configured. Please set it to your verified domain (e.g., yourtenant.onmicrosoft.com)",
          );
        }

        const mailNickname = userData.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
        const userPrincipalName = `${mailNickname}@${defaultDomain}`;

        this.logger.log(
          `Creating internal user with UPN: ${userPrincipalName}, mail: ${userData.email}`,
        );

        const user = (await this.graphClient!.api("/users").post({
          accountEnabled: true,
          displayName: `${userData.firstName} ${userData.lastName}`,
          mailNickname: mailNickname,
          userPrincipalName: userPrincipalName,
          mail: userData.email,
          givenName: userData.firstName,
          surname: userData.lastName,
          mobilePhone: userData.phone,
          passwordProfile: {
            forceChangePasswordNextSignIn: false,
            password: temporaryPassword,
          },
        })) as { id: string };

        this.logger.log(
          `✅ Created internal user: ${userData.email} (ID: ${user.id}, UPN: ${userPrincipalName})`,
        );

        return {
          entraUserId: user.id,
          temporaryPassword,
        };
      }
    } catch (error: any) {
      const errorMessage = (error as Error)?.message || "Unknown error";

      console.error(`❌ Failed to create Entra user ${userData.email}:`, {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        stack: error?.stack,
        errorType: error?.constructor?.name,
        graphClientExists: !!this.graphClient,
        isMockMode: this.isMockMode,
        entraType: this.configService.get<string>("ENTRA_TYPE"),
        tenantId: this.configService.get<string>("ENTRA_TENANT_ID"),
        clientId: this.configService.get<string>("ENTRA_CLIENT_ID"),
        scopes: this.configService.get<string>("ENTRA_SCOPES"),
      });

      this.logger.error(`❌ Failed to create Entra user ${userData.email}: ${errorMessage}`);
      throw new Error(`Entra user creation failed: ${errorMessage}`);
    }
  }

  /**
   * Update user in Microsoft Entra ID
   */
  async updateUser(
    entraUserId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ): Promise<void> {
    if (this.isMockMode) {
      return this.updateMockUser(entraUserId, updates);
    }

    try {
      const payload: Record<string, any> = {};
      if (updates.firstName) payload.givenName = updates.firstName;
      if (updates.lastName) payload.surname = updates.lastName;
      if (updates.phone) payload.mobilePhone = updates.phone;
      if (updates.firstName || updates.lastName) {
        payload.displayName = `${updates.firstName || ""} ${updates.lastName || ""}`.trim();
      }

      await this.graphClient!.api(`/users/${entraUserId}`).patch(payload);

      this.logger.log(`✅ Updated Entra user: ${entraUserId}`);
    } catch (error: any) {
      const errorMessage = (error as Error)?.message || "Unknown error";
      this.logger.error(`❌ Failed to update Entra user ${entraUserId}:`, errorMessage);
      throw new Error(`Entra user update failed: ${errorMessage}`);
    }
  }

  /**
   * Delete user from Microsoft Entra ID
   */
  async deleteUser(entraUserId: string): Promise<void> {
    if (this.isMockMode) {
      return this.deleteMockUser(entraUserId);
    }

    try {
      await this.graphClient!.api(`/users/${entraUserId}`).delete();
      this.logger.log(`✅ Deleted Entra user: ${entraUserId}`);
    } catch (error: any) {
      const errorMessage = (error as Error)?.message || "Unknown error";
      this.logger.error(`❌ Failed to delete Entra user ${entraUserId}:`, errorMessage);
      throw new Error(`Entra user deletion failed: ${errorMessage}`);
    }
  }

  /**
   * Generate a secure temporary password for new users
   * This is ONLY used when creating users via admin panel
   */
  private generateTemporaryPassword(): string {
    const length = 16;
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    const all = uppercase + lowercase + numbers + special;

    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = 4; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  // ============================================================================
  // MOCK MODE METHODS (for local development)
  // ============================================================================

  private createMockUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ entraUserId: string; temporaryPassword: string }> {
    const entraUserId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const temporaryPassword = this.generateTemporaryPassword();

    this.mockUsers.set(entraUserId, {
      id: entraUserId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
    });

    this.logger.log(
      `🧪 [MOCK] Created user: ${userData.email} (ID: ${entraUserId}) with temporary password: ${temporaryPassword}`,
    );

    return Promise.resolve({ entraUserId, temporaryPassword });
  }

  private updateMockUser(
    entraUserId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ): void {
    const user = this.mockUsers.get(entraUserId);
    if (!user) {
      throw new Error(`Mock user not found: ${entraUserId}`);
    }

    if (updates.firstName) user.firstName = updates.firstName;
    if (updates.lastName) user.lastName = updates.lastName;
    if (updates.phone) user.phone = updates.phone;

    this.mockUsers.set(entraUserId, user);
    this.logger.log(`🧪 [MOCK] Updated user: ${entraUserId}`);
  }

  private deleteMockUser(entraUserId: string): void {
    if (!this.mockUsers.has(entraUserId)) {
      throw new Error(`Mock user not found: ${entraUserId}`);
    }

    this.mockUsers.delete(entraUserId);
    this.logger.log(`🧪 [MOCK] Deleted user: ${entraUserId}`);
  }
}
