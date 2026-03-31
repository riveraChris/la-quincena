-- ============================================
-- Add Q1/Q2 payment split to debts
-- Allows configuring how much to pay per quincena
-- q1_amount + q2_amount = monthly payment
-- ============================================

ALTER TABLE debts
  ADD COLUMN q1_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN q2_amount numeric NOT NULL DEFAULT 0;

-- ============================================
-- RPC: auto_create_quincena_expenses
-- Creates expense_items for debts configured
-- for this period that don't already exist
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_quincena_expenses(
  p_budget_id uuid,
  p_family_id uuid,
  p_period int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO expense_items (budget_id, name, amount, category, debt_id)
  SELECT
    p_budget_id,
    d.name,
    CASE WHEN p_period = 1 THEN -abs(d.q1_amount) ELSE -abs(d.q2_amount) END,
    CASE d.type
      WHEN 'fixed' THEN 'fixed'
      WHEN 'operational' THEN 'operational_card'
      WHEN 'installment_no_interest' THEN 'installment'
    END,
    d.id
  FROM debts d
  WHERE d.family_id = p_family_id
    AND d.status = 'active'
    AND CASE WHEN p_period = 1 THEN d.q1_amount > 0 ELSE d.q2_amount > 0 END
    AND NOT EXISTS (
      SELECT 1 FROM expense_items ei
      WHERE ei.budget_id = p_budget_id
        AND ei.debt_id = d.id
    );
END;
$$;
