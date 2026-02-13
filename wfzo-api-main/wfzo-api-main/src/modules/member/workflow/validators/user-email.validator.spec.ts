import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { UserEmailValidator } from "./user-email.validator";
import { UserRepository } from "@modules/user/repository/user.repository";
import { MemberUserDto, UserType } from "../../dto/member-user.dto";
import { User } from "@modules/user/schemas/user.schema";

describe("UserEmailValidator", () => {
  let validator: UserEmailValidator;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEmailValidator,
        {
          provide: UserRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    validator = module.get<UserEmailValidator>(UserEmailValidator);
    userRepository = module.get(UserRepository);
  });

  describe("validateMemberUsers", () => {
    it("should pass validation for unique emails", async () => {
      const memberUsers: MemberUserDto[] = [
        {
          username: "user1@example.com",
          email: "user1@example.com",
          userType: UserType.PRIMARY,
        },
        {
          username: "user2@different.com",
          email: "user2@different.com",
          userType: UserType.SECONDARY,
        },
      ];

      userRepository.findOne.mockResolvedValue(null);

      await expect(validator.validateMemberUsers(memberUsers)).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledTimes(3); // 2 email checks + 1 domain check
    });

    it("should throw ConflictException for duplicate email", async () => {
      const memberUsers: MemberUserDto[] = [
        {
          username: "duplicate@example.com",
          email: "duplicate@example.com",
          userType: UserType.SECONDARY,
        },
      ];

      userRepository.findOne.mockResolvedValue({
        email: "duplicate@example.com",
        username: "duplicate@example.com",
      } as User);

      await expect(validator.validateMemberUsers(memberUsers)).rejects.toThrow(ConflictException);
      await expect(validator.validateMemberUsers(memberUsers)).rejects.toThrow(
        "Email 'duplicate@example.com' is already registered to another user",
      );
    });

    it("should throw ConflictException for duplicate Primary email domain", async () => {
      const memberUsers: MemberUserDto[] = [
        {
          username: "newuser@example.com",
          email: "newuser@example.com",
          userType: UserType.PRIMARY,
        },
      ];

      // First call (email check) returns null
      // Second call (domain check) returns existing Primary user with same domain
      userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        email: "existing@example.com",
        username: "existing@example.com",
        userType: UserType.PRIMARY,
      } as User);

      await expect(validator.validateMemberUsers(memberUsers)).rejects.toThrow(ConflictException);
      await expect(validator.validateMemberUsers(memberUsers)).rejects.toThrow(
        "A Primary user with email domain '@example.com' already exists",
      );
    });

    it("should allow Secondary users with same domain as Primary user", async () => {
      const memberUsers: MemberUserDto[] = [
        {
          username: "secondary@example.com",
          email: "secondary@example.com",
          userType: UserType.SECONDARY,
        },
      ];

      userRepository.findOne.mockResolvedValue(null);

      await expect(validator.validateMemberUsers(memberUsers)).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledTimes(1); // Only email check, no domain check
    });

    it("should allow multiple Primary users with different domains", async () => {
      const memberUsers: MemberUserDto[] = [
        {
          username: "user1@domain1.com",
          email: "user1@domain1.com",
          userType: UserType.PRIMARY,
        },
        {
          username: "user2@domain2.com",
          email: "user2@domain2.com",
          userType: UserType.PRIMARY,
        },
      ];

      userRepository.findOne.mockResolvedValue(null);

      await expect(validator.validateMemberUsers(memberUsers)).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledTimes(4); // 2 email checks + 2 domain checks
    });

    it("should handle empty array gracefully", async () => {
      await expect(validator.validateMemberUsers([])).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it("should exclude existing user when updating", async () => {
      const memberUsers: MemberUserDto[] = [
        {
          id: "existing-user-id",
          username: "user@example.com",
          email: "user@example.com",
          userType: UserType.PRIMARY,
        },
      ];

      userRepository.findOne.mockResolvedValue(null);

      await expect(validator.validateMemberUsers(memberUsers)).resolves.not.toThrow();

      // Verify that findOne was called with $ne filter to exclude the user being updated
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: { $ne: "existing-user-id" },
        }),
      );
    });

    it("should throw ConflictException for invalid email format", async () => {
      const memberUsers: MemberUserDto[] = [
        {
          username: "invalid-email",
          email: "invalid-email",
          userType: UserType.PRIMARY,
        },
      ];

      userRepository.findOne.mockResolvedValue(null);

      await expect(validator.validateMemberUsers(memberUsers)).rejects.toThrow(ConflictException);
      await expect(validator.validateMemberUsers(memberUsers)).rejects.toThrow(
        "Invalid email format",
      );
    });
  });
});
