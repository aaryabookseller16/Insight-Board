-- db/seed.sql
--
-- PURPOSE
-- -------
-- Seed the database with:
-- - 1 admin user + 2 normal users
-- - ~500 events spread across the last 14 days
--
-- IMPORTANT
-- ---------
-- We need REAL password hashes so /auth/login works.
-- Postgres can generate bcrypt hashes using the pgcrypto extension.

-- Enable pgcrypto so we can call crypt() + gen_salt() (bcrypt).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clear old data (safe in dev).
TRUNCATE TABLE events RESTART IDENTITY;
TRUNCATE TABLE users  RESTART IDENTITY CASCADE;

-- USERS
-- -----
-- Passwords:
-- admin@example.com -> admin123
-- user1@example.com -> user123
-- user2@example.com -> user123
--
-- crypt(password, gen_salt('bf', 10)) generates a bcrypt hash with cost=10
INSERT INTO users (email, password_hash, role)
VALUES
  ('admin@example.com', crypt('admin123', gen_salt('bf', 10)), 'admin'),
  ('user1@example.com', crypt('user123',  gen_salt('bf', 10)), 'user'),
  ('user2@example.com', crypt('user123',  gen_salt('bf', 10)), 'user');

-- EVENTS
-- ------
-- Create ~500 events in the last 14 days.
-- Distribution:
-- - random user among the 3 users
-- - random type among sale/refund/visit
-- - amount_cents is nonzero only for sale/refund
INSERT INTO events (user_id, type, amount_cents, created_at)
SELECT
  (1 + (random() * 2)::int) AS user_id,  -- user ids 1..3

  -- pick one of 3 event types
  (ARRAY['sale','refund','visit'])[1 + (random() * 2)::int] AS type,

  -- money only for sale/refund
  CASE
    WHEN (random() < 0.33) THEN 0
    ELSE (500 + (random() * 4500))::int  -- $5.00 to $50.00
  END AS amount_cents,

  -- spread timestamps across the last 14 days
  NOW()
    - ((random() * 13)::int) * INTERVAL '1 day'
    - (random() * INTERVAL '23 hours')
    - (random() * INTERVAL '59 minutes')
FROM generate_series(1, 500);