-- Migration: Add Partner Terms Acceptance
-- Date: 2026-01-03
-- description: Adds table to track partner terms acceptance (click-wrap) coverage

create table if not exists partner_terms_acceptance (
  id uuid default gen_random_uuid() primary key,
  service_id text references services(id) on delete cascade not null,
  user_email text not null,
  accepted_version text not null default 'v1.0',
  accepted_at timestamptz default now() not null,
  ip_address text,
  user_agent text
);

-- RLS Policies
alter table partner_terms_acceptance enable row level security;

-- Only authenticated admins or system can insert (for now open for the public claim flow if using public role, but ideally authenticated)
create policy "Enable insert for public claim flow" on partner_terms_acceptance
  for insert with check (true);

-- Only admins can view
create policy "Enable select for admins" on partner_terms_acceptance
  for select using (auth.role() = 'service_role');
