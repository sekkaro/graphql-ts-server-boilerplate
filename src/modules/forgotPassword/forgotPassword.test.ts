import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createForgotPasswordLink } from "../../utils/createForgotPasswordLink";
import { TestClient } from "../../utils/TestClient";
import * as Redis from "ioredis";
import * as faker from "faker";

import { forgotPasswordLockAccount } from "../../utils/forgotPasswordLockAccount";
import { forgotPasswordLockedError } from "../login/errorMessages";
import { passwordNotLongEnough } from "../register/errorMessages";
import { expiredKeyError } from "./errorMessages";
import { createTestConn } from "../../testUtils/createTestConn";

let conn: Connection;
const redis = new Redis();
const email = faker.internet.email();
const password = faker.internet.password();
const newPassword = faker.internet.password();

let userId: string;
beforeAll(async () => {
  conn = await createTestConn();
  const user = await User.create({
    email,
    password,
    confirmed: true,
  }).save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe("forgot password", () => {
  test("make sure it works", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await forgotPasswordLockAccount(userId, redis);
    const url = await createForgotPasswordLink("", userId, redis);

    const parts = url.split("/");
    const key = parts[parts.length - 1];

    expect(await client.login(email, password)).toEqual({
      data: {
        login: [
          {
            path: "email",
            message: forgotPasswordLockedError,
          },
        ],
      },
    });

    expect(await client.forgotPasswordChange("a", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "newPassword",
            message: passwordNotLongEnough,
          },
        ],
      },
    });

    const response = await client.forgotPasswordChange(newPassword, key);

    expect(response.data).toEqual({
      forgotPasswordChange: null,
    });

    expect(
      await client.forgotPasswordChange("sjflsdjflsdjfsdkfj", key)
    ).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "key",
            message: expiredKeyError,
          },
        ],
      },
    });

    expect(await client.login(email, newPassword)).toEqual({
      data: {
        login: null,
      },
    });
  });
});
