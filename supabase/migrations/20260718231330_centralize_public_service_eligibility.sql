begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

drop policy if exists "Public can insert analytics for visible services"
on public.analytics_events;

drop view if exists public.services_public;

create view public.services_public
with (security_invoker = true, security_barrier = true)
as
select
  id, name, name_fr, description, description_fr,
  address, address_fr, phone, url, email,
  hours, fees, eligibility, application_process,
  languages, bus_routes, accessibility,
  last_verified, verification_status, category, tags,
  scope, virtual_delivery, primary_phone_label, created_at,
  authority_tier, resource_indicators,
  synthetic_queries, synthetic_queries_fr, coordinates, embedding,
  hours_text, hours_text_fr, eligibility_fr, application_process_fr,
  access_script, access_script_fr, primary_place_id, coverage
from public.services
where published is true
  and deleted_at is null
  and verification_status in ('L1','L2','L3')
  and last_verified >= now() - interval '180 days';

create policy "Public can insert analytics for visible services"
on public.analytics_events for insert to anon, authenticated
with check (
  event_type in ('view', 'view_detail', 'click_call', 'click_website')
  and service_id in (select id from public.services_public)
);

drop policy if exists "Unified view policy for services" on public.services;

create policy "Anonymous public service eligibility"
on public.services for select to anon
using (
  published is true
  and deleted_at is null
  and verification_status in ('L1','L2','L3')
  and last_verified >= now() - interval '180 days'
);

create policy "Authenticated service visibility"
on public.services for select to authenticated
using (
  (
    published is true
    and deleted_at is null
    and verification_status in ('L1','L2','L3')
    and last_verified >= now() - interval '180 days'
  )
  or (select public.is_admin())
  or (select public.is_org_member(org_id))
);

revoke all on table public.services from anon;
grant select (
  id, name, name_fr, description, description_fr,
  address, address_fr, phone, url, email,
  hours, fees, eligibility, application_process,
  languages, bus_routes, accessibility,
  last_verified, verification_status, category, tags,
  scope, virtual_delivery, primary_phone_label, created_at,
  authority_tier, resource_indicators,
  synthetic_queries, synthetic_queries_fr, coordinates, embedding,
  hours_text, hours_text_fr, eligibility_fr, application_process_fr,
  access_script, access_script_fr, primary_place_id, coverage,
  published, deleted_at
)
on table public.services to anon;

revoke all on table public.services_public from anon, authenticated;
grant select on table public.services_public to anon, authenticated;

revoke truncate, references, trigger on table public.services from authenticated;

notify pgrst, 'reload schema';
commit;
