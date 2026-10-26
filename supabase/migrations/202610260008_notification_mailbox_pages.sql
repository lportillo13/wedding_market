BEGIN;

-- Bounded mailbox transfer, including literal searches of structured notification data.
-- Invoker/RLS plus an explicit recipient predicate; never accepts another user's id.
CREATE FUNCTION public.list_notification_mailbox(p_scope text DEFAULT 'account', p_deleted boolean DEFAULT false,
  p_query text DEFAULT '', p_page integer DEFAULT 1)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
 WITH scoped AS MATERIALIZED (
  SELECT id,type,title,body,data,read_at,deleted_at,created_at,
    (coalesce(btrim(p_query),'')='' OR strpos(lower(concat_ws(' ',title,body,data::text)),lower(left(btrim(p_query),200)))>0) AS matches
  FROM public.notifications
  WHERE recipient_id=(SELECT auth.uid())
    AND type=ANY(CASE WHEN p_scope='vendor' THEN ARRAY['vendor_new_request','vendor_quote_accepted','thread_reply']
      WHEN p_scope='account' THEN ARRAY['quote_answered','thread_reply'] ELSE ARRAY[]::text[] END)
 ), counts AS (
  SELECT count(*) FILTER (WHERE (deleted_at IS NOT NULL)=coalesce(p_deleted,false) AND matches) AS total,
    count(*) FILTER (WHERE deleted_at IS NULL) AS active_count,
    count(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted_count,
    count(*) FILTER (WHERE deleted_at IS NULL AND read_at IS NULL AND matches) AS unread_count
  FROM scoped
 ), paging AS (
  SELECT *,least(greatest(coalesce(p_page,1),1),greatest(1,ceil(total/50.0)::integer)) AS page FROM counts
 ), selected AS (
  SELECT id,type,title,body,data,read_at,deleted_at,created_at FROM scoped
  WHERE (deleted_at IS NOT NULL)=coalesce(p_deleted,false) AND matches
  ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET (SELECT (page-1)::bigint*50 FROM paging)
 )
 SELECT jsonb_build_object('data',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.created_at DESC,s.id DESC) FROM selected s),'[]'::jsonb),
  'total',total,'activeCount',active_count,'deletedCount',deleted_count,'unreadCount',unread_count,'page',page,'pageSize',50) FROM paging;
$$;
REVOKE ALL ON FUNCTION public.list_notification_mailbox(text,boolean,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_notification_mailbox(text,boolean,text,integer) TO authenticated;

COMMIT;
