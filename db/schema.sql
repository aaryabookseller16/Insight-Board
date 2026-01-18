-- db/schema.sql
--
-- PURPOSE
-- -------
-- Defines the entire database schema for InsightBoard.
-- This file is meant to be re-runnable in dev: you can blow away tables and recreate them.
--
-- TABLES
-- ------
-- users  : accounts (email + bcrypt password hash + role)
-- events : time-series events tied to a user (sales/refunds/visits)
--
-- NOTE
-- ----
-- In production you'd use migrations. For this project, a single schema.sql is perfect.

-- Drop child table first (events references users).
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- USERS
-- -----
-- Stores credentials + role. Passwords are NEVER stored in plaintext.
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,                         -- internal numeric id
  email         TEXT NOT NULL UNIQUE,                        -- unique login identity
  password_hash TEXT NOT NULL,                               -- bcrypt hash (never plaintext)
  role          TEXT NOT NULL CHECK (role IN ('admin','user')),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- EVENTS
-- ------
-- Represents actions over time. Only some event types have money.
CREATE TABLE events (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('sale','refund','visit')),
  amount_cents INT NOT NULL DEFAULT 0,                       -- cents so we avoid float money bugs
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- INDEXES
-- -------
-- Dashboards query by time range constantly (daily charts, last 14 days, etc),
-- so created_at must be indexed.
CREATE INDEX idx_events_created_at ON events(created_at);

-- For non-admin users we often query: "events for this user over time",
-- so compound index helps a lot.
CREATE INDEX idx_events_user_created_at ON events(user_id, created_at);