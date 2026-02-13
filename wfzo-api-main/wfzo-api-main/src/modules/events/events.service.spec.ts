/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { EventsService } from "./events.service";
import { EventRepository } from "./repository/event.repository";
import { RegistrationRepository } from "./repository/registration.repository";
import { ZOOM_SERVICE, type IZoomService } from "./zoom";
import { EventType, EventStatus, RegistrationStatus, EventCreateRequest } from "./dto/events.dto";

describe("EventsService", () => {
  let service: EventsService;
  let eventRepository: jest.Mocked<EventRepository>;
  let registrationRepository: jest.Mocked<RegistrationRepository>;
  let zoomService: jest.Mocked<IZoomService>;

  const mockEventRepository = {
    create: jest.fn(),
    findByEventCode: jest.fn(),
    searchEvents: jest.fn(),
    countByEventCode: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockRegistrationRepository = {
    create: jest.fn(),
    findByEventCode: jest.fn(),
    findByEventCodeAndEmail: jest.fn(),
    countByEventCode: jest.fn(),
    countByEventCodeAndStatus: jest.fn(),
    searchRegistrations: jest.fn(),
    bulkUpdateStatus: jest.fn(),
  };

  const mockZoomService = {
    createWebinar: jest.fn(),
    createMeeting: jest.fn(),
    addWebinarRegistrant: jest.fn(),
    addMeetingRegistrant: jest.fn(),
    updateWebinar: jest.fn(),
    updateMeeting: jest.fn(),
    cancelWebinar: jest.fn(),
    cancelMeeting: jest.fn(),
    deleteWebinar: jest.fn(),
    deleteMeeting: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventRepository, useValue: mockEventRepository },
        { provide: RegistrationRepository, useValue: mockRegistrationRepository },
        { provide: ZOOM_SERVICE, useValue: mockZoomService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepository = module.get(EventRepository);
    registrationRepository = module.get(RegistrationRepository);
    zoomService = module.get(ZOOM_SERVICE);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createEvent", () => {
    const createEventDto: EventCreateRequest = {
      eventCode: "TEST2024",
      type: EventType.WEBINAR,
      title: "Test Webinar",
      description: "Test Description",
      scheduledAt: "2024-12-01T10:00:00Z",
      durationMinutes: 60,
      timezone: "UTC",
      presenter: {
        name: "John Doe",
        email: "john@example.com",
      },
      capacity: 100,
      language: "en",
      createdBy: {
        type: "wfzo" as const,
        memberName: "Admin",
      },
    };

    it("should create an event successfully without Zoom", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(null);
      mockEventRepository.create.mockResolvedValue({} as any);

      const result = await service.createEvent(createEventDto);

      expect(result).toHaveProperty("id");
      expect(result.eventCode).toBe("TEST2024");
      expect(result.status).toBe(EventStatus.SCHEDULED);
      expect(mockEventRepository.findByEventCode).toHaveBeenCalledWith("TEST2024");
      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventCode: "TEST2024",
          type: "webinar",
          title: "Test Webinar",
          status: "scheduled",
        }),
      );
    });

    it("should throw BadRequestException if event code already exists", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue({ eventCode: "TEST2024" } as any);

      await expect(service.createEvent(createEventDto)).rejects.toThrow(BadRequestException);
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("listEvents", () => {
    it("should return paginated list of events", async () => {
      const mockEvents = [
        {
          id: "1",
          eventCode: "TEST2024",
          title: "Test Event",
          scheduledAt: new Date("2024-12-01"),
          type: "webinar",
          capacity: 100,
          status: "scheduled",
          presenter: { name: "John", email: "john@example.com" },
          createdBy: { type: "wfzo", memberName: "Admin" },
        },
      ];

      mockEventRepository.searchEvents.mockResolvedValue({
        items: mockEvents as any,
        page: { total: 1, page: 1, pageSize: 20 },
      });
      mockRegistrationRepository.countByEventCodeAndStatus.mockResolvedValue(10);

      const result = await service.listEvents({}, 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].eventCode).toBe("TEST2024");
      expect(result.items[0].type).toBe(EventType.WEBINAR);
      expect(result.items[0].status).toBe(EventStatus.SCHEDULED);
      expect(result.items[0].registrationCount).toBe(10);
    });

    it("should apply filters correctly", async () => {
      mockEventRepository.searchEvents.mockResolvedValue({
        items: [],
        page: { total: 0, page: 1, pageSize: 20 },
      });

      await service.listEvents(
        {
          status: ["scheduled"],
          type: "webinar",
          createdBy: "member123",
          q: "test",
        },
        1,
        20,
      );

      expect(mockEventRepository.searchEvents).toHaveBeenCalledWith(
        "test",
        {
          status: ["scheduled"],
          type: "webinar",
          createdBy: "member123",
          q: "test",
        },
        { page: 1, pageSize: 20 },
      );
    });
  });

  describe("getEventByCode", () => {
    const mockEvent = {
      id: "1",
      eventCode: "TEST2024",
      type: "webinar",
      title: "Test Event",
      description: "Test Description",
      scheduledAt: new Date("2024-12-01"),
      durationMinutes: 60,
      timezone: "UTC",
      presenter: { name: "John", email: "john@example.com" },
      capacity: 100,
      language: "en",
      status: "scheduled",
      createdBy: { type: "wfzo", memberName: "Admin" },
      registrationSettings: {
        requiresApproval: false,
        registrationDeadline: new Date("2024-11-30"),
        allowWaitlist: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should return event details with registration info", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(25);

      const result = await service.getEventByCode("TEST2024");

      expect(result.eventCode).toBe("TEST2024");
      expect(result.type).toBe(EventType.WEBINAR);
      expect(result.status).toBe(EventStatus.SCHEDULED);
      expect(result.registrationCount).toBe(25);
      expect(result.availableSeats).toBe(75);
      expect(result.registrationOpen).toBe(true);
    });

    it("should throw NotFoundException if event not found", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(null);

      await expect(service.getEventByCode("NOTFOUND")).rejects.toThrow(NotFoundException);
    });

    it("should indicate registration is closed when capacity is full", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(100);

      const result = await service.getEventByCode("TEST2024");

      expect(result.availableSeats).toBe(0);
      expect(result.registrationOpen).toBe(false);
    });
  });

  describe("updateEvent", () => {
    it("should update event successfully", async () => {
      const mockEvent = {
        id: "1",
        eventCode: "TEST2024",
        type: "webinar",
        status: "scheduled",
        title: "Original Title",
        description: "Original Description",
        scheduledAt: new Date("2024-12-01"),
        durationMinutes: 60,
        timezone: "UTC",
        presenter: { name: "John", email: "john@example.com" },
        capacity: 100,
        language: "en",
        createdBy: { type: "wfzo", memberName: "Admin" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockEventRepository.updateOne.mockResolvedValue({} as any);

      const updateDto = {
        title: "Updated Title",
        description: "Updated Description",
      };

      // Mock getEventByCode to return after update
      const updatedEvent = { ...mockEvent, ...updateDto };
      mockEventRepository.findByEventCode.mockResolvedValueOnce(mockEvent as any);
      mockEventRepository.findByEventCode.mockResolvedValueOnce(updatedEvent as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(0);

      const result = await service.updateEvent("TEST2024", updateDto);

      expect(mockEventRepository.updateOne).toHaveBeenCalledWith(
        { eventCode: "TEST2024" },
        { $set: expect.objectContaining({ title: "Updated Title" }) },
      );
      expect(result.title).toBe("Updated Title");
    });

    it("should throw NotFoundException if event not found", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(null);

      await expect(service.updateEvent("NOTFOUND", { title: "Test" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("deleteEvent", () => {
    it("should delete event when no registrations exist", async () => {
      const mockEvent = { id: "1", eventCode: "TEST2024" };
      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(0);
      mockEventRepository.deleteOne.mockResolvedValue({} as any);

      await service.deleteEvent("TEST2024");

      expect(mockEventRepository.deleteOne).toHaveBeenCalledWith({ eventCode: "TEST2024" }, true);
    });

    it("should throw BadRequestException if registrations exist", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue({ id: "1" } as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(5);

      await expect(service.deleteEvent("TEST2024")).rejects.toThrow(BadRequestException);
      expect(mockEventRepository.deleteOne).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if event not found", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(null);

      await expect(service.deleteEvent("NOTFOUND")).rejects.toThrow(NotFoundException);
    });
  });

  describe("cancelEvent", () => {
    it("should cancel event and all registrations", async () => {
      const mockEvent = { id: "1", eventCode: "TEST2024" };
      const mockRegistrations = {
        items: [{ id: "reg1" }, { id: "reg2" }],
        page: {},
      };

      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockEventRepository.updateOne.mockResolvedValue({} as any);
      mockRegistrationRepository.findByEventCode.mockResolvedValue(mockRegistrations as any);
      mockRegistrationRepository.bulkUpdateStatus.mockResolvedValue({} as any);

      await service.cancelEvent("TEST2024", {
        reason: "Event cancelled",
        notifyAttendees: true,
      });

      expect(mockEventRepository.updateOne).toHaveBeenCalledWith(
        { eventCode: "TEST2024" },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: "cancelled",
            cancelReason: "Event cancelled",
          }),
        }),
      );
      expect(mockRegistrationRepository.bulkUpdateStatus).toHaveBeenCalledWith(
        ["reg1", "reg2"],
        "cancelled",
      );
    });

    it("should throw NotFoundException if event not found", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(null);

      await expect(
        service.cancelEvent("NOTFOUND", { reason: "Test", notifyAttendees: false }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("registerForEvent", () => {
    const mockEvent = {
      id: "1",
      eventCode: "TEST2024",
      capacity: 100,
      status: "scheduled",
      registrationSettings: {
        requiresApproval: false,
        allowWaitlist: false,
      },
    };

    it("should register attendees successfully", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(50);
      mockRegistrationRepository.findByEventCodeAndEmail.mockResolvedValue(null);
      mockRegistrationRepository.create.mockResolvedValue({} as any);

      const registrationDto = {
        eventCode: "TEST2024",
        membershipId: "member123",
        attendees: [
          {
            firstName: "Jane",
            lastName: "Doe",
            email: "jane@example.com",
          },
        ],
        consent: true,
      };

      const result = await service.registerForEvent(registrationDto);

      expect(result.eventCode).toBe("TEST2024");
      expect(result.status).toBe(RegistrationStatus.CONFIRMED);
      expect(result.registrations).toHaveLength(1);
      expect(result.registrations[0].email).toBe("jane@example.com");
      expect(mockRegistrationRepository.create).toHaveBeenCalled();
    });

    it("should throw BadRequestException when capacity is exceeded", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(99);

      const registrationDto = {
        eventCode: "TEST2024",
        membershipId: "member123",
        attendees: [
          { firstName: "John", lastName: "Doe", email: "john@example.com" },
          { firstName: "Jane", lastName: "Doe", email: "jane@example.com" },
        ],
        consent: true,
      };

      await expect(service.registerForEvent(registrationDto)).rejects.toThrow(BadRequestException);
      expect(mockRegistrationRepository.create).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException if attendee already registered", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(50);
      mockRegistrationRepository.findByEventCodeAndEmail.mockResolvedValue({
        id: "existing",
        status: "confirmed",
      } as any);

      const registrationDto = {
        eventCode: "TEST2024",
        membershipId: "member123",
        attendees: [{ firstName: "John", lastName: "Doe", email: "john@example.com" }],
        consent: true,
      };

      await expect(service.registerForEvent(registrationDto)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if event not found", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(null);

      await expect(
        service.registerForEvent({
          eventCode: "NOTFOUND",
          membershipId: "member123",
          attendees: [],
          consent: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getMyRegistration", () => {
    it("should return registration details if user is registered", async () => {
      const mockRegistration = {
        id: "reg123",
        eventCode: "TEST2024",
        status: "confirmed",
        attendee: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
        joinUrl: "https://zoom.us/j/123",
        zoomRegistrantId: "zoom123",
        createdAt: new Date(),
      };

      mockRegistrationRepository.findByEventCodeAndEmail.mockResolvedValue(mockRegistration as any);

      const result = await service.getMyRegistration("TEST2024", "john@example.com");

      expect(result.registered).toBe(true);
      expect(result.registrationId).toBe("reg123");
      expect(result.status).toBe(RegistrationStatus.CONFIRMED);
      expect(result.joinUrl).toBe("https://zoom.us/j/123");
    });

    it("should return not registered if no registration found", async () => {
      mockRegistrationRepository.findByEventCodeAndEmail.mockResolvedValue(null);

      const result = await service.getMyRegistration("TEST2024", "john@example.com");

      expect(result.registered).toBe(false);
    });

    it("should return not registered if registration is cancelled", async () => {
      mockRegistrationRepository.findByEventCodeAndEmail.mockResolvedValue({
        status: "cancelled",
      } as any);

      const result = await service.getMyRegistration("TEST2024", "john@example.com");

      expect(result.registered).toBe(false);
    });
  });

  describe("getRegistrationDetails", () => {
    it("should return registration availability details", async () => {
      const mockEvent = {
        eventCode: "TEST2024",
        capacity: 100,
        status: "scheduled",
        zoomDetails: {
          registrationUrl: "https://zoom.us/register",
        },
      };

      mockEventRepository.findByEventCode.mockResolvedValue(mockEvent as any);
      mockRegistrationRepository.countByEventCode.mockResolvedValue(75);

      const result = await service.getRegistrationDetails("TEST2024");

      expect(result.eventCode).toBe("TEST2024");
      expect(result.totalCapacity).toBe(100);
      expect(result.seatsTaken).toBe(75);
      expect(result.seatsRemaining).toBe(25);
      expect(result.registrationOpen).toBe(true);
      expect(result.registrationUrl).toBe("https://zoom.us/register");
    });

    it("should throw NotFoundException if event not found", async () => {
      mockEventRepository.findByEventCode.mockResolvedValue(null);

      await expect(service.getRegistrationDetails("NOTFOUND")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getAttendees", () => {
    it("should return paginated list of attendees", async () => {
      const mockRegistrations = {
        items: [
          {
            id: "reg1",
            eventCode: "TEST2024",
            attendee: {
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
            },
            membershipId: "member123",
            status: "confirmed",
            createdAt: new Date(),
          },
        ],
        page: { total: 1, page: 1, pageSize: 20 },
      };

      mockRegistrationRepository.searchRegistrations.mockResolvedValue(mockRegistrations as any);

      const result = await service.getAttendees("TEST2024", {}, 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].registrationId).toBe("reg1");
      expect(result.items[0].status).toBe(RegistrationStatus.CONFIRMED);
      expect(result.items[0].attendee.email).toBe("john@example.com");
    });

    it("should apply filters correctly", async () => {
      mockRegistrationRepository.searchRegistrations.mockResolvedValue({
        items: [],
        page: { total: 0, page: 1, pageSize: 20 },
      });

      await service.getAttendees(
        "TEST2024",
        {
          status: ["confirmed"],
          includeCancelled: false,
          q: "john",
        },
        1,
        20,
      );

      expect(mockRegistrationRepository.searchRegistrations).toHaveBeenCalledWith(
        "TEST2024",
        {
          status: ["confirmed"],
          includeCancelled: false,
          searchQuery: "john",
        },
        { page: 1, pageSize: 20 },
      );
    });
  });

  describe("exportAttendeesXlsx", () => {
    it("should export attendees to CSV buffer", async () => {
      const mockRegistrations = {
        items: [
          {
            id: "reg1",
            eventCode: "TEST2024",
            attendee: {
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              organization: "ACME Corp",
              jobTitle: "Developer",
              phone: "123-456-7890",
            },
            status: "confirmed",
            createdAt: new Date("2024-01-01"),
          },
        ],
        page: {},
      };

      mockRegistrationRepository.searchRegistrations.mockResolvedValue(mockRegistrations as any);

      const result = await service.exportAttendeesXlsx("TEST2024");

      expect(result).toBeInstanceOf(Buffer);
      const content = result.toString();
      expect(content).toContain("Event Code,First Name,Last Name,Email");
      expect(content).toContain("TEST2024,John,Doe,john@example.com");
    });
  });
});
