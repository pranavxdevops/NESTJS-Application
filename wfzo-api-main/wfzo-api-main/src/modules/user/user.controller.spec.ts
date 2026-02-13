import { Test } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import type { User, UserAccess, UserSearchData } from "./dto/user.dto";

describe("UserController", () => {
  let controller: UserController;
  const service = {
    searchUsers: jest.fn(() =>
      Promise.resolve({
        items: [],
        page: { total: 0, page: 1, pageSize: 20 },
      }),
    ),
    createUser: jest.fn((u: User) => Promise.resolve(u)),
    updateProfile: jest.fn((username: string, patch: Partial<User>) =>
      Promise.resolve({
        username,
        email: `${username}`,
        ...patch,
      }),
    ),
    getUserAccess: jest.fn((u: string) =>
      Promise.resolve({
        user: { id: "1", username: u },
        membershipId: "m",
        entitlements: {},
        generatedAt: new Date().toISOString(),
      }),
    ),
    deleteProfile: jest.fn(() => Promise.resolve()),
  } as unknown as UserService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UserController);
  });

  it("search returns empty", async () => {
    const res = await controller.search({ page: 1, pageSize: 20 });
    expect(res.page.total).toBe(0);
  });

  it("create delegates to service", async () => {
    const u = await controller.create({ username: "t@e.com", email: "t@e.com" });
    expect(u.username).toBe("t@e.com");
  });

  it("update profile calls service", async () => {
    const u = await controller.updateProfile("a@a", { firstName: "A" });
    expect(u.firstName).toBe("A");
  });

  it("get access returns structure", async () => {
    const a = await controller.getAccess("x@y.com");
    expect(a.user.username).toBe("x@y.com");
  });
});
