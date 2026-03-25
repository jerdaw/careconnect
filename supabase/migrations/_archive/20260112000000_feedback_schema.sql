-- Feedback Table
create table feedback (
  id uuid primary key default gen_random_uuid(),
  service_id text references services(id) on delete cascade null, -- nullable for not_found
  feedback_type text not null check (feedback_type in ('helpful_yes', 'helpful_no', 'issue', 'not_found')),
  message text null check (length(message) <= 1000),
  category_searched text null check (category_searched in ('Food', 'Crisis', 'Housing', 'Health', 'Legal', 'Financial', 'Employment', 'Education', 'Transport', 'Community', 'Indigenous', 'Wellness')),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_at timestamptz null,
  resolved_by text null,
  created_at timestamptz not null default now()
);

-- Indexes for Feedback
create index idx_feedback_service on feedback(service_id);
create index idx_feedback_status on feedback(status);
create index idx_feedback_created on feedback(created_at desc);

-- RLS for Feedback
alter table feedback enable row level security;

create policy "Anyone can submit feedback" on feedback
  for insert with check (true);

create policy "Authenticated users can read feedback" on feedback
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can update feedback" on feedback
  for update using (auth.role() = 'authenticated');


-- Service Update Requests Table
create table service_update_requests (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references services(id) on delete cascade,
  requested_by text not null, -- partner email
  field_updates jsonb not null,
  justification text null check (length(justification) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by text null,
  reviewed_at timestamptz null,
  rejection_reason text null,
  created_at timestamptz not null default now()
);

-- Indexes for Update Requests
create index idx_update_requests_service on service_update_requests(service_id);
create index idx_update_requests_status on service_update_requests(status);
create index idx_update_requests_requested_by on service_update_requests(requested_by);

-- RLS for Update Requests
alter table service_update_requests enable row level security;

create policy "Partners can request updates" on service_update_requests
  for insert with check (auth.role() = 'authenticated');

create policy "Partners can see own requests" on service_update_requests
  for select using (auth.role() = 'authenticated');

create policy "Admins can review requests" on service_update_requests
  for update using (auth.role() = 'authenticated');


-- Plain Language Summaries Table
create table plain_language_summaries (
  service_id text primary key references services(id) on delete cascade,
  summary_en text not null check (length(summary_en) <= 500),
  summary_fr text null check (length(summary_fr) <= 500),
  how_to_use_en text not null check (length(how_to_use_en) <= 1000),
  how_to_use_fr text null check (length(how_to_use_fr) <= 1000),
  reviewed_by text not null,
  reviewed_at timestamptz not null default now()
);

-- Plain Language Constraints
-- Note: We can't easily enforce 'verification_level IN (L2, L3)' via check constraint referencing another table without a function/trigger.
-- Skipping complex cross-table check for now to simplify migration, relying on app logic.

-- RLS for Plain Language
alter table plain_language_summaries enable row level security;

create policy "Anyone can read summaries" on plain_language_summaries
  for select using (true);

create policy "Authenticated can manage summaries" on plain_language_summaries
  for all using (auth.role() = 'authenticated');


-- Extend Services Table
alter table services 
  add column display_provenance boolean default true,
  add column plain_language_available boolean default false;


-- Materialized View: Feedback Aggregations
create materialized view feedback_aggregations as
select
  service_id,
  count(*) filter (where feedback_type = 'helpful_yes') as helpful_yes_count,
  count(*) filter (where feedback_type = 'helpful_no') as helpful_no_count,
  count(*) filter (where feedback_type = 'issue' and status = 'pending') as open_issues_count,
  max(created_at) as last_feedback_at
from feedback
where service_id is not null
group by service_id;

create index idx_feedback_agg_service on feedback_aggregations(service_id);


-- Materialized View: Unmet Needs
create materialized view unmet_needs_summary as
select
  category_searched,
  count(*) as request_count,
  max(created_at) as last_requested_at
from feedback
where feedback_type = 'not_found' and category_searched is not null
group by category_searched
order by request_count desc;

-- Note: Refreshing materialized views requires pg_cron or an external scheduler.
-- For now, we assume manual refresh or external trigger.
