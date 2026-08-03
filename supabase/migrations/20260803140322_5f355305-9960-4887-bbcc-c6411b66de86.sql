
CREATE POLICY "member photos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-photos' AND public.is_active_admin(auth.uid()));
CREATE POLICY "member photos insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'member-photos' AND public.is_active_admin(auth.uid()));
CREATE POLICY "member photos update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'member-photos' AND public.is_active_admin(auth.uid()))
  WITH CHECK (bucket_id = 'member-photos' AND public.is_active_admin(auth.uid()));
CREATE POLICY "member photos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'member-photos' AND public.is_main_admin(auth.uid()));
