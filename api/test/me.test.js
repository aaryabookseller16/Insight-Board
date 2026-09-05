const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/index");
const { resetDb, createUser, pool } = require("./helpers/db");

describe("GET /me", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("returns the caller's own identity for a valid token", async () => {
    const user = await createUser({ email: "me@example.com", password: "password123", role: "user" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    const res = await request(app).get("/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: user.id, email: user.email, role: "user" });
  });

  it("rejects a request with no Authorization header", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
  });

  it("rejects a malformed Authorization header", async () => {
    const res = await request(app).get("/me").set("Authorization", "NotBearer sometoken");
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const token = jwt.sign({ id: 1, email: "x@example.com", role: "user" }, "wrong-secret", {
      expiresIn: "2h",
    });
    const res = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const token = jwt.sign({ id: 1, email: "x@example.com", role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "-1s",
    });
    const res = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
