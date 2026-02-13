/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { EnquiriesService } from "./enquiries.service";
import { EnquiriesRepository } from "./repository/enquiries.repository";
import { EmailService } from "@shared/email/email.service";
import { ConfigService } from "@nestjs/config";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";

describe("EnquiriesService", () => {
  let service: EnquiriesService;
  let repo: jest.Mocked<EnquiriesRepository>;
  let emailService: jest.Mocked<EmailService>;
  let config: jest.Mocked<ConfigService>;

  const mockRepo = {
    create: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnquiriesService,
        { provide: EnquiriesRepository, useValue: mockRepo },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<EnquiriesService>(EnquiriesService);
    repo = module.get(EnquiriesRepository);
    emailService = module.get(EmailService);
    config = module.get(ConfigService);

    jest.clearAllMocks();
  });

  it("should return created enquiry even if email sending fails", async () => {
    const dto: CreateEnquiryDto = {
      enquiryType: "learn_more" as any,
      message: "Hi",
      userDetails: {
        firstName: "John",
        lastName: "Doe",
        organizationName: "Org",
        country: "Country",
        phoneNumber: "123",
        email: "john@example.com",
      },
    };

    const created = { ...dto, createdAt: new Date() } as any;

    repo.create.mockResolvedValue(created);
    emailService.sendEmail.mockRejectedValue(new Error("SMTP failed"));
    config.get.mockReturnValue("admin@example.org");

    const result = await service.createEnquiry(dto);

    expect(result).toBe(created);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(emailService.sendEmail).toHaveBeenCalled();
  });

  it("should attempt to send email and not throw on success", async () => {
    const dto: CreateEnquiryDto = {
      enquiryType: "learn_more" as any,
      message: "Hello",
      userDetails: {
        firstName: "Jane",
        lastName: "Roe",
        organizationName: "Org2",
        country: "Country",
        phoneNumber: "456",
        email: "jane@example.com",
      },
    };

    const created = { ...dto, createdAt: new Date() } as any;

    repo.create.mockResolvedValue(created);
    emailService.sendEmail.mockResolvedValue(undefined as any);
    config.get.mockReturnValue("admin@example.org");

    const result = await service.createEnquiry(dto);

    expect(result).toBe(created);
    expect(emailService.sendEmail).toHaveBeenCalled();
  });
});
