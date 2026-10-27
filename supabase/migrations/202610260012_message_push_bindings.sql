BEGIN;
ALTER TABLE public.user_push_tokens ADD COLUMN binding_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.user_push_tokens ADD COLUMN auth_session_id uuid;
ALTER TABLE public.user_push_tokens ADD COLUMN expires_at timestamptz;
ALTER TABLE public.user_push_tokens ADD COLUMN language text NOT NULL DEFAULT 'en' CHECK(language IN ('en','es'));
ALTER TABLE public.user_push_tokens ADD CONSTRAINT user_push_tokens_binding_unique UNIQUE(binding_id);
-- Legacy preview registrations have no session binding and are excluded from delivery.
-- Tokens are private device capabilities; only the scoped functions may register/revoke them.
REVOKE ALL ON public.user_push_tokens FROM anon,authenticated;

CREATE FUNCTION public.register_message_push_device(p_token text,p_platform text,p_device uuid DEFAULT NULL,p_language text DEFAULT 'en') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET lock_timeout='3s' AS $$
DECLARE uid uuid:=auth.uid(); sid uuid:=nullif(auth.jwt()->>'session_id','')::uuid;
 device uuid:=coalesce(p_device,gen_random_uuid()); deadline timestamptz; binding uuid;
BEGIN
 IF uid IS NULL OR sid IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND suspended_at IS NULL) THEN
  RAISE EXCEPTION 'Active account required' USING ERRCODE='42501';
 END IF;
 SELECT least(now()+interval '30 days',coalesce(s.not_after,'infinity'::timestamptz)) INTO deadline
  FROM auth.sessions s WHERE s.id=sid AND s.user_id=uid AND (s.not_after IS NULL OR s.not_after>now());
 IF deadline IS NULL THEN RAISE EXCEPTION 'Active session required' USING ERRCODE='42501'; END IF;
 IF length(p_token)>180 OR p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,160}\]$' OR p_platform NOT IN ('ios','android') OR p_language NOT IN ('en','es') THEN
  RAISE EXCEPTION 'Invalid device registration' USING ERRCODE='22023';
 END IF;
 IF NOT pg_try_advisory_xact_lock(hashtextextended(uid::text,73109)) THEN
  RAISE EXCEPTION 'Device registration busy' USING ERRCODE='55P03';
 END IF;
 UPDATE public.user_push_tokens SET is_active=false,updated_at=now()
  WHERE user_id=uid AND device_id=device::text AND token<>p_token AND is_active;
 INSERT INTO public.user_push_tokens(user_id,token,platform,device_id,is_active,last_seen_at,updated_at,auth_session_id,expires_at,language)
 VALUES(uid,p_token,p_platform,device::text,true,now(),now(),sid,deadline,p_language)
 ON CONFLICT(token) DO UPDATE SET
  binding_id=CASE WHEN user_push_tokens.user_id=uid AND user_push_tokens.auth_session_id=sid AND user_push_tokens.device_id=device::text AND user_push_tokens.is_active AND user_push_tokens.expires_at>now() THEN user_push_tokens.binding_id ELSE gen_random_uuid() END,
  user_id=uid,platform=p_platform,device_id=device::text,is_active=true,last_seen_at=now(),updated_at=now(),auth_session_id=sid,expires_at=deadline,language=p_language
 RETURNING binding_id INTO binding;
 -- Keep delivery work bounded even for accounts used on many old devices.
 UPDATE public.user_push_tokens SET is_active=false,updated_at=now() WHERE user_id=uid AND is_active AND binding_id<>binding AND id IN (
  SELECT id FROM public.user_push_tokens WHERE user_id=uid AND is_active AND binding_id<>binding ORDER BY last_seen_at DESC,id DESC OFFSET 9);
 RETURN jsonb_build_object('deviceId',device,'bindingId',binding,'expiresAt',deadline);
END $$;
REVOKE ALL ON FUNCTION public.register_message_push_device(text,text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_message_push_device(text,text,uuid,text) TO authenticated;

CREATE FUNCTION public.unregister_message_push_device(p_device uuid DEFAULT NULL,p_binding uuid DEFAULT NULL,p_token text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_device IS NOT NULL AND p_binding IS NOT NULL THEN
  UPDATE public.user_push_tokens SET is_active=false,updated_at=now()
   WHERE user_id=auth.uid() AND device_id=p_device::text AND binding_id=p_binding;
 ELSIF p_token IS NOT NULL AND length(p_token)<=180 THEN
  -- Compatibility for older previews: a stale session cannot revoke a newer binding.
  UPDATE public.user_push_tokens SET is_active=false,updated_at=now()
   WHERE user_id=auth.uid() AND token=p_token AND auth_session_id=nullif(auth.jwt()->>'session_id','')::uuid;
 ELSE RAISE EXCEPTION 'Device identity required' USING ERRCODE='22023'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.unregister_message_push_device(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.unregister_message_push_device(uuid,uuid,text) TO authenticated;

CREATE FUNCTION public.active_message_push_bindings(p_recipient uuid)
 RETURNS TABLE(token text,binding_id uuid,language text,expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT t.token,t.binding_id,t.language,t.expires_at FROM public.user_push_tokens t
 JOIN public.profiles p ON p.id=t.user_id AND p.suspended_at IS NULL
 JOIN auth.sessions s ON s.id=t.auth_session_id AND s.user_id=t.user_id AND (s.not_after IS NULL OR s.not_after>now())
 WHERE t.user_id=p_recipient AND t.is_active AND t.expires_at>now()
 ORDER BY t.last_seen_at DESC,t.id DESC LIMIT 10;
$$;
REVOKE ALL ON FUNCTION public.active_message_push_bindings(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.active_message_push_bindings(uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
