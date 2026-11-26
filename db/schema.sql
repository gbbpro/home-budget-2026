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

-- ---------- Savings & investments ----------

-- kind: savings, checking, money_market, cd, cash_other  (shown on Savings)
--       brokerage, retirement, hsa, crypto, invest_other (shown on Investments)
CREATE TABLE IF NOT EXISTS accounts (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  institution  TEXT,
  owner        TEXT,
  kind         TEXT NOT NULL DEFAULT 'savings',
  cash_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  apy          NUMERIC(6,3),
  goal         NUMERIC(14,2),
  notes        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS holdings (
  id               SERIAL PRIMARY KEY,
  account_id       INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol           TEXT NOT NULL,
  name             TEXT,
  shares           NUMERIC(18,6) NOT NULL DEFAULT 0,
  cost_basis       NUMERIC(14,2),
  price            NUMERIC(14,4),
  prev_close       NUMERIC(14,4),
  price_updated_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per day, written whenever balances or prices change. Powers the net worth trend.
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  snap_date   DATE PRIMARY KEY,
  savings     NUMERIC(14,2) NOT NULL,
  investments NUMERIC(14,2) NOT NULL
);
