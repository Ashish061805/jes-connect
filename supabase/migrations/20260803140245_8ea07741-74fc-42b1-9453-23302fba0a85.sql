
CREATE TYPE public.app_role AS ENUM ('main_admin','regional_admin');
CREATE TYPE public.membership_status AS ENUM ('active','expired','suspended','lifetime');
CREATE TYPE public.payment_type AS ENUM ('new_membership','renewal');
CREATE TYPE public.payment_method AS ENUM ('cash','upi','card','bank_transfer','cheque');
CREATE TYPE public.payment_status AS ENUM ('paid','pending','failed','refunded');

CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  city text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  member_counter bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  role public.app_role NOT NULL DEFAULT 'regional_admin',
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_number text UNIQUE,
  full_name text NOT NULL,
  father_name text,
  mother_name text,
  mobile text NOT NULL,
  alternate_mobile text,
  gender text,
  dob date,
  occupation text,
  blood_group text,
  aadhaar_number text,
  address text,
  photo_url text,
  region_id uuid NOT NULL REFERENCES public.regions(id),
  created_by_admin_id uuid REFERENCES public.admins(id),
  current_admin_id uuid REFERENCES public.admins(id),
  joining_date date NOT NULL DEFAULT current_date,
  membership_status public.membership_status NOT NULL DEFAULT 'active',
  membership_start_date date NOT NULL DEFAULT current_date,
  membership_expiry_date date,
  emergency_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX members_region_idx ON public.members(region_id);
CREATE INDEX members_current_admin_idx ON public.members(current_admin_id);
CREATE INDEX members_name_idx ON public.members(lower(full_name));
CREATE INDEX members_mobile_idx ON public.members(mobile);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  payment_type public.payment_type NOT NULL DEFAULT 'new_membership',
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  payment_status public.payment_status NOT NULL DEFAULT 'paid',
  transaction_id text,
  notes text,
  region_id uuid REFERENCES public.regions(id),
  collected_by_admin uuid REFERENCES public.admins(id),
  payment_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_member_idx ON public.payments(member_id);
CREATE INDEX payments_admin_idx ON public.payments(collected_by_admin);

CREATE TABLE public.membership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  action text NOT NULL,
  previous_expiry_date date,
  new_expiry_date date,
  duration_months integer,
  amount numeric(12,2),
  payment_id uuid REFERENCES public.payments(id),
  performed_by uuid REFERENCES public.admins(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX membership_history_member_idx ON public.membership_history(member_id);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admins(id),
  admin_name text,
  action text NOT NULL,
  description text,
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.regions TO authenticated;
GRANT ALL ON public.regions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
GRANT SELECT, INSERT ON public.membership_history TO authenticated;
GRANT ALL ON public.membership_history TO service_role;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

CREATE OR REPLACE FUNCTION public.is_main_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE id = _uid AND role = 'main_admin' AND is_active);
$$;

CREATE OR REPLACE FUNCTION public.is_active_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE id = _uid AND is_active);
$$;

CREATE OR REPLACE FUNCTION public.my_region(_uid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT region_id FROM public.admins WHERE id = _uid;
$$;

CREATE OR REPLACE FUNCTION public.can_access_member(_member_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_main_admin(auth.uid())
     OR EXISTS (SELECT 1 FROM public.members m WHERE m.id = _member_id AND m.current_admin_id = auth.uid() AND public.is_active_admin(auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER regions_updated BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER admins_updated BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER members_updated BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.assign_membership_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code text; v_next bigint;
BEGIN
  IF NEW.membership_number IS NOT NULL AND NEW.membership_number <> '' THEN RETURN NEW; END IF;
  UPDATE public.regions SET member_counter = member_counter + 1
    WHERE id = NEW.region_id RETURNING code, member_counter INTO v_code, v_next;
  IF v_code IS NULL THEN RAISE EXCEPTION 'Invalid region'; END IF;
  NEW.membership_number := 'JES-' || upper(v_code) || '-' || lpad(v_next::text, 6, '0');
  RETURN NEW;
END; $$;
CREATE TRIGGER members_membership_number BEFORE INSERT ON public.members FOR EACH ROW EXECUTE FUNCTION public.assign_membership_number();

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.admins;
  INSERT INTO public.admins (id, full_name, email, phone, role, region_id, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.email,''),
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN v_count = 0 THEN 'main_admin'::public.app_role
         WHEN NEW.raw_user_meta_data->>'role' = 'main_admin' THEN 'main_admin'::public.app_role
         ELSE 'regional_admin'::public.app_role END,
    NULLIF(NEW.raw_user_meta_data->>'region_id','')::uuid,
    true
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regions readable by admins" ON public.regions FOR SELECT TO authenticated USING (public.is_active_admin(auth.uid()));
CREATE POLICY "regions insert main admin" ON public.regions FOR INSERT TO authenticated WITH CHECK (public.is_main_admin(auth.uid()));
CREATE POLICY "regions update main admin" ON public.regions FOR UPDATE TO authenticated USING (public.is_main_admin(auth.uid())) WITH CHECK (public.is_main_admin(auth.uid()));

CREATE POLICY "admins read self" ON public.admins FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "admins read all main" ON public.admins FOR SELECT TO authenticated USING (public.is_main_admin(auth.uid()));
CREATE POLICY "admins update main" ON public.admins FOR UPDATE TO authenticated USING (public.is_main_admin(auth.uid())) WITH CHECK (public.is_main_admin(auth.uid()));

CREATE POLICY "members read main" ON public.members FOR SELECT TO authenticated USING (public.is_main_admin(auth.uid()));
CREATE POLICY "members read own" ON public.members FOR SELECT TO authenticated USING (public.is_active_admin(auth.uid()) AND current_admin_id = auth.uid());
CREATE POLICY "members insert" ON public.members FOR INSERT TO authenticated WITH CHECK (
  public.is_active_admin(auth.uid()) AND created_by_admin_id = auth.uid()
  AND (public.is_main_admin(auth.uid()) OR (current_admin_id = auth.uid() AND region_id = public.my_region(auth.uid())))
);
CREATE POLICY "members update main" ON public.members FOR UPDATE TO authenticated USING (public.is_main_admin(auth.uid())) WITH CHECK (public.is_main_admin(auth.uid()));
CREATE POLICY "members update own" ON public.members FOR UPDATE TO authenticated
  USING (public.is_active_admin(auth.uid()) AND current_admin_id = auth.uid())
  WITH CHECK (current_admin_id = auth.uid());

CREATE POLICY "payments read main" ON public.payments FOR SELECT TO authenticated USING (public.is_main_admin(auth.uid()));
CREATE POLICY "payments read own" ON public.payments FOR SELECT TO authenticated USING (public.is_active_admin(auth.uid()) AND collected_by_admin = auth.uid());
CREATE POLICY "payments insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (
  public.is_active_admin(auth.uid()) AND collected_by_admin = auth.uid() AND public.can_access_member(member_id)
);

CREATE POLICY "history read" ON public.membership_history FOR SELECT TO authenticated USING (public.can_access_member(member_id));
CREATE POLICY "history insert" ON public.membership_history FOR INSERT TO authenticated WITH CHECK (public.is_active_admin(auth.uid()) AND performed_by = auth.uid() AND public.can_access_member(member_id));

CREATE POLICY "audit read main" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_main_admin(auth.uid()));
CREATE POLICY "audit read own" ON public.audit_logs FOR SELECT TO authenticated USING (admin_id = auth.uid());
CREATE POLICY "audit insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (admin_id = auth.uid() AND public.is_active_admin(auth.uid()));

INSERT INTO public.regions (name, code, city, description) VALUES
  ('Kukatpally','KPHB','Hyderabad','Kukatpally zone'),
  ('Miyapur','MYP','Hyderabad','Miyapur zone'),
  ('Secunderabad','SEC','Hyderabad','Secunderabad zone'),
  ('LB Nagar','LBN','Hyderabad','LB Nagar zone'),
  ('Uppal','UPL','Hyderabad','Uppal zone');
