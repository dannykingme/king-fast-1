import request from "supertest";
import { createApp } from "./main";
import * as fs from "fs";

const TEST_DB = "./test_users.db";

describe("Users API", () => {
  let app: ReturnType<typeof createApp>["app"];
  let close: ReturnType<typeof createApp>["close"];

  beforeEach(() => {
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
    const instance = createApp(TEST_DB);
    app = instance.app;
    close = instance.close;
  });

  afterEach(() => {
    close();
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });

  test("create user", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", email: "john@example.com" });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("John Doe");
    expect(response.body.email).toBe("john@example.com");
    expect(response.body).toHaveProperty("id");
  });

  test("get users", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", email: "john@example.com" });

    const response = await request(app).get("/users");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("John Doe");
  });

  test("duplicate email returns 400", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", email: "john@example.com" });

    const response = await request(app)
      .post("/users")
      .send({ name: "Jane Doe", email: "john@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("Email already registered");
  });
});
