begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create or replace function private.enforce_service_governance_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_content_changed boolean;
  v_claim_transition boolean;
begin
  if v_actor is null
     or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     or private.is_app_admin() then
    return new;
  end if;

  if new.org_id is distinct from old.org_id then
    v_claim_transition :=
      old.org_id is null
      and new.org_id is not null
      and private.current_org_role(new.org_id) in ('owner','admin','editor')
      and new.verification_status = 'L1'
      and new.last_verified between now() - interval '5 minutes' and now() + interval '1 minute'
      and (
        to_jsonb(new) - array['org_id', 'verification_status', 'last_verified', 'updated_at']
      ) is not distinct from (
        to_jsonb(old) - array['org_id', 'verification_status', 'last_verified', 'updated_at']
      );

    if not v_claim_transition then
      raise exception using errcode = '42501', message = 'service organization transition denied';
    end if;

    return new;
  end if;

  if current_setting('careconnect.authorized_service_delete', true) = 'on' then
    return new;
  end if;

  v_content_changed := row(
    new.name, new.name_fr, new.description, new.description_fr,
    new.address, new.address_fr, new.phone, new.url, new.email,
    new.hours, new.hours_text, new.hours_text_fr,
    new.fees, new.fees_fr, new.eligibility, new.eligibility_fr,
    new.application_process, new.application_process_fr,
    new.languages, new.bus_routes, new.accessibility,
    new.category, new.tags, new.scope, new.virtual_delivery,
    new.primary_phone_label, new.service_area, new.display_provenance,
    new.resource_indicators, new.coordinates, new.provenance,
    new.access_script, new.access_script_fr,
    new.primary_place_id, new.coverage
  ) is distinct from row(
    old.name, old.name_fr, old.description, old.description_fr,
    old.address, old.address_fr, old.phone, old.url, old.email,
    old.hours, old.hours_text, old.hours_text_fr,
    old.fees, old.fees_fr, old.eligibility, old.eligibility_fr,
    old.application_process, old.application_process_fr,
    old.languages, old.bus_routes, old.accessibility,
    old.category, old.tags, old.scope, old.virtual_delivery,
    old.primary_phone_label, old.service_area, old.display_provenance,
    old.resource_indicators, old.coordinates, old.provenance,
    old.access_script, old.access_script_fr,
    old.primary_place_id, old.coverage
  );

  if v_content_changed then
    new.published := false;
    new.verification_status := 'L0';
    new.last_verified := null;
    new.last_admin_review := null;
    new.reviewed_by := null;
    new.updated_at := now();
    return new;
  end if;

  if new.published is distinct from old.published
     or new.verification_status is distinct from old.verification_status
     or new.last_verified is distinct from old.last_verified
     or new.deleted_at is distinct from old.deleted_at
     or new.deleted_by is distinct from old.deleted_by
     or new.admin_notes is distinct from old.admin_notes
     or new.last_admin_review is distinct from old.last_admin_review
     or new.reviewed_by is distinct from old.reviewed_by then
    raise exception using errcode = '42501', message = 'governance fields require administrator review';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_service_governance_transition on public.services;
create trigger enforce_service_governance_transition
before update on public.services
for each row execute function private.enforce_service_governance_transition();

-- RLS and the governance trigger are ineffective unless the application roles
-- can reach the intended mutation paths. Keep reads separately constrained by
-- the Stage 2 column grants while enabling only the DML operations used by the
-- authenticated partner and trusted service clients.
drop policy if exists "Authenticated can claim eligible unowned services" on public.services;
create policy "Authenticated can claim eligible unowned services"
on public.services
for update
to authenticated
using (
  org_id is null
  and published is true
  and deleted_at is null
  and verification_status = 'L1'
  and last_verified >= now() - interval '180 days'
)
with check ((select public.can_manage_org_services(org_id)));

grant insert, update, delete on table public.services to authenticated, service_role;

commit;
