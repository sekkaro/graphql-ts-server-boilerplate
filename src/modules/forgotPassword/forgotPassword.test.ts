import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createForgotPasswordLink } from "../../utils/createConfirmEmailLink";
import { createTypeormConn } from "../../utils/createTypeormConn";
import { TestClient } from "../../utils/TestClient";
import * as Redis from "ioredis";

let conn: Connection;
const redis = new Redis();
const email = "bob@bob.com";
const password = "jfldsjfdlsf";
const newPassword = "fkslnfslkdnf";

let userId: string;
beforeAll(async () => {
  conn = await createTypeormConn();
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

    const url = await createForgotPasswordLink("", userId, redis);
    const parts = url.split("/");
    const key = parts[parts.length - 1];

    const response = await client.forgotPasswordChange(newPassword, key);
    expect(response.data).toEqual({
      forgotPasswordChange: null,
    });

    expect(await client.login(email, newPassword)).toEqual({
      data: {
        login: null,
      },
    });
  });
});
