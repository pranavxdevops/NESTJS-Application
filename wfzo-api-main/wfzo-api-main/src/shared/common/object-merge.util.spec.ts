import { createDeepMergeUpdate, deepMergeObjects } from "./object-merge.util";

describe("createDeepMergeUpdate", () => {
  it("should skip undefined values and create dot notation for nested fields", () => {
    const dto = {
      organisationInfo: {
        companyName: undefined,
        address: {
          city: "Delhi",
          state: undefined,
        },
      },
    };

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({
      "organisationInfo.address.city": "Delhi",
    });
    expect(result["organisationInfo.companyName"]).toBeUndefined();
  });

  it("should handle top-level fields", () => {
    const dto = {
      phase: undefined,
      status: "active",
      description: undefined,
    };

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({
      status: "active",
    });
  });

  it("should handle arrays", () => {
    const dto = {
      organisationInfo: {
        industries: ["Tech", "Finance"],
        companyName: undefined,
      },
    };

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({
      "organisationInfo.industries": ["Tech", "Finance"],
    });
  });

  it("should handle empty objects", () => {
    const dto = {};

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({});
  });

  it("should handle deeply nested objects", () => {
    const dto = {
      organisationInfo: {
        address: {
          coordinates: {
            latitude: 28.7041,
            longitude: undefined,
          },
        },
      },
    };

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({
      "organisationInfo.address.coordinates.latitude": 28.7041,
    });
  });

  it("should ignore null values", () => {
    const dto = {
      organisationInfo: {
        companyName: null,
        websiteUrl: "acme.com",
      },
    };

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({
      "organisationInfo.websiteUrl": "acme.com",
    });
  });

  it("should preserve empty strings", () => {
    const dto = {
      organisationInfo: {
        companyName: "",
        websiteUrl: undefined,
      },
    };

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({
      "organisationInfo.companyName": "",
    });
  });

  it("should preserve zero and false values", () => {
    const dto = {
      organisationInfo: {
        yearsInBusiness: 0,
        isFeatured: false,
        companyName: undefined,
      },
    };

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({
      "organisationInfo.yearsInBusiness": 0,
      "organisationInfo.isFeatured": false,
    });
  });

  it("should handle dates", () => {
    const date = new Date("2023-01-01");
    const dto = {
      organisationInfo: {
        foundedDate: date,
        companyName: undefined,
      },
    };

    const result = createDeepMergeUpdate(dto);

    expect(result).toEqual({
      "organisationInfo.foundedDate": date,
    });
  });
});

describe("deepMergeObjects", () => {
  it("should merge two objects preserving existing fields", () => {
    const existing = {
      companyName: "Acme Corp",
      websiteUrl: "acme.com",
      linkedInUrl: "linkedin.com/acme",
    };

    const partial = {
      companyName: undefined,
      websiteUrl: "newacme.com",
    };

    const result = deepMergeObjects(existing, partial);

    expect(result).toEqual({
      companyName: "Acme Corp", // Preserved
      websiteUrl: "newacme.com", // Updated
      linkedInUrl: "linkedin.com/acme", // Preserved
    });
  });

  it("should recursively merge nested objects", () => {
    const existing = {
      organisationInfo: {
        companyName: "Acme",
        address: {
          city: "NYC",
          state: "NY",
          zip: "10001",
        },
      },
    };

    const partial = {
      organisationInfo: {
        companyName: undefined,
        address: {
          city: "Delhi",
          state: undefined,
        },
      },
    };

    const result = deepMergeObjects(existing, partial);

    expect(result).toEqual({
      organisationInfo: {
        companyName: "Acme", // Preserved
        address: {
          city: "Delhi", // Updated
          state: "NY", // Preserved
          zip: "10001", // Preserved
        },
      },
    });
  });

  it("should handle array replacement (not deep merge)", () => {
    const existing = {
      industries: ["Tech", "Finance"],
    };

    const partial = {
      industries: ["Healthcare"],
    };

    const result = deepMergeObjects(existing, partial);

    expect(result).toEqual({
      industries: ["Healthcare"], // Completely replaced
    });
  });

  it("should handle empty partial (undefined)", () => {
    const existing = {
      companyName: "Acme",
      websiteUrl: "acme.com",
    };

    const result = deepMergeObjects(existing, undefined);

    expect(result).toEqual(existing);
  });

  it("should handle null partial", () => {
    const existing = {
      companyName: "Acme",
    };

    const result = deepMergeObjects(existing, null);

    expect(result).toEqual(existing);
  });

  it("should preserve empty strings", () => {
    const existing = {
      companyName: "Acme",
      websiteUrl: "acme.com",
    };

    const partial = {
      websiteUrl: "",
    };

    const result = deepMergeObjects(existing, partial);

    expect(result).toEqual({
      companyName: "Acme",
      websiteUrl: "", // Set to empty
    });
  });

  it("should preserve zero and false values", () => {
    const existing = {
      yearsInBusiness: 10,
      isFeatured: true,
    };

    const partial = {
      yearsInBusiness: 0,
      isFeatured: false,
    };

    const result = deepMergeObjects(existing, partial);

    expect(result).toEqual({
      yearsInBusiness: 0,
      isFeatured: false,
    });
  });

  it("should handle Phase 2 member update scenario", () => {
    const existingMember = {
      memberId: "MEMBER-001",
      organisationInfo: {
        companyName: "TechCorp",
        websiteUrl: "techcorp.com",
        linkedInUrl: "linkedin.com/techcorp",
        industries: ["Tech", "Finance"],
        address: {
          line1: "123 Main St",
          city: "NYC",
          state: "NY",
          country: "USA",
        },
      },
      memberConsent: {
        articleOfAssociationConsent: false,
        memberShipFeeConsent: false,
      },
    };

    const phase2Update = {
      organisationInfo: {
        companyName: undefined,
        websiteUrl: undefined,
        linkedInUrl: undefined,
        industries: undefined,
        address: {
          line1: "456 Park Ave",
          city: "Delhi",
          state: "Delhi",
        },
      },
      memberConsent: {
        articleOfAssociationConsent: true,
      },
    };

    const result = deepMergeObjects(existingMember, phase2Update) as typeof existingMember;

    // All original fields should be preserved
    expect((result.organisationInfo as Record<string, unknown>).companyName).toBe("TechCorp");
    expect((result.organisationInfo as Record<string, unknown>).websiteUrl).toBe("techcorp.com");
    expect((result.organisationInfo as Record<string, unknown>).linkedInUrl).toBe(
      "linkedin.com/techcorp",
    );
    expect((result.organisationInfo as Record<string, unknown>).industries).toEqual([
      "Tech",
      "Finance",
    ]);

    // Address should be updated with new values
    const address = (result.organisationInfo as Record<string, unknown>).address as Record<
      string,
      unknown
    >;
    expect(address.line1).toBe("456 Park Ave");
    expect(address.city).toBe("Delhi");
    expect(address.state).toBe("Delhi");
    expect(address.country).toBe("USA"); // Preserved

    // Consent should be partially updated
    const consent = result.memberConsent as Record<string, unknown>;
    expect(consent.articleOfAssociationConsent).toBe(true);
    expect(consent.memberShipFeeConsent).toBe(false); // Preserved
  });
});
