-- ============================================
-- RPC: get_or_create_budget
-- Returns existing budget or creates a new one
-- SECURITY DEFINER bypasses RLS for the insert
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_budget(
  p_family_id uuid,
  p_year int,
  p_month int,
  p_period int
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  budget_id uuid;
BEGIN
  -- Check existing
  SELECT id INTO budget_id
  FROM budgets
  WHERE family_id = p_family_id
    AND year = p_year
    AND month = p_month
    AND period = p_period;

  IF budget_id IS NOT NULL THEN
    RETURN budget_id;
  END IF;

  -- Create new
  INSERT INTO budgets (family_id, year, month, period)
  VALUES (p_family_id, p_year, p_month, p_period)
  RETURNING id INTO budget_id;

  RETURN budget_id;
END;
$$;
