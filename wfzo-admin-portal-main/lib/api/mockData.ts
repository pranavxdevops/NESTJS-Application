import { Member, PageDataDto } from "@/lib/types/api";

export const mockMembers: Member[] = [
  {
    _id: "mock-member-1",
    memberId: "MEM-001",
    id: "mock-member-1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    membershipType: "Corporate",
    status: "PENDING",
    currentStage: "COMMITTEE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    organisationInfo: {
      name: "Tech Solutions Inc.",
      registrationNumber: "REG-123456",
      taxId: "TAX-789012",
      industry: "Technology",
      website: "https://techsolutions.com",
      address: {
        line1: "123 Tech Street",
        city: "San Francisco",
        state: "CA",
        zip: "94105",
        country: "USA",
      },
    },
    consent: {
      termsAccepted: true,
      dataProcessingConsent: true,
      marketingConsent: true,
    },
  },
  {
    _id: "mock-member-2",
    memberId: "MEM-002",
    id: "mock-member-2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "+1234567891",
    membershipType: "Corporate",
    status: "PENDING",
    currentStage: "BOARD",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    organisationInfo: {
      name: "Global Exports Ltd.",
      registrationNumber: "REG-654321",
      taxId: "TAX-210987",
      industry: "Import/Export",
      website: "https://globalexports.com",
      address: {
        line1: "456 Trade Avenue",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "USA",
      },
    },
    consent: {
      termsAccepted: true,
      dataProcessingConsent: true,
    },
    committeeApproval: {
      stage: "COMMITTEE",
      status: "APPROVED",
      approverName: "Committee User",
      approverEmail: "committee@example.com",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  },
  {
    _id: "mock-member-3",
    memberId: "MEM-003",
    id: "mock-member-3",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@example.com",
    phone: "+1234567892",
    membershipType: "Corporate",
    status: "APPROVED",
    currentStage: "PAYMENT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    organisationInfo: {
      name: "Manufacturing Co.",
      registrationNumber: "REG-111222",
      taxId: "TAX-333444",
      industry: "Manufacturing",
      website: "https://manufacturing.com",
      address: {
        line1: "789 Factory Road",
        city: "Chicago",
        state: "IL",
        zip: "60601",
        country: "USA",
      },
    },
    consent: {
      termsAccepted: true,
      dataProcessingConsent: true,
    },
    paymentLink: "https://payment.example.com/member-3",
    paymentStatus: "PENDING",
    committeeApproval: {
      stage: "COMMITTEE",
      status: "APPROVED",
      approverName: "Committee User",
      approverEmail: "committee@example.com",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
    boardApproval: {
      stage: "BOARD",
      status: "APPROVED",
      approverName: "Board User",
      approverEmail: "board@example.com",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    ceoApproval: {
      stage: "CEO",
      status: "APPROVED",
      approverName: "CEO User",
      approverEmail: "ceo@example.com",
      timestamp: new Date().toISOString(),
    },
  },
  {
    _id: "mock-member-4",
    memberId: "MEM-004",
    id: "mock-member-4",
    firstName: "Alice",
    lastName: "Williams",
    email: "alice.williams@example.com",
    phone: "+1234567893",
    membershipType: "Corporate",
    status: "REJECTED",
    currentStage: "COMMITTEE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    organisationInfo: {
      name: "Retail Ventures",
      registrationNumber: "REG-555666",
      taxId: "TAX-777888",
      industry: "Retail",
      website: "https://retailventures.com",
      address: {
        line1: "321 Shopping Lane",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
        country: "USA",
      },
    },
    consent: {
      termsAccepted: true,
      dataProcessingConsent: true,
    },
    committeeApproval: {
      stage: "COMMITTEE",
      status: "REJECTED",
      approverName: "Committee User",
      approverEmail: "committee@example.com",
      comment: "Does not meet membership criteria",
      timestamp: new Date().toISOString(),
    },
  },
];

export const getMockMembers = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  currentStage?: string;
}): PageDataDto<Member> => {
  let filteredMembers = [...mockMembers];

  if (params?.status) {
    filteredMembers = filteredMembers.filter((m) => m.status === params.status);
  }

  if (params?.currentStage) {
    filteredMembers = filteredMembers.filter(
      (m) => m.currentStage === params.currentStage
    );
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    items: filteredMembers.slice(start, end),
    page: {
      total: filteredMembers.length,
      page,
      pageSize: limit,
    },
  };
};

export const getMockMemberById = (id: string): Member | undefined => {
  return mockMembers.find((m) => m.id === id);
};
