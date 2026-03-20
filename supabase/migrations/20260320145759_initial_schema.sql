-- ============================================
-- La Quincena — Initial Schema
-- ============================================

-- Familia (unidad central compartida)
CREATE TABLE families (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Miembros de la familia (vincula auth.users con family)
CREATE TABLE family_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  color        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id)
);

-- Quincena (unidad de presupuesto)
CREATE TABLE budgets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  year       int NOT NULL,
  month      int NOT NULL CHECK (month BETWEEN 1 AND 12),
  period     int NOT NULL CHECK (period IN (1, 2)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, year, month, period)
);

-- Deudas activas
CREATE TABLE debts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name                    text NOT NULL,
  type                    text NOT NULL CHECK (type IN ('fixed', 'operational', 'installment_no_interest')),
  current_balance         numeric NOT NULL DEFAULT 0,
  our_minimum_payment     numeric NOT NULL DEFAULT 0,
  interest_free_deadline  date,
  is_auto_recalculate     boolean NOT NULL DEFAULT true,
  status                  text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off')),
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Ingresos de la quincena
CREATE TABLE incomes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id  uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  amount     numeric NOT NULL,
  type       text NOT NULL CHECK (type IN ('salary', 'bonus')),
  label      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Gastos / pagos de la quincena
CREATE TABLE expense_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id  uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name       text NOT NULL,
  amount     numeric NOT NULL,
  category   text NOT NULL CHECK (category IN ('fixed', 'operational_card', 'installment')),
  debt_id    uuid REFERENCES debts(id) ON DELETE SET NULL,
  is_paid    boolean NOT NULL DEFAULT false,
  paid_at    timestamptz,
  paid_by    uuid REFERENCES family_members(id) ON DELETE SET NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Historial de pagos a deudas
CREATE TABLE debt_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id     uuid NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  budget_id   uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  amount      numeric NOT NULL,
  new_balance numeric NOT NULL,
  paid_at     timestamptz NOT NULL DEFAULT now()
);

-- Reglas de distribución por persona (los porcientos)
CREATE TABLE allocation_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE UNIQUE,
  debts_pct    numeric NOT NULL DEFAULT 0,
  expenses_pct numeric NOT NULL DEFAULT 0,
  savings_pct  numeric NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Ahorros por quincena
CREATE TABLE savings (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  amount    numeric NOT NULL,
  label     text
);

-- Subscripciones push (Web Push API)
CREATE TABLE push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_budgets_family_id ON budgets(family_id);
CREATE INDEX idx_incomes_budget_id ON incomes(budget_id);
CREATE INDEX idx_expense_items_budget_id ON expense_items(budget_id);
CREATE INDEX idx_debts_family_id ON debts(family_id);
CREATE INDEX idx_debt_payments_debt_id ON debt_payments(debt_id);

-- ============================================
-- Row Level Security
-- ============================================

-- Helper: get family_ids for current user
CREATE OR REPLACE FUNCTION get_my_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid();
$$;

-- families
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON families
  FOR ALL USING (id IN (SELECT get_my_family_ids()));

-- family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON family_members
  FOR ALL USING (family_id IN (SELECT get_my_family_ids()));

-- budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON budgets
  FOR ALL USING (family_id IN (SELECT get_my_family_ids()));

-- debts
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON debts
  FOR ALL USING (family_id IN (SELECT get_my_family_ids()));

-- incomes
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON incomes
  FOR ALL USING (
    budget_id IN (SELECT id FROM budgets WHERE family_id IN (SELECT get_my_family_ids()))
  );

-- expense_items
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON expense_items
  FOR ALL USING (
    budget_id IN (SELECT id FROM budgets WHERE family_id IN (SELECT get_my_family_ids()))
  );

-- debt_payments
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON debt_payments
  FOR ALL USING (
    debt_id IN (SELECT id FROM debts WHERE family_id IN (SELECT get_my_family_ids()))
  );

-- allocation_rules
ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON allocation_rules
  FOR ALL USING (
    member_id IN (SELECT id FROM family_members WHERE family_id IN (SELECT get_my_family_ids()))
  );

-- savings
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON savings
  FOR ALL USING (
    budget_id IN (SELECT id FROM budgets WHERE family_id IN (SELECT get_my_family_ids()))
  );

-- push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON push_subscriptions
  FOR ALL USING (
    member_id IN (SELECT id FROM family_members WHERE family_id IN (SELECT get_my_family_ids()))
  );

-- ============================================
-- Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE expense_items, debts, budgets;
