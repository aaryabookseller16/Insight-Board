const request = require("supertest");
const app = require("../src/index");
const { resetDb, createUser, pool } = require("./helpers/db");

afterAll(async () => {
  await pool.end();
});

describe("POST /auth/register", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("registers a new user with role forced to 'user'", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "new@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("new@example.com");
    expect(res.body.user.role).toBe("user");
  });

  it("never grants admin even if the request body asks for it", async () => {
    // Regression test for the privilege-escalation bug: /auth/register used
    // to trust a client-supplied role field.
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "wannabe-admin@example.com", password: "password123", role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });

  it("rejects a duplicate email with 409", async () => {
    await createUser({ email: "dupe@example.com", password: "password123" });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "dupe@example.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("rejects a missing password with 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "nopassword@example.com" });

    expect(res.status).toBe(400);
  });

  it("rejects a non-string email with 400 instead of crashing", async () => {
    // Regression test for the sync-throw bug: a non-string email used to
    // throw inside email.toLowerCase() before validation existed.
    const res = await request(app)
      .post("/auth/register")
      .send({ email: 12345, password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await resetDb();
    await createUser({ email: "user@example.com", password: "correct-password" });
  });

  it("logs in with correct credentials and returns a token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "whatever" });

    expect(res.status).toBe(401);
  });
});
