import fetch from "node-fetch";

test("sends invalid back if bad id is sent", async () => {
  const response = await fetch(`${process.env.TEST_HOST}/confirm/12083`);
  const text = await response.text();
  expect(text).toEqual("invalid");
});
