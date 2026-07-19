begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.feedback
  add column if not exists description text;

drop policy if exists "Unified insert policy for feedback" on public.feedback;
create policy "Public feedback intake"
on public.feedback for insert to anon, authenticated
with check (
  status = 'pending'
  and resolved_at is null
  and resolved_by is null
  and feedback_type in ('helpful_yes','helpful_no','issue','not_found')
  and (message is null or length(message) <= 1000)
);

revoke all on table public.feedback from anon;
grant insert (service_id, feedback_type, description, message, category_searched)
on table public.feedback to anon;

revoke insert on table public.feedback from authenticated;
grant insert (service_id, feedback_type, description, message, category_searched)
on table public.feedback to authenticated;

revoke truncate, references, trigger on table public.feedback from authenticated;

revoke all on table public.feedback_aggregations from anon, authenticated;
revoke all on table public.mat_feedback_aggregations from anon, authenticated;
grant select on table public.feedback_aggregations to anon, authenticated;
grant select on table public.mat_feedback_aggregations to anon, authenticated;

revoke all on table public.unmet_needs_summary from anon, authenticated;
revoke all on table public.mat_unmet_needs_summary from anon, authenticated;
grant select on table public.unmet_needs_summary to anon, authenticated;
grant select on table public.mat_unmet_needs_summary to anon, authenticated;

commit;
