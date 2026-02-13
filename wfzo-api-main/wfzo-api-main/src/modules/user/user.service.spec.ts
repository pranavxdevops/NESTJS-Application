/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test } from "@nestjs/testing";
import { UserService } from "./user.service";
import { MembershipService } from "@modules/membership/membership.service";
import { MembershipRepository } from "@modules/membership/repository/membership.repository";
import { UserRepository } from "./repository/user.repository";
import type { User as UserDto } from "./dto/user.dto";

describe("UserService", () => {
  let service: UserService;
  let repoMock: any;

  beforeEach(async () => {
    repoMock = {
      create: jest.fn().mockImplementation((user) => Promise.resolve({ ...user, _id: "mockid" })),
      findOne: jest.fn().mockResolvedValue(null),
      findAll: jest
        .fn()
        .mockResolvedValue({ items: [], page: { total: 0, page: 1, pageSize: 10 } }),
      updateOne: jest.fn().mockResolvedValue(null),
      deleteOne: jest.fn().mockResolvedValue(true),
    };

    const membershipRepoMock = {
      findOne: jest.fn().mockResolvedValue({
        type: "basic",
        entitlements: new Map([
          [
            "events.seats",
            {
              access: "restricted",
              quota: {
                kind: "seats",
                limit: 20,
                used: 0,
                remaining: 20,
                window: "per-event",
              },
            },
          ],
        ]),
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        MembershipService,
        { provide: UserRepository, useValue: repoMock },
        { provide: MembershipRepository, useValue: membershipRepoMock },
      ],
    }).compile();

    service = module.get(UserService);
  });

  it("creates and finds user", async () => {
    const u = await service.createUser({ username: "x@y.com", email: "x@y.com" } as UserDto);
    expect(u.username).toBe("x@y.com");
    expect(repoMock.create).toHaveBeenCalledTimes(1);

    (repoMock.findAll as jest.Mock).mockResolvedValue({
      items: [{ username: "x@y.com", email: "x@y.com" }],
      page: { total: 1, page: 1, pageSize: 10 },
    });

    const res = await service.searchUsers({ page: 1, pageSize: 10 });
    expect(res.page.total).toBe(1);
  });

  it("updates profile", async () => {
    const existing = { username: "a@a.com", email: "a@a.com", firstName: "Old" };
    (repoMock.findOne as jest.Mock).mockResolvedValue(existing);
    (repoMock.updateOne as jest.Mock).mockResolvedValue({ ...existing, firstName: "A" });

    const updated = await service.updateProfile("a@a.com", { firstName: "A" });
    expect(updated.firstName).toBe("A");
  });

  it("returns access payload", async () => {
    const mockUser = { username: "b@b.com", email: "b@b.com", firstName: "Test" };
    (repoMock.findOne as jest.Mock).mockResolvedValue(mockUser);

    const access = await service.getUserAccess("b@b.com");
    expect(access.user.username).toBe("b@b.com");
    expect(access.entitlements).toBeTruthy();
  });
});
