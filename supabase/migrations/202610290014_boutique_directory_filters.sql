BEGIN;

-- Apply collection filters before the fixed directory page, without exposing
-- outfit details, private prices or boutique contact fields in directory rows.
CREATE OR REPLACE FUNCTION public.boutique_storefront(p_slug text DEFAULT NULL,p_page integer DEFAULT 1,p_kind text DEFAULT NULL,p_item uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE shop jsonb; vid uuid; client_access boolean:=public.wm_account_exists() AND public.is_user(auth.uid());
BEGIN
 IF p_page NOT BETWEEN 1 AND 1000 OR (p_kind IS NOT NULL AND p_kind NOT IN ('dress','suit')) THEN RAISE EXCEPTION 'Invalid page or category' USING ERRCODE='22023'; END IF;
 IF p_slug IS NULL THEN
  RETURN jsonb_build_object('items',coalesce((SELECT jsonb_agg(x.item) FROM (
   SELECT jsonb_build_object('vendor_id',v.id,'slug',v.slug,'name',v.business_name,'bio',v.bio,'hero_image',v.hero_image,
   'city',l.city,'region',l.region,'logo',v.logo_url) item FROM public.boutiques b JOIN public.vendors v ON v.id=b.vendor_id
   LEFT JOIN public.vendor_locations l ON l.vendor_id=v.id WHERE public.wm_boutique_public(v.id)
   AND (p_kind IS NULL OR EXISTS(SELECT 1 FROM public.boutique_items i WHERE i.vendor_id=v.id AND i.is_published AND i.kind=p_kind))
   ORDER BY v.business_name,v.id LIMIT 12 OFFSET (p_page-1)*12) x),'[]'::jsonb));
 END IF;
 SELECT v.id,to_jsonb(b)||jsonb_build_object('slug',v.slug,'name',v.business_name,'bio',v.bio,'hero_image',v.hero_image,
 'logo',v.logo_url,'city',l.city,'region',l.region,'languages',v.languages,
 'address',CASE WHEN client_access THEN v.address_label ELSE NULL END,'map_url',CASE WHEN client_access THEN v.map_url ELSE NULL END)
 INTO vid,shop FROM public.boutiques b JOIN public.vendors v ON v.id=b.vendor_id LEFT JOIN public.vendor_locations l ON l.vendor_id=v.id
 WHERE v.slug=p_slug AND public.wm_boutique_public(v.id);
 IF vid IS NULL THEN RETURN NULL; END IF;
 RETURN shop||jsonb_build_object('items',coalesce((SELECT jsonb_agg(x.item) FROM (
 SELECT to_jsonb(i)||jsonb_build_object('price_cents',CASE WHEN client_access THEN i.price_cents ELSE NULL END) item
 FROM public.boutique_items i WHERE i.vendor_id=vid AND i.is_published AND (p_kind IS NULL OR i.kind=p_kind) AND (p_item IS NULL OR i.id=p_item)
 ORDER BY i.updated_at DESC,i.id LIMIT 12 OFFSET (p_page-1)*12) x),'[]'::jsonb));
END $$;

NOTIFY pgrst,'reload schema';
COMMIT;
