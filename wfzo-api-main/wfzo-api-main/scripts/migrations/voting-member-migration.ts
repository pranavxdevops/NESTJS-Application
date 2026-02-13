import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { BaseMigration } from "./base-migration";

/**
 * Excel row structure for WorldFZO Membership Application Form (Voting)
 */
interface VotingMemberExcelRow {
  WorldFZOMembershipApplicationFo_Id?: string;
  FullLegalNameOfTheOrganization?: string;
  TypeOfTheOrganization?: string;
  PrimaryContactFirstLast?: string;
  PrimaryContactEmailWorkEmailOnly?: string;
  Position?: string;
  Telephone?: string;
  Mobile?: string;
  Website?: string;
  Address_Line1?: string;
  Address_City?: string;
  Address_State?: string;
  Address_Country?: string;
  Address_CountryCode?: string;
  MembershipLevel?: string;
  IGiveWorldFzoApprovalToUseTheFollowingInformationToGainExposureOnWorldFZOWebsitesPublications?: string;
  Section_SecondaryContactDetails_SecondaryContactName?: string;
  Section_SecondaryContactDetails_SecondaryContactEmailWorkEmailOnly?: string;
  Section_SecondaryContactDetails_Position?: string;
  Section_SecondaryContactDetails_Telephone?: string;
  Section_CompanyName?: string;
  Section_CorporateVideoLink?: string;
  Section_WhyHaveYouChosenToJoinWorldFZOOrWriteATestimonyAboutTheBenefitsYouveRealisedFromBeingAMemberOfWorldFZO?: string;
  Section_WriteABriefDescriptionAboutYourCompanyCompanyProfile?: string;
  Section_IWouldLikeToReceiveWorldFZOWeeklyNewsletterByEmail?: string;
  Section_Email1?: string;
  Section_Email2?: string;
  Section_Email3?: string;
  WeWantToKnowMoreAboutYourFreeZone_ContactOfTheFocalPointsForMarketing?: string;
  WeWantToKnowMoreAboutYourFreeZone_EmailForMarketingFocalPoint?: string;
  WeWantToKnowMoreAboutYourFreeZone_ContactOfTheFocalPointsForInvestors?: string;
  WeWantToKnowMoreAboutYourFreeZone_EmailForInvestorFocalPoint?: string;
  WeWantToKnowMoreAboutYourFreeZone_TotalSizeOfFreeZoneSurfaceArea?: string;
  WeWantToKnowMoreAboutYourFreeZone_WhenWasYourFreeZoneFounded?: string | number;
  WeWantToKnowMoreAboutYourFreeZone_HowManyCompaniesOperateInYourFreeZone?: string | number;
  WeWantToKnowMoreAboutYourFreeZone_HowManyEmployeesDoYouHaveInYourFreeZone?: string | number;
  WeWantToKnowMoreAboutYourFreeZone_WhatIsTheNumberOfJobsCreatedByYourFreeZoneThroughYourTenants?:
    | string
    | number;
  WeWantToKnowMoreAboutYourFreeZone_WhatAreTheBenefitsOffersByYourFreeZoneInTermsOfServices?: string;
  WeWantToKnowMoreAboutYourFreeZone_WhichAreTheMainActivitySectorsRepresentedInYourFreeZone?: string;
  WeWantToKnowMoreAboutYourFreeZone_WhatAreTheBenefitsOffersByYourFZInTermsOfIncentivesTax?: string;
  WeWantToKnowMoreAboutYourNeeds_DoYouHaveAnyConsultingNeeds?: string;
  WeWantToKnowMoreAboutYourNeeds_InWhichAreaTheExpertsOfTheWorldFZOCanAssistYouToImproveYourFreeZone?: string;
  WeWantToKnowMoreAboutYourNeeds_DoYouHaveAnyTrainingNeedsAreYouInterestedToDevelopTheCapacityBuildingOfYourFZStaff?: string;
  WeWantToKnowMoreAboutYourNeeds_WhichAreTheAreasYouLikeToHaveTraining?: string;
  WeWantToKnowMoreAboutYourNeeds_DoYouWantToAttendOurFreeZoneglobalOrRegionalConferencesSeminarsWebinars?: string;
  WeWantToKnowMoreAboutYourNeeds_DoYouWantThemToBeCustomizedForYourSpecificNeeds?: string;
  WeWantToKnowMoreAboutYourNeeds_DoYouWantToBecomeAGlobalSafeGreenOrSmartZoneRecognizedFreeZoneAndStartTheProcessToBecomeOne?: string;
  TermsAndConditions?: string;
  SignatoryName?: string;
  SignatoryPosition?: string;
  ApplicationDate?: string;
  Signature?: string;
  Entry_Status?: string;
  Entry_DateCreated?: string;
  Entry_DateSubmitted?: string;
  Entry_DateUpdated?: string;
}

interface ParsedUser {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  designation?: string;
  userType?: string;
  newsLetterSubscription?: boolean;
  marketingFocalPoint?: boolean;
  investorFocalPoint?: boolean;
  correspondanceUser?: boolean;
}

interface ParsedMember {
  companyName: string;
  websiteUrl?: string;
  memberVideoUrl?: string;
  typeOfTheOrganization?: string;
  category: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    latitude?: number;
    longitude?: number;
  };
  organisationQuestionnaire: {
    companyProfileDescription?: string;
    whyJoinWorldFZO?: string;
    fzTotalSize?: string;
    fzFoundedYear?: number;
    fzNumberOfCompanies?: number;
    fzNumberOfEmployees?: number;
    fzJobsCreated?: number;
    fzServicesBenefits?: string;
    fzMainActivitySectors?: string;
    fzTaxIncentives?: string;
    needsConsulting?: boolean;
    needsConsultingAreas?: string;
    needsTraining?: boolean;
    needsTrainingAreas?: string;
    attendConferences?: boolean;
    customizedEvents?: boolean;
    recognizedFreeZone?: boolean;
  };
  memberConsent: {
    articleOfAssociationConsent: boolean;
    memberShipFeeConsent: boolean;
    approvalForExposure?: boolean;
    termsAndConditions?: boolean;
  };
  signatoryName?: string;
  signatoryPosition?: string;
  signature?: string;
  users: ParsedUser[];
  newsletterEmails: string[];
}

/**
 * Migration for WorldFZO Membership Application Form (Voting Members)
 */
export class VotingMemberMigration extends BaseMigration<VotingMemberExcelRow> {
  private skippedEntries: any[] = [];

  async parseExcelData(rows: VotingMemberExcelRow[]): Promise<ParsedMember[]> {
    const grouped = this.groupByCompany(rows);
    const members: ParsedMember[] = [];

    console.log(`\n📦 Grouped into ${grouped.size} companies`);

    for (const [companyName, companyRows] of grouped.entries()) {
      const firstRow = companyRows[0];
      const primaryEmail = this.normalizeEmail(
        firstRow.PrimaryContactEmailWorkEmailOnly || "",
      );

      // Check if member already exists
      if (await this.memberExists(companyName, primaryEmail)) {
        console.log(`⏭️  Skipping existing member: ${companyName}`);
        this.skippedEntries.push(firstRow);
        this.stats.membersSkipped++;
        continue;
      }

      const userMap = new Map<string, ParsedUser>();

      // Parse primary contact
      if (firstRow.PrimaryContactEmailWorkEmailOnly) {
        const email = this.normalizeEmail(firstRow.PrimaryContactEmailWorkEmailOnly);
        const { firstName, lastName } = this.splitName(
          firstRow.PrimaryContactFirstLast || "",
        );
        userMap.set(email, {
          firstName,
          lastName,
          email,
          contactNumber: firstRow.Telephone || firstRow.Mobile,
          designation: firstRow.Position,
          userType: "Primary",
          newsLetterSubscription: this.parseBoolean(
            firstRow.Section_IWouldLikeToReceiveWorldFZOWeeklyNewsletterByEmail,
          ),
          marketingFocalPoint: false,
          investorFocalPoint: false,
          correspondanceUser: false,
        });
      }

      // Parse secondary contact
      if (firstRow.Section_SecondaryContactDetails_SecondaryContactEmailWorkEmailOnly) {
        const email = this.normalizeEmail(
          firstRow.Section_SecondaryContactDetails_SecondaryContactEmailWorkEmailOnly,
        );
        const existingUser = userMap.get(email);
        if (existingUser) {
          existingUser.correspondanceUser = true;
        } else {
          const { firstName, lastName } = this.splitName(
            firstRow.Section_SecondaryContactDetails_SecondaryContactName || "",
          );
          userMap.set(email, {
            firstName,
            lastName,
            email,
            contactNumber: firstRow.Section_SecondaryContactDetails_Telephone,
            designation: firstRow.Section_SecondaryContactDetails_Position,
            userType: "Secondry",
            newsLetterSubscription: false,
            marketingFocalPoint: false,
            investorFocalPoint: false,
            correspondanceUser: true,
          });
        }
      } else {
        // No secondary - primary is correspondence user
        const primaryEmail = this.normalizeEmail(
          firstRow.PrimaryContactEmailWorkEmailOnly || "",
        );
        const primaryUser = userMap.get(primaryEmail);
        if (primaryUser) {
          primaryUser.correspondanceUser = true;
        }
      }

      // Parse marketing focal point
      if (firstRow.WeWantToKnowMoreAboutYourFreeZone_EmailForMarketingFocalPoint) {
        const email = this.normalizeEmail(
          firstRow.WeWantToKnowMoreAboutYourFreeZone_EmailForMarketingFocalPoint,
        );
        const existingUser = userMap.get(email);
        if (existingUser) {
          existingUser.marketingFocalPoint = true;
        } else {
          const { firstName, lastName } = this.splitName(
            firstRow.WeWantToKnowMoreAboutYourFreeZone_ContactOfTheFocalPointsForMarketing ||
              "",
          );
          userMap.set(email, {
            firstName,
            lastName,
            email,
            contactNumber: "",
            designation: "Marketing Focal Point",
            userType: "Secondry",
            newsLetterSubscription: false,
            marketingFocalPoint: true,
            investorFocalPoint: false,
          });
        }
      }

      // Parse investor focal point
      if (firstRow.WeWantToKnowMoreAboutYourFreeZone_EmailForInvestorFocalPoint) {
        const email = this.normalizeEmail(
          firstRow.WeWantToKnowMoreAboutYourFreeZone_EmailForInvestorFocalPoint,
        );
        const existingUser = userMap.get(email);
        if (existingUser) {
          existingUser.investorFocalPoint = true;
        } else {
          const { firstName, lastName } = this.splitName(
            firstRow.WeWantToKnowMoreAboutYourFreeZone_ContactOfTheFocalPointsForInvestors ||
              "",
          );
          userMap.set(email, {
            firstName,
            lastName,
            email,
            contactNumber: "",
            designation: "Investor Relations Focal Point",
            userType: "Secondry",
            newsLetterSubscription: false,
            marketingFocalPoint: false,
            investorFocalPoint: true,
          });
        }
      }

      const users = Array.from(userMap.values());

      if (users.length === 0) {
        console.warn(`⚠️  Skipping company ${companyName} - no valid users found`);
        continue;
      }

      // Collect newsletter emails
      const newsletterEmails: string[] = [];
      if (firstRow.Section_Email1)
        newsletterEmails.push(this.normalizeEmail(firstRow.Section_Email1));
      if (firstRow.Section_Email2)
        newsletterEmails.push(this.normalizeEmail(firstRow.Section_Email2));
      if (firstRow.Section_Email3)
        newsletterEmails.push(this.normalizeEmail(firstRow.Section_Email3));

      // Build address
      let address;
      if (firstRow.Address_Country && firstRow.Address_City) {
        address = {
          line1: firstRow.Address_Line1 || companyName,
          city: firstRow.Address_City,
          state: firstRow.Address_State || "",
          country: firstRow.Address_Country,
          zip: "",
        };
      }

      members.push({
        companyName,
        websiteUrl: firstRow.Website,
        memberVideoUrl: firstRow.Section_CorporateVideoLink,
        typeOfTheOrganization: firstRow.TypeOfTheOrganization,
        category: this.parseMembershipCategory(firstRow.MembershipLevel),
        address,
        organisationQuestionnaire: {
          companyProfileDescription:
            firstRow.Section_WriteABriefDescriptionAboutYourCompanyCompanyProfile,
          whyJoinWorldFZO:
            firstRow.Section_WhyHaveYouChosenToJoinWorldFZOOrWriteATestimonyAboutTheBenefitsYouveRealisedFromBeingAMemberOfWorldFZO,
          fzTotalSize:
            firstRow.WeWantToKnowMoreAboutYourFreeZone_TotalSizeOfFreeZoneSurfaceArea,
          fzFoundedYear: this.parseNumber(
            firstRow.WeWantToKnowMoreAboutYourFreeZone_WhenWasYourFreeZoneFounded,
          ),
          fzNumberOfCompanies: this.parseNumber(
            firstRow.WeWantToKnowMoreAboutYourFreeZone_HowManyCompaniesOperateInYourFreeZone,
          ),
          fzNumberOfEmployees: this.parseNumber(
            firstRow.WeWantToKnowMoreAboutYourFreeZone_HowManyEmployeesDoYouHaveInYourFreeZone,
          ),
          fzJobsCreated: this.parseNumber(
            firstRow.WeWantToKnowMoreAboutYourFreeZone_WhatIsTheNumberOfJobsCreatedByYourFreeZoneThroughYourTenants,
          ),
          fzServicesBenefits:
            firstRow.WeWantToKnowMoreAboutYourFreeZone_WhatAreTheBenefitsOffersByYourFreeZoneInTermsOfServices,
          fzMainActivitySectors:
            firstRow.WeWantToKnowMoreAboutYourFreeZone_WhichAreTheMainActivitySectorsRepresentedInYourFreeZone,
          fzTaxIncentives:
            firstRow.WeWantToKnowMoreAboutYourFreeZone_WhatAreTheBenefitsOffersByYourFZInTermsOfIncentivesTax,
          needsConsulting: this.parseBoolean(
            firstRow.WeWantToKnowMoreAboutYourNeeds_DoYouHaveAnyConsultingNeeds,
          ),
          needsConsultingAreas:
            firstRow.WeWantToKnowMoreAboutYourNeeds_InWhichAreaTheExpertsOfTheWorldFZOCanAssistYouToImproveYourFreeZone,
          needsTraining: this.parseBoolean(
            firstRow.WeWantToKnowMoreAboutYourNeeds_DoYouHaveAnyTrainingNeedsAreYouInterestedToDevelopTheCapacityBuildingOfYourFZStaff,
          ),
          needsTrainingAreas:
            firstRow.WeWantToKnowMoreAboutYourNeeds_WhichAreTheAreasYouLikeToHaveTraining,
          attendConferences: this.parseBoolean(
            firstRow.WeWantToKnowMoreAboutYourNeeds_DoYouWantToAttendOurFreeZoneglobalOrRegionalConferencesSeminarsWebinars,
          ),
          customizedEvents: this.parseBoolean(
            firstRow.WeWantToKnowMoreAboutYourNeeds_DoYouWantThemToBeCustomizedForYourSpecificNeeds,
          ),
          recognizedFreeZone: this.parseBoolean(
            firstRow.WeWantToKnowMoreAboutYourNeeds_DoYouWantToBecomeAGlobalSafeGreenOrSmartZoneRecognizedFreeZoneAndStartTheProcessToBecomeOne,
          ),
        },
        memberConsent: {
          articleOfAssociationConsent: true,
          memberShipFeeConsent: true,
          approvalForExposure: this.parseBoolean(
            firstRow.IGiveWorldFzoApprovalToUseTheFollowingInformationToGainExposureOnWorldFZOWebsitesPublications,
          ),
          termsAndConditions: this.parseBoolean(firstRow.TermsAndConditions),
        },
        signatoryName: firstRow.SignatoryName,
        signatoryPosition: firstRow.SignatoryPosition,
        signature: firstRow.Signature,
        users,
        newsletterEmails,
      });
    }

    return members;
  }

  async migrate(): Promise<void> {
    console.log(`\n🚀 Starting Voting Member Migration...`);

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
              userType: userData.userType || "Primary",
              isMember: true,
              newsLetterSubscription: userData.newsLetterSubscription || false,
              firstName: userData.firstName,
              lastName: userData.lastName,
              designation: userData.designation,
              contactNumber: userData.contactNumber,
              status: "active",
              correspondanceUser: userData.correspondanceUser || false,
              marketingFocalPoint: userData.marketingFocalPoint || false,
              investorFocalPoint: userData.investorFocalPoint || false,
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
              userType: userData.userType || "Primary",
              correspondanceUser: userData.correspondanceUser || false,
              marketingFocalPoint: userData.marketingFocalPoint || false,
              investorFocalPoint: userData.investorFocalPoint || false,
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

        // Map industries
        const industries = this.matchIndustries(
          memberData.organisationQuestionnaire.fzMainActivitySectors,
        );

        // Match organization type
        const typeOfTheOrganization = this.matchOrganizationType(
          memberData.typeOfTheOrganization,
        );

        // Create member document
        const memberObjectId = new Types.ObjectId();
        const memberDoc = {
          _id: memberObjectId,
          memberId,
          applicationNumber: appNumber,
          userSnapshots,
          category: memberData.category,
          tier: "basic",
          status: "active",
          organisationInfo: {
            companyName: memberData.companyName,
            websiteUrl: memberData.websiteUrl || "",
            typeOfTheOrganization,
            memberVideoUrl: memberData.memberVideoUrl,
            industries: industries.length > 0 ? industries : undefined,
            address: memberData.address,
            organisationQuestionnaire: memberData.organisationQuestionnaire,
            signatoryName: memberData.signatoryName,
            signatoryPosition: memberData.signatoryPosition,
            signature: memberData.signature,
            memberLicenceUrl: "",
            memberLogoUrl: "",
          },
          memberConsent: {
            authorizedPersonDeclaration:
              memberData.memberConsent.articleOfAssociationConsent ?? true,
            articleOfAssociationConsent:
              memberData.memberConsent.articleOfAssociationConsent ?? true,
            articleOfAssociationCriteriaConsent:
              memberData.memberConsent.memberShipFeeConsent ?? true,
            memberShipFeeConsent: memberData.memberConsent.memberShipFeeConsent ?? true,
            approvalForExposure: memberData.memberConsent.approvalForExposure,
            termsAndConditions: memberData.memberConsent.termsAndConditions,
          },
          featuredMember: false,
          approvalHistory: [],
          rejectionHistory: [],
          paymentStatus: "",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.connection.collection("members").insertOne(memberDoc);
        this.stats.membersCreated++;

        console.log(
          `✅ Created member: ${memberData.companyName} (${userSnapshots.length} users)`,
        );
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
        "skipped-voting-members.xlsx",
      );
    }

    this.printSummary();
  }

  private groupByCompany(
    rows: VotingMemberExcelRow[],
  ): Map<string, VotingMemberExcelRow[]> {
    const grouped = new Map<string, VotingMemberExcelRow[]>();

    for (const row of rows) {
      const companyName =
        row.Section_CompanyName?.trim() || row.FullLegalNameOfTheOrganization?.trim();
      if (!companyName) {
        console.warn(`⚠️  Skipping row without company name:`, row);
        continue;
      }

      if (!grouped.has(companyName)) {
        grouped.set(companyName, []);
      }
      grouped.get(companyName)!.push(row);
    }

    return grouped;
  }

  private parseMembershipCategory(category?: string): string {
    const categoryMap: Record<string, string> = {
      voting: "votingMember",
      associate: "associateMember",
      "partner and observer": "partnerAndObserver",
      partnerandobserver: "partnerAndObserver",
      zone: "zoneMember",
      freezoneassociation: "freeZoneAssociation",
      corporatemembers: "corporateMembers",
      professionalmembers: "professionalMembers",
      strategicmembers: "strategicMembers",
    };

    const normalized = category?.toLowerCase().trim() || "";
    return categoryMap[normalized] || "votingMember";
  }
}
