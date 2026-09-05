const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/index");
const { resetDb, createUser, createEvent, pool } = require("./helpers/db");

function tokenFor(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });
}

describe("GET /kpis/* RBAC scoping", () => {
  let admin, userA, userB, adminToken, userAToken, userBToken;

  beforeEach(async () => {
    await resetDb();

    admin = await createUser({ email: "admin@example.com", password: "password123", role: "admin" });
    userA = await createUser({ email: "usera@example.com", password: "password123", role: "user" });
    userB = await createUser({ email: "userb@example.com", password: "password123", role: "user" });

    // userA: 2 sales ($10 + $20), 1 refund ($5) -> revenue 2500 cents, 3 events
    await createEvent({ userId: userA.id, type: "sale", amountCents: 1000 });
    await createEvent({ userId: userA.id, type: "sale", amountCents: 2000 });
    await createEvent({ userId: userA.id, type: "refund", amountCents: 500 });

    // userB: 1 sale ($100) -> revenue 10000 cents, 1 event
    await createEvent({ userId: userB.id, type: "sale", amountCents: 10000 });

    adminToken = tokenFor(admin);
    userAToken = tokenFor(userA);
    userBToken = tokenFor(userB);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("scopes /kpis/summary to only the caller's own events for a regular user", async () => {
    const res = await request(app).get("/kpis/summary").set("Authorization", `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.event_count).toBe(3);
    expect(res.body.revenue_cents).toBe(2500);
    expect(res.body).toHaveProperty("active_days");
    expect(res.body).not.toHaveProperty("active_users");
  });

  it("does not leak userB's data into userA's /kpis/summary", async () => {
    const res = await request(app).get("/kpis/summary").set("Authorization", `Bearer ${userAToken}`);
    // If scoping broke, revenue would include userB's $100 sale (12500 total).
    expect(res.body.revenue_cents).toBe(2500);
  });

  it("gives admin totals across every user on /kpis/summary", async () => {
    const res = await request(app).get("/kpis/summary").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.event_count).toBe(4);
    expect(res.body.revenue_cents).toBe(12500);
    expect(res.body.active_users).toBe(2);
    expect(res.body).not.toHaveProperty("active_days");
  });

  it("scopes /kpis/top to the caller's own events for a regular user", async () => {
    const res = await request(app).get("/kpis/top").set("Authorization", `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ type: "sale", count: 1 }]);
  });

  it("gives admin top event types across every user", async () => {
    const res = await request(app).get("/kpis/top").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const saleRow = res.body.find((r) => r.type === "sale");
    expect(saleRow.count).toBe(3); // 2 from userA + 1 from userB
  });

  it("scopes /kpis/daily to the caller's own events for a regular user", async () => {
    const res = await request(app).get("/kpis/daily").set("Authorization", `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    const totalRevenue = res.body.reduce((sum, row) => sum + row.revenue_cents, 0);
    expect(totalRevenue).toBe(2500);
  });

  it("rejects /kpis/* without a token", async () => {
    const res = await request(app).get("/kpis/summary");
    expect(res.status).toBe(401);
  });
});
