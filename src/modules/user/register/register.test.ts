import * as faker from "faker";
import { Connection } from "typeorm";

import { User } from "../../../entity/User";
import { createTestConn } from "../../../testUtils/createTestConn";
import { TestClient } from "../../../utils/TestClient";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough,
} from "./errorMessages";

faker.seed(Date.now() + 5);
const email = faker.internet.email();
const password = faker.internet.password();

let conn: Connection;

beforeAll(async () => {
  conn = await createTestConn();
});

afterAll(async () => {
  conn.close();
});

describe("Register User", () => {
  it("check for duplicate emails", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    // make sure we can register a user
    const response = await client.register(email, password);
    expect(response.data).toEqual({ register: null });
    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    const response2 = await client.register(email, password);
    expect(response2.data.register).toHaveLength(1);
    expect(response2.data.register[0]).toEqual({
      path: "email",
      message: duplicateEmail,
    });
  });

  it("check bad email", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response3 = await client.register("b", password);
    expect(response3.data).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough,
        },
        {
          path: "email",
          message: invalidEmail,
        },
      ],
    });
  });

  it("check bad password", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response4 = await client.register(email, "ab");
    expect(response4.data).toEqual({
      register: [
        {
          path: "password",
          message: passwordNotLongEnough,
        },
      ],
    });
  });

  it("check bad password and bad email", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response5 = await client.register("df", "ab");
    expect(response5.data).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough,
        },
        {
          path: "email",
          message: invalidEmail,
        },
        {
          path: "password",
          message: passwordNotLongEnough,
        },
      ],
    });
  });
});
