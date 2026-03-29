-- Enums
DO $$ BEGIN
    CREATE TYPE expense_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_step_status AS ENUM ('LOCKED', 'PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_rule_type AS ENUM ('PERCENTAGE', 'SPECIFIC_APPROVER', 'HYBRID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Approval Rules (admin configures per category)
CREATE TABLE IF NOT EXISTS approval_rules (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES companies(id),
  name                 VARCHAR(255) NOT NULL,
  category             VARCHAR(100) NOT NULL,  -- routing key
  is_manager_approver  BOOLEAN NOT NULL DEFAULT FALSE,
  rule_type            approval_rule_type NOT NULL DEFAULT 'PERCENTAGE',
  threshold_pct        DECIMAL(5,2),           -- e.g. 60.00
  key_approver_id      UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Ordered list of approvers for a rule (the template)
CREATE TABLE IF NOT EXISTS rule_approvers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_rule_id UUID NOT NULL REFERENCES approval_rules(id) ON DELETE CASCADE,
  approver_id      UUID NOT NULL REFERENCES users(id),
  sequence         INT NOT NULL,
  UNIQUE(approval_rule_id, sequence),
  UNIQUE(approval_rule_id, approver_id)
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id),
  submitted_by_id  UUID NOT NULL REFERENCES users(id),
  approval_rule_id UUID REFERENCES approval_rules(id),
  description      TEXT NOT NULL,
  category         VARCHAR(100) NOT NULL,
  date             DATE NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  currency         VARCHAR(10) NOT NULL,     -- as submitted
  amount_in_base   DECIMAL(12,2) NOT NULL,   -- converted at submission
  base_currency    VARCHAR(10) NOT NULL,
  exchange_rate    DECIMAL(20,8) NOT NULL,
  receipt_url      TEXT,
  status           expense_status NOT NULL DEFAULT 'DRAFT',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Steps (live instances per expense, created at submission)
CREATE TABLE IF NOT EXISTS approval_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id   UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  approver_id  UUID NOT NULL REFERENCES users(id),
  sequence     INT NOT NULL,
  status       approval_step_status NOT NULL DEFAULT 'LOCKED',
  comment      TEXT,
  acted_at     TIMESTAMPTZ,
  UNIQUE(expense_id, sequence)
);

-- Audit Log (immutable, append-only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES expenses(id),
  actor_id    UUID NOT NULL REFERENCES users(id),
  action      VARCHAR(50) NOT NULL,  -- 'SUBMITTED','APPROVED','REJECTED','AUTO_APPROVED'
  comment     TEXT,
  metadata    JSONB,                 -- rule evaluation details
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  expense_id  UUID REFERENCES expenses(id),
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Exchange Rate Cache
CREATE TABLE IF NOT EXISTS exchange_rates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base        VARCHAR(10) NOT NULL,
  target      VARCHAR(10) NOT NULL,
  rate        DECIMAL(20,8) NOT NULL,
  fetched_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base, target, fetched_at)
);

-- Indexes for hot paths
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON expenses(submitted_by_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_approval_steps_expense ON approval_steps(expense_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approver ON approval_steps(approver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
