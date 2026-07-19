begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
     and exists (
       select 1
       from public.app_admins aa
       where aa.user_id = (select auth.uid())
     );
$$;

create or replace function private.current_org_role(p_org_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select om.role
  from public.organization_members om
  where om.organization_id = p_org_id
    and om.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.can_manage_service(
  p_service_id text,
  p_allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_app_admin()
      or exists (
        select 1
        from public.services s
        join public.organization_members om
          on om.organization_id = s.org_id
        where s.id = p_service_id
          and om.user_id = (select auth.uid())
          and om.role = any (p_allowed_roles)
      );
$$;

revoke all on function private.is_app_admin() from public, anon, authenticated;
revoke all on function private.current_org_role(uuid) from public, anon, authenticated;
revoke all on function private.can_manage_service(text, text[]) from public, anon, authenticated;
grant execute on function private.is_app_admin() to anon, authenticated;
grant execute on function private.current_org_role(uuid) to authenticated;
grant execute on function private.can_manage_service(text, text[]) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_app_admin(); $$;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.current_org_role(target_org_id) is not null; $$;

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.current_org_role(target_org_id) in ('owner', 'admin'); $$;

create or replace function public.can_manage_org_services(target_org_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.current_org_role(target_org_id) in ('owner', 'admin', 'editor'); $$;

create or replace function public.user_can_manage_service(user_uuid uuid, service_uuid text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select user_uuid = (select auth.uid())
     and private.can_manage_service(service_uuid, array['owner','admin','editor']::text[]);
$$;

create or replace function public.get_user_organization_id(user_uuid uuid)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when user_uuid = (select auth.uid()) then (
      select om.organization_id
      from public.organization_members om
      where om.user_id = (select auth.uid())
      limit 1
    )
    else null
  end;
$$;

create or replace function public.generate_invitation_token()
returns text
language sql
volatile
security invoker
set search_path = 'extensions'
as $$ select encode(gen_random_bytes(32), 'hex'); $$;

create or replace function private.enforce_org_member_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_actor_role text;
  v_service_role boolean := coalesce(
    current_setting('request.jwt.claim.role', true), ''
  ) = 'service_role';
begin
  if v_service_role or private.is_app_admin() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if tg_op = 'INSERT' then
    if current_setting('careconnect.invitation_acceptance', true) = 'on'
       and new.user_id = v_actor
       and new.role <> 'owner' then
      return new;
    end if;

    if new.role = 'owner'
       and new.user_id = v_actor
       and not exists (
         select 1 from public.organization_members om
         where om.organization_id = new.organization_id
       ) then
      return new;
    end if;

    v_actor_role := private.current_org_role(new.organization_id);
    if (v_actor_role = 'owner' and new.role in ('admin','editor','viewer'))
       or (v_actor_role = 'admin' and new.role in ('editor','viewer')) then
      return new;
    end if;

    raise exception using errcode = '42501', message = 'role assignment denied';
  end if;

  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
       or new.user_id is distinct from old.user_id then
      raise exception using errcode = '42501', message = 'membership identity is immutable';
    end if;

    if new.role is not distinct from old.role then
      return new;
    end if;

    if current_setting('careconnect.ownership_transfer', true) = 'on' then
      return new;
    end if;

    if new.user_id = v_actor or old.role = 'owner' or new.role = 'owner' then
      raise exception using errcode = '42501', message = 'ownership changes require transfer_ownership';
    end if;

    v_actor_role := private.current_org_role(old.organization_id);
    if (v_actor_role = 'owner' and new.role in ('admin','editor','viewer'))
       or (v_actor_role = 'admin'
           and old.role in ('editor','viewer')
           and new.role in ('editor','viewer')) then
      return new;
    end if;

    raise exception using errcode = '42501', message = 'role transition denied';
  end if;

  if old.user_id = v_actor or old.role = 'owner' then
    raise exception using errcode = '42501', message = 'member removal denied';
  end if;

  v_actor_role := private.current_org_role(old.organization_id);
  if v_actor_role = 'owner'
     or (v_actor_role = 'admin' and old.role in ('editor','viewer')) then
    return old;
  end if;

  raise exception using errcode = '42501', message = 'member removal denied';
end;
$$;

drop trigger if exists enforce_org_member_transition on public.organization_members;
create trigger enforce_org_member_transition
before insert or update or delete on public.organization_members
for each row execute function private.enforce_org_member_transition();

create unique index if not exists organization_members_one_owner_per_org_idx
on public.organization_members (organization_id)
where role = 'owner';

create or replace function public.accept_organization_invitation(invitation_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_actor_email text;
  v_invitation public.organization_invitations%rowtype;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  select lower(trim(u.email))
    into v_actor_email
  from auth.users u
  where u.id = v_actor
    and u.email_confirmed_at is not null;

  if v_actor_email is null then
    return jsonb_build_object('success', false, 'error', 'Verified email required');
  end if;

  select *
    into v_invitation
  from public.organization_invitations oi
  where oi.token = invitation_token
    and oi.accepted_at is null
    and oi.expires_at > now()
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  end if;

  if lower(trim(v_invitation.email)) <> v_actor_email then
    return jsonb_build_object('success', false, 'error', 'Invitation does not match this account');
  end if;

  if exists (
    select 1 from public.organization_members om
    where om.organization_id = v_invitation.organization_id
      and om.user_id = v_actor
  ) then
    return jsonb_build_object('success', false, 'error', 'Already a member of this organization');
  end if;

  perform set_config('careconnect.invitation_acceptance', 'on', true);

  insert into public.organization_members (
    organization_id, user_id, role, invited_by, invited_at, accepted_at
  ) values (
    v_invitation.organization_id, v_actor, v_invitation.role,
    v_invitation.invited_by, v_invitation.invited_at, now()
  );

  update public.organization_invitations
  set accepted_at = now(), accepted_by = v_actor
  where id = v_invitation.id and accepted_at is null;

  return jsonb_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id,
    'role', v_invitation.role
  );
end;
$$;

create or replace function public.transfer_ownership(
  p_org_id uuid,
  p_current_owner_id uuid,
  p_new_owner_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_owner_count integer;
begin
  if v_actor is null or p_current_owner_id is distinct from v_actor then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  if p_new_owner_id = v_actor then
    return jsonb_build_object('success', false, 'error', 'Cannot transfer ownership to yourself');
  end if;

  perform 1 from public.organizations o where o.id = p_org_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Organization not found');
  end if;

  perform 1
  from public.organization_members om
  where om.organization_id = p_org_id
    and om.user_id = v_actor
    and om.role = 'owner'
  for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Only the current owner may transfer ownership');
  end if;

  perform 1
  from public.organization_members om
  where om.organization_id = p_org_id
    and om.user_id = p_new_owner_id
  for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Target user is not a member');
  end if;

  perform set_config('careconnect.ownership_transfer', 'on', true);

  update public.organization_members
  set role = case
      when user_id = p_new_owner_id then 'owner'
      when user_id = v_actor then 'admin'
      else role
    end,
    updated_at = now()
  where organization_id = p_org_id
    and user_id in (v_actor, p_new_owner_id);

  select count(*) into v_owner_count
  from public.organization_members om
  where om.organization_id = p_org_id and om.role = 'owner';

  if v_owner_count <> 1 then
    raise exception 'ownership transfer invariant failed';
  end if;

  insert into public.audit_logs (
    performed_by, operation, table_name, record_id, metadata
  ) values (
    v_actor, 'UPDATE', 'organizations', p_org_id::text,
    jsonb_build_object(
      'action', 'transfer_ownership',
      'previous_owner', v_actor,
      'new_owner', p_new_owner_id
    )
  );

  return jsonb_build_object('success', true, 'message', 'Ownership transferred successfully');
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.soft_delete_service(service_uuid text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_deleted_at timestamptz;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  select s.org_id, s.deleted_at
    into v_org_id, v_deleted_at
  from public.services s
  where s.id = service_uuid
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Service not found');
  end if;

  if v_deleted_at is not null then
    return jsonb_build_object('success', false, 'error', 'Service already deleted');
  end if;

  if not private.is_app_admin()
     and private.current_org_role(v_org_id) not in ('owner','admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  perform set_config('careconnect.authorized_service_delete', 'on', true);

  update public.services
  set deleted_at = now(),
      deleted_by = (select auth.uid()),
      published = false,
      updated_at = now()
  where id = service_uuid;

  return jsonb_build_object('success', true, 'message', 'Service deleted successfully');
end;
$$;

create or replace function public.log_admin_action(
  p_action text,
  p_performed_by uuid,
  p_target_service_id text default null,
  p_target_count integer default null,
  p_details jsonb default null,
  p_ip_address inet default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_action_id uuid;
begin
  if v_actor is null or not private.is_app_admin() then
    raise exception using errcode = '42501', message = 'administrator authorization required';
  end if;

  if p_performed_by is distinct from v_actor then
    raise exception using errcode = '42501', message = 'audit actor mismatch';
  end if;

  if p_action is null or length(trim(p_action)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid action';
  end if;

  if p_target_count is not null and p_target_count < 0 then
    raise exception using errcode = '22023', message = 'invalid target count';
  end if;

  if pg_column_size(coalesce(p_details, '{}'::jsonb)) > 65536 then
    raise exception using errcode = '22023', message = 'details too large';
  end if;

  insert into public.admin_actions (
    action, performed_by, target_service_id, target_count, details, ip_address
  ) values (
    trim(p_action), v_actor, p_target_service_id, p_target_count, p_details, p_ip_address
  ) returning id into v_action_id;

  return v_action_id;
end;
$$;

drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
on public.audit_logs for select to authenticated
using ((select public.is_admin()));

revoke all on function public.accept_organization_invitation(text) from public, anon, authenticated;
revoke all on function public.transfer_ownership(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.soft_delete_service(text) from public, anon, authenticated;
revoke all on function public.log_admin_action(text, uuid, text, integer, jsonb, inet) from public, anon, authenticated;
revoke all on function public.generate_invitation_token() from public, anon, authenticated;
revoke all on function public.user_can_manage_service(uuid, text) from public, anon, authenticated;
revoke all on function public.get_user_organization_id(uuid) from public, anon, authenticated;

grant execute on function public.accept_organization_invitation(text) to authenticated;
grant execute on function public.transfer_ownership(uuid, uuid, uuid) to authenticated;
grant execute on function public.soft_delete_service(text) to authenticated;
grant execute on function public.log_admin_action(text, uuid, text, integer, jsonb, inet) to authenticated;
grant execute on function public.generate_invitation_token() to authenticated;
grant execute on function public.user_can_manage_service(uuid, text) to authenticated;
grant execute on function public.get_user_organization_id(uuid) to authenticated;

revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.is_org_member(uuid) from public, anon, authenticated;
revoke all on function public.is_org_admin(uuid) from public, anon, authenticated;
revoke all on function public.can_manage_org_services(uuid) from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.can_manage_org_services(uuid) to authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;

commit;
