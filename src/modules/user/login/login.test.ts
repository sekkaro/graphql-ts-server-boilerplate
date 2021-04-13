import { Connection } from "typeorm";
import * as faker from "faker";

import { User } from "../../../entity/User";
import { createTestConn } from "../../../testUtils/createTestConn";
import { TestClient } from "../../../utils/TestClient";
import { confirmEmailError, invalidLogin } from "./errorMessages";

faker.seed(Date.now() + 1);
const email = faker.internet.email();
const password = faker.internet.password();

let conn: Connection;

beforeAll(async () => {
  conn = await createTestConn();
});

afterAll(async () => {
  conn.close();
});

const loginExpectError = async (
  client: TestClient,
  e: string,
  p: string,
  errMsg: string
) => {
  const response = await client.login(e, p);

  expect(response.data).toEqual({
    login: [
      {
        path: "email",
        message: errMsg,
      },
    ],
  });
};

describe("login", () => {
  test("email not found send back error", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    await loginExpectError(
      client,
      faker.internet.email(),
      faker.internet.password(),
      invalidLogin
    );
  });

  test("email not confirmed", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.register(email, password);

    await loginExpectError(client, email, password, confirmEmailError);

    await User.update({ email }, { confirmed: true });

    await loginExpectError(client, email, "tom", invalidLogin);

    const response = await client.login(email, password);

    expect(response.data).toEqual({ login: null });
  });
});
