-- Home Budget schema. Safe to run more than once.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incomes (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  owner      TEXT,
  amount     NUMERIC(12,2) NOT NULL,
  frequency  TEXT NOT NULL DEFAULT 'monthly',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bills (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Other',
  amount     NUMERIC(12,2) NOT NULL,
  frequency  TEXT NOT NULL DEFAULT 'monthly',
  due_day    INTEGER CHECK (due_day BETWEEN 1 AND 31),
  autopay    BOOLEAN NOT NULL DEFAULT false,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  room         TEXT,
  description  TEXT,
  estimate     NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_cost  NUMERIC(12,2),
  priority     INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  status       TEXT NOT NULL DEFAULT 'idea',
  target_start DATE,
  target_end   DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deposits are positive, withdrawals (spending) are negative.
CREATE TABLE IF NOT EXISTS fund_transactions (
  id         SERIAL PRIMARY KEY,
  tx_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  amount     NUMERIC(12,2) NOT NULL,
  note       TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES ('monthly_fund_contribution', '0')
ON CONFLICT (key) DO NOTHING;
