begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create or replace function public.bulk_update_service_status(
  p_service_ids text[],
  p_verification_status text default null,
  p_published boolean default null,
  p_admin_user_id uuid default null
)
returns table(updated_count integer, failed_ids text[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_unique_ids text[];
begin
  if v_actor is null or not private.is_app_admin() then
    raise exception using errcode = '42501', message = 'administrator authorization required';
  end if;

  if p_admin_user_id is not null and p_admin_user_id is distinct from v_actor then
    raise exception using errcode = '42501', message = 'review actor mismatch';
  end if;

  if p_service_ids is null
     or cardinality(p_service_ids) = 0
     or cardinality(p_service_ids) > 1000
     or array_position(p_service_ids, null) is not null then
    raise exception using errcode = '22023', message = 'service_ids must contain 1 to 1000 non-null values';
  end if;

  if p_verification_status is not null
     and p_verification_status not in ('L0', 'L1', 'L2', 'L3') then
    raise exception using errcode = '22023', message = 'invalid verification status';
  end if;

  if p_verification_status is null and p_published is null then
    raise exception using errcode = '22023', message = 'at least one update field is required';
  end if;

  select array_agg(x.service_id order by x.first_ordinal)
  into v_unique_ids
  from (
    select u.service_id, min(u.ordinality) as first_ordinal
    from unnest(p_service_ids) with ordinality as u(service_id, ordinality)
    group by u.service_id
  ) x;

  update public.services s
  set verification_status = coalesce(p_verification_status, s.verification_status),
      published = coalesce(p_published, s.published),
      reviewed_by = v_actor,
      last_admin_review = now(),
      updated_at = now()
  where s.id = any (v_unique_ids);

  get diagnostics updated_count = row_count;

  select coalesce(array_agg(x.service_id order by x.ordinality), array[]::text[])
  into failed_ids
  from unnest(v_unique_ids) with ordinality as x(service_id, ordinality)
  where not exists (
    select 1 from public.services s where s.id = x.service_id
  );

  return next;
end;
$$;

create or replace function public.update_reindex_progress(
  p_progress_id uuid,
  p_processed_count integer,
  p_status text default 'running',
  p_error_message text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_updated integer;
begin
  if v_actor is null or not private.is_app_admin() then
    raise exception using errcode = '42501', message = 'administrator authorization required';
  end if;

  if p_progress_id is null or p_processed_count is null or p_processed_count < 0 then
    raise exception using errcode = '22023', message = 'invalid progress input';
  end if;

  if p_status is null or p_status not in ('running', 'complete', 'error', 'cancelled') then
    raise exception using errcode = '22023', message = 'invalid reindex status';
  end if;

  if length(coalesce(p_error_message, '')) > 8000 then
    raise exception using errcode = '22023', message = 'error message too large';
  end if;

  update public.reindex_progress rp
  set processed_count = p_processed_count,
      status = p_status,
      error_message = p_error_message,
      completed_at = case
        when p_status in ('complete', 'error', 'cancelled') then now()
        else rp.completed_at
      end,
      duration_seconds = case
        when p_status in ('complete', 'error', 'cancelled')
          then extract(epoch from (now() - rp.started_at))::integer
        else rp.duration_seconds
      end
  where rp.id = p_progress_id
    and rp.triggered_by = v_actor
    and rp.status = 'running';

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.bulk_update_service_status(text[], text, boolean, uuid)
  from public, anon, authenticated;
revoke all on function public.update_reindex_progress(uuid, integer, text, text)
  from public, anon, authenticated;

grant execute on function public.bulk_update_service_status(text[], text, boolean, uuid)
  to authenticated;
grant execute on function public.update_reindex_progress(uuid, integer, text, text)
  to authenticated;

commit;
