import { Types } from "mongoose";
import { BaseMigration } from "./base-migration";

/**
 * Excel row structure for Membership Database 2025
 */
interface MembershipDatabase2025Row {
  "                                                                                                  "?: string; // Member ID column
  "MEMBERSHIP TYPE"?: string;
  "ORGANIZATION NAME"?: string;
  "ORGANIZATION  TYPE"?: string; // Note: double space in column name
  WEBSITE?: string;
  "Application dt"?: number;
  "MEMBERSHIP APPROVAL LETTER DATE"?: number;
  YOE?: number; // Year of Establishment
  "MEMBERSHIP STATUS"?: string;
  "ADDRESS 1"?: string;
  CITY?: string;
  "POSTAL CODE"?: string | number;
  COUNTRY?: string;
  CONTINENT?: string;
  TITLE?: string;
  FIRSTNAME?: string;
  "LAST NAME"?: string;
  "FULL NAME"?: string;
  POSITION?: string;
  PHONE1?: string;
  PHONE2?: string;
  "PRIMARY EMAIL ID"?: string;
  TITLE2?: string;
  "FIRST NAME2"?: string;
  "LAST NAME2"?: string;
  "FULL NAME2"?: string;
  POSITION2?: string;
  "SECONDARY EMAIL ID 2.1"?: string;
  "Marketing Email"?: string;
  "USER ID"?: string;
  PASSWORD?: string;
  "How do they know about WorldFZO"?: string;
  "How do they know about WorldFZO (break down)"?: string;
  "PAYMENT STATUS"?: string;
}

interface ParsedUser {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  designation?: string;
  userType: string;
  newsLetterSubscription?: boolean;
  correspondanceUser?: boolean;
}

interface ParsedMember {
  legacyMemberId?: string;
  companyName: string;
  websiteUrl?: string;
  typeOfTheOrganization?: string;
  category: string;
  membershipStatus: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    country: string;
    countryCode?: string;
    zip: string;
    latitude?: number;
    longitude?: number;
  };
  applicationDate?: Date;
  approvalLetterDate?: Date;
  yearOfEstablishment?: number;
  paymentStatus?: string;
  users: ParsedUser[];
  marketingEmails: string[];
}

/**
 * Migration for Membership Database 2025
 * Handles bulk import of existing members from the 2025 database
 */
export class MembershipDatabase2025Migration extends BaseMigration<MembershipDatabase2025Row> {
  private skippedEntries: any[] = [];

  async parseExcelData(rows: MembershipDatabase2025Row[]): Promise<ParsedMember[]> {
    const members: ParsedMember[] = [];

    console.log(`\n📦 Processing ${rows.length} entries from 2025 database`);

    for (const row of rows) {
      const companyName = row["ORGANIZATION NAME"]?.trim();
      const primaryEmail = this.normalizeEmail(row["PRIMARY EMAIL ID"] || "");
      const membershipType = row["MEMBERSHIP TYPE"]?.trim();

      if (!companyName) {
        console.warn(`⚠️  Skipping row without organization name`);
        continue;
      }

      // Skip entries with "Cancel" membership type
      if (membershipType?.toLowerCase() === "cancel") {
        console.log(`⏭️  Skipping cancelled membership: ${companyName}`);
        this.skippedEntries.push(row);
        this.stats.membersSkipped++;
        continue;
      }

      // Check if member already exists
      if (await this.memberExists(companyName, primaryEmail)) {
        console.log(`⏭️  Skipping existing member: ${companyName}`);
        this.skippedEntries.push(row);
        this.stats.membersSkipped++;
        continue;
      }

      const users: ParsedUser[] = [];

      // Parse primary contact
      if (primaryEmail) {
        let firstName = row["FIRSTNAME"]?.trim();
        let lastName = row["LAST NAME"]?.trim();

        // If no first/last name, try to extract from FULL NAME
        if ((!firstName || !lastName) && row["FULL NAME"]) {
          const fullName = row["FULL NAME"].trim();
          const nameParts = this.splitName(fullName);
          firstName = firstName || nameParts.firstName || "Contact";
          lastName = lastName || nameParts.lastName || fullName;
        }

        // If still no name, use email prefix
        if (!firstName || !lastName) {
          const emailPrefix = primaryEmail.split("@")[0];
          firstName = firstName || emailPrefix;
          lastName = lastName || companyName;
        }

        users.push({
          firstName,
          lastName,
          email: primaryEmail,
          contactNumber: row["PHONE1"] || row["PHONE2"],
          designation: row["POSITION"],
          userType: "Primary",
          newsLetterSubscription: false,
          correspondanceUser: false, // Will be set based on secondary contact existence
        });
      }

      // Parse secondary contact
      const secondaryEmail = this.normalizeEmail(row["SECONDARY EMAIL ID 2.1"] || "");
      if (secondaryEmail) {
        // Check if secondary email is same as primary
        if (secondaryEmail === primaryEmail) {
          // Same person - just mark primary as correspondence user
          if (users.length > 0) {
            users[0].correspondanceUser = true;
          }
        } else {
          let firstName2 = row["FIRST NAME2"]?.trim();
          let lastName2 = row["LAST NAME2"]?.trim();

          // If no first/last name, try to extract from FULL NAME2
          if ((!firstName2 || !lastName2) && row["FULL NAME2"]) {
            const fullName2 = row["FULL NAME2"].trim();
            const nameParts = this.splitName(fullName2);
            firstName2 = firstName2 || nameParts.firstName || "Contact";
            lastName2 = lastName2 || nameParts.lastName || fullName2;
          }

          // If still no name, use email prefix
          if (!firstName2 || !lastName2) {
            const emailPrefix = secondaryEmail.split("@")[0];
            firstName2 = firstName2 || emailPrefix;
            lastName2 = lastName2 || companyName;
          }

          // Different person - create secondary user as correspondence user
          users.push({
            firstName: firstName2,
            lastName: lastName2,
            email: secondaryEmail,
            contactNumber: "", // No phone for secondary in this format
            designation: row["POSITION2"],
            userType: "Secondry",
            newsLetterSubscription: false,
            correspondanceUser: true,
          });
        }
      } else {
        // No secondary contact - primary is correspondence user
        if (users.length > 0) {
          users[0].correspondanceUser = true;
        }
      }

      if (users.length === 0) {
        console.warn(`⚠️  Skipping ${companyName} - no valid users found`);
        continue;
      }

      // Collect marketing emails
      const marketingEmails: string[] = [];
      const marketingEmail = this.normalizeEmail(row["Marketing Email"] || "");
      if (marketingEmail) {
        marketingEmails.push(marketingEmail);
      }

      // Build address
      let address;
      if (row["COUNTRY"] && row["CITY"]) {
        const countryName = this.standardizeCountryName(row["COUNTRY"]);
        const countryCode = this.getCountryCode(countryName);
        
        address = {
          line1: row["ADDRESS 1"] || companyName,
          city: row["CITY"].trim(),
          state: "",
          country: countryName,
          countryCode: countryCode,
          zip: row["POSTAL CODE"]?.toString() || "",
        };
      }

      // Parse dates (Excel date format)
      const applicationDate = row["Application dt"]
        ? this.excelDateToJSDate(row["Application dt"])
        : undefined;
      const approvalLetterDate = row["MEMBERSHIP APPROVAL LETTER DATE"]
        ? this.excelDateToJSDate(row["MEMBERSHIP APPROVAL LETTER DATE"])
        : undefined;

      // Get legacy member ID from first column
      const legacyMemberId = row[
        "                                                                                                  "
      ]?.trim();

      members.push({
        legacyMemberId,
        companyName,
        websiteUrl: row["WEBSITE"],
        typeOfTheOrganization: row["ORGANIZATION  TYPE"], // Note: double space
        category: this.parseMembershipType(row["MEMBERSHIP TYPE"]),
        membershipStatus: row["MEMBERSHIP STATUS"] || "Active",
        address,
        applicationDate,
        approvalLetterDate,
        yearOfEstablishment: row["YOE"],
        paymentStatus: row["PAYMENT STATUS"],
        users,
        marketingEmails,
      });
    }

    return members;
  }

  async migrate(): Promise<void> {
    console.log(`\n🚀 Starting Membership Database 2025 Migration...`);

    const rows = this.readExcelFile();
    const members = await this.parseExcelData(rows);

    console.log(`\n📝 Migrating ${members.length} members...`);

    for (const memberData of members) {
      try {
        const memberId = await this.getNextMemberId();
        const appNumber = await this.getNextApplicationNumber();

        // Create users
        const userSnapshots = [];

        for (const userData of memberData.users) {
          if (this.globalEmailTracker.has(userData.email)) {
            console.warn(`  ⚠️  Email ${userData.email} already used`);
            continue;
          }

          try {
            const userId = new Types.ObjectId();

            const userDoc = {
              _id: userId,
              username: userData.email,
              email: userData.email,
              memberId,
              userType: userData.userType,
              isMember: true,
              newsLetterSubscription: userData.newsLetterSubscription || false,
              firstName: userData.firstName,
              lastName: userData.lastName,
              designation: userData.designation,
              contactNumber: userData.contactNumber,
              status: "active",
              correspondanceUser: userData.correspondanceUser || false,
              marketingFocalPoint: false,
              investorFocalPoint: false,
              deletedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await this.connection.collection("users").insertOne(userDoc);
            this.globalEmailTracker.add(userData.email);
            this.stats.usersCreated++;

            userSnapshots.push({
              id: userId.toString(),
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              userType: userData.userType,
              correspondanceUser: userData.correspondanceUser || false,
              marketingFocalPoint: false,
              investorFocalPoint: false,
              lastSyncedAt: new Date(),
            });
          } catch (userError: any) {
            if (userError?.code === 11000) {
              console.warn(`  ⚠️  User already exists: ${userData.email}`);
            } else {
              console.error(`  ❌ Error creating user ${userData.email}:`, userError?.message);
              this.stats.errors++;
            }
          }
        }

        if (userSnapshots.length === 0) {
          console.error(`❌ SKIPPING ${memberData.companyName}: No valid users`);
          this.stats.errors++;
          continue;
        }

        // Geocode address
        if (memberData.address) {
          const coords = await this.geocodeAddress(memberData.address);
          memberData.address.latitude = coords.latitude;
          memberData.address.longitude = coords.longitude;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Match organization type
        const typeOfTheOrganization = this.matchOrganizationType(
          memberData.typeOfTheOrganization,
        );

        // Determine status based on membership status
        const status = this.mapMembershipStatus(memberData.membershipStatus);

        // Create member document
        const memberObjectId = new Types.ObjectId();
        const memberDoc = {
          _id: memberObjectId,
          memberId,
          applicationNumber: appNumber,
          legacyMemberId: memberData.legacyMemberId,
          userSnapshots,
          category: memberData.category,
          tier: "basic",
          status,
          organisationInfo: {
            companyName: memberData.companyName,
            websiteUrl: memberData.websiteUrl || "",
            typeOfTheOrganization,
            industries: [], // Will need to be populated manually or via another process
            address: memberData.address,
            yearOfEstablishment: memberData.yearOfEstablishment,
            memberLicenceUrl: "",
            memberLogoUrl: "",
            signatoryName: "",
            signatoryPosition: "",
            signature: "",
          },
          memberConsent: {
            authorizedPersonDeclaration: true,
            articleOfAssociationConsent: true,
            articleOfAssociationCriteriaConsent: true,
            memberShipFeeConsent: true,
          },
          featuredMember: false,
          approvalHistory: this.buildApprovalHistory(memberData.approvalLetterDate),
          rejectionHistory: [],
          paymentStatus: this.mapPaymentStatus(memberData.paymentStatus),
          applicationDate: memberData.applicationDate,
          approvalLetterDate: memberData.approvalLetterDate,
          deletedAt: null,
          createdAt: memberData.applicationDate || new Date(),
          updatedAt: new Date(),
        };

        await this.connection.collection("members").insertOne(memberDoc);
        this.stats.membersCreated++;

        if (this.stats.membersCreated % 50 === 0) {
          console.log(`✅ Progress: ${this.stats.membersCreated} members migrated...`);
        }
      } catch (memberError: any) {
        console.error(
          `❌ Error creating member ${memberData.companyName}:`,
          memberError?.message,
        );
        this.stats.errors++;
      }
    }

    // Write skipped entries
    if (this.skippedEntries.length > 0) {
      this.writeSkippedEntriesToExcel(
        this.skippedEntries,
        "skipped-2025-database.xlsx",
      );
    }

    this.printSummary();
  }

  /**
   * Standardize country names to ensure consistency
   */
  protected standardizeCountryName(country?: string): string {
    if (!country) return "";

    const normalized = country.trim().toLowerCase();

    // Mapping of variations to standard names
    const countryMap: Record<string, string> = {
      // North America variations
      "united states of america": "United States",
      "united states": "United States",
      "usa": "United States",
      "us": "United States",
      
      // Asia variations
      "south korea": "South Korea",
      "korea": "South Korea",
      "united arab emirates": "United Arab Emirates",
      "uae": "United Arab Emirates",
      
      // Africa variations
      "democratic republic of the congo (kinshasa)": "Democratic Republic of the Congo",
      "democratic republic of the congo": "Democratic Republic of the Congo",
      "dr congo": "Democratic Republic of the Congo",
      "congo (kinshasa)": "Democratic Republic of the Congo",
      "drc": "Democratic Republic of the Congo",
      
      // Europe variations
      "uk": "United Kingdom",
      "united kingdom": "United Kingdom",
    };

    // Return mapped standard name or trim original
    return countryMap[normalized] || country.trim();
  }

  /**
   * Get country ISO code from country name
   */
  protected getCountryCode(countryName: string): string {
    if (!countryName) return "";

    // Import country-state-city or use a simple mapping
    const countryCodeMap: Record<string, string> = {
      "United States": "US",
      "United Kingdom": "GB",
      "United Arab Emirates": "AE",
      "South Korea": "KR",
      "Philippines": "PH",
      "Colombia": "CO",
      "India": "IN",
      "China": "CN",
      "Spain": "ES",
      "Nigeria": "NG",
      "Mauritius": "MU",
      "Democratic Republic of the Congo": "CD",
      "Ireland": "IE",
      "Morocco": "MA",
      "Uruguay": "UY",
      "Panama": "PA",
      "Guatemala": "GT",
      "Dominican Republic": "DO",
      "Turkey": "TR",
      "Latvia": "LV",
      "Mozambique": "MZ",
      "Haiti": "HT",
      "Liberia": "LR",
      "Tunisia": "TN",
      "Vietnam": "VN",
      "Brazil": "BR",
      "Puerto Rico": "PR",
      "Malaysia": "MY",
      "Armenia": "AM",
      "Russia": "RU",
      "Kazakhstan": "KZ",
      "Mexico": "MX",
      "Honduras": "HN",
      "Peru": "PE",
      "Costa Rica": "CR",
      "Kenya": "KE",
      "Taiwan": "TW",
      "Mongolia": "MN",
      "Jordan": "JO",
      "Iran": "IR",
    };

    return countryCodeMap[countryName] || "";
  }

  /**
   * Convert Excel date number to JavaScript Date
   */
  private excelDateToJSDate(excelDate: number): Date {
    // Excel date starts from 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 86400000);
    return jsDate;
  }

  /**
   * Parse membership type to category code
   */
  private parseMembershipType(type?: string): string {
    const typeMap: Record<string, string> = {
      voting: "votingMember",
      "p&o": "partnerAndObserver",
      associate: "associateMember",
      "partner and observer": "partnerAndObserver",
      "strategic partner": "strategicPartner",
      corporate: "corporateMembers",
      professional: "professionalMembers",
    };

    const normalized = type?.toLowerCase().trim() || "";
    return typeMap[normalized] || "votingMember";
  }

  /**
   * Map membership status to member status
   */
  private mapMembershipStatus(status?: string): string {
    const statusMap: Record<string, string> = {
      active: "active",
      inactive: "inactive",
      suspended: "suspended",
      pending: "pending",
      rejected: "rejected",
    };

    const normalized = status?.toLowerCase().trim() || "active";
    return statusMap[normalized] || "active";
  }

  /**
   * Map payment status
   */
  private mapPaymentStatus(status?: string): string {
    if (!status) return "";

    const normalized = status.toLowerCase().trim();
    if (normalized.includes("paid")) return "paid";
    if (normalized.includes("pending")) return "pending";
    if (normalized.includes("overdue")) return "overdue";

    return status;
  }

  /**
   * Build approval history from approval letter date
   */
  private buildApprovalHistory(
    approvalDate?: Date,
  ): Array<{
    approvalStage: string;
    order: number;
    approvedBy: string;
    approverEmail: string;
    comments: string;
    approvedAt: Date;
  }> {
    if (!approvalDate) return [];

    const history = [
      {
        approvalStage: "committee",
        order: 1,
        approvedBy: "System Migration",
        approverEmail: "system@worldfzo.org",
        comments: "Migrated from 2025 database",
        approvedAt: approvalDate,
      },
      {
        approvalStage: "board",
        order: 2,
        approvedBy: "System Migration",
        approverEmail: "system@worldfzo.org",
        comments: "Migrated from 2025 database",
        approvedAt: approvalDate,
      },
      {
        approvalStage: "ceo",
        order: 3,
        approvedBy: "System Migration",
        approverEmail: "system@worldfzo.org",
        comments: "Migrated from 2025 database",
        approvedAt: approvalDate,
      },
    ];

    return history;
  }
}
