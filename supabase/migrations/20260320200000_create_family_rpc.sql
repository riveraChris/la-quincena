-- ============================================
-- RPC: create_family_for_user
-- Called on first login when user has no family
-- SECURITY DEFINER bypasses RLS for the insert
-- ============================================

CREATE OR REPLACE FUNCTION create_family_for_user(family_name text, member_display_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_family_id uuid;
  existing_family_id uuid;
BEGIN
  -- If user already has a family, return it
  SELECT family_id INTO existing_family_id
  FROM family_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF existing_family_id IS NOT NULL THEN
    RETURN existing_family_id;
  END IF;

  -- Create family
  INSERT INTO families (name)
  VALUES (family_name)
  RETURNING id INTO new_family_id;

  -- Create family member as owner
  INSERT INTO family_members (family_id, user_id, display_name, role)
  VALUES (new_family_id, auth.uid(), member_display_name, 'owner');

  RETURN new_family_id;
END;
$$;
