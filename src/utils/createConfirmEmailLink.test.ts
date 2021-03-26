import * as Redis from "ioredis";
import fetch from "node-fetch";

import { User } from "../entity/User";
import { createConfirmEmailLink } from "./createConfirmEmailLink";
import { createTypeormConn } from "./createTypeormConn";

let userId = "";
const redis = new Redis();

beforeAll(async () => {
  await createTypeormConn();
  const user = await User.create({
    email: "bob@bob.com",
    password: "jfldsjfdlsf",
  }).save();
  userId = user.id;
});

describe("test createConfirmEmailLink", () => {
  test("Make sure it confirms user and clears key in redis", async () => {
    const url = await createConfirmEmailLink(
      process.env.TEST_HOST as string,
      userId as string,
      redis
    );

    const response = await fetch(url);
    const text = await response.text();
    expect(text).toEqual("ok");
    const user = await User.findOne({ where: { id: userId } });
    expect((user as User).confirmed).toBeTruthy();
    const chunks = url.split("/");
    const key = chunks[chunks.length - 1];
    const value = await redis.get(key);
    expect(value).toBeNull();
  });

  test("sends invalid back if bad id is sent", async () => {
    const response = await fetch(`${process.env.TEST_HOST}/confirm/12083`);
    const text = await response.text();
    expect(text).toEqual("invalid");
  });
});
