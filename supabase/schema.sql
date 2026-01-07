-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Organizations Table (Partner Agencies)
create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text, -- for auto-verification
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Services Table (Migrated from JSON)
create table services (
  id text primary key, -- Keeping original string IDs (e.g., "food-bank-project") for now
  name text not null,
  description text,
  address text,
  phone text,
  url text,
  email text,
  hours text,
  fees text,
  eligibility text,
  application_process text,
  languages text[], -- Array of strings
  bus_routes text[],
  accessibility jsonb, -- Storing the checks/wheelchair flags
  last_verified timestamp with time zone,
  verification_status text default 'unverified',
  
  -- French fields
  name_fr text,
  description_fr text,
  address_fr text,

  -- Relationships
  org_id uuid references organizations(id),
  
  -- Search & Filtering
  category text, -- intent_category
  tags jsonb, -- identity tags details
  embedding vector(384), -- For semantic search (matches OpenAI text-embedding-3-small or existing/local model)
  
  -- v13.0 Librarian Model
  published boolean default true,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Public Projection View (v13.0)
create or replace view services_public as
select
  id,
  name,
  name_fr,
  description,
  description_fr,
  address,
  address_fr,
  phone,
  url,
  email,
  hours,
  hours_text,
  hours_text_fr,
  fees,
  fees_fr,
  eligibility,
  eligibility_fr,
  application_process,
  application_process_fr,
  languages,
  bus_routes,
  accessibility,
  last_verified,
  verification_status,
  category,
  tags
from services
where 
  published = true 
  and verification_status != 'draft'
  and verification_status != 'archived';

-- Enable Row Level Security (RLS)
alter table organizations enable row level security;
alter table services enable row level security;

-- Policies
-- v13.0: Deny direct public access to services table
create policy "Authenticated can select services"
  on services for select
  to authenticated
  using ( true );

-- v13.0: Allow public access to the projection view
grant select on services_public to anon;
grant select on services_public to authenticated;

-- Only admins/partners can insert/update (To be refined with Auth)
create policy "Admins can insert services."
  on services for insert
  with check ( false ); -- Placeholder: locked down by default until Auth is ready

-- Analytics (Privacy-First: No IPs, No User IDs)
create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  service_id text references services(id) on delete cascade not null,
  event_type text not null, -- 'view_detail', 'click_website', 'click_call'
  created_at timestamptz default now() not null
);

-- Index for faster aggregation by service
create index idx_analytics_service_id on analytics_events(service_id);
create index idx_analytics_created_at on analytics_events(created_at);

-- RLS: Public can INSERT events, Partners can SELECT their own events
alter table analytics_events enable row level security;

create policy "Public can record views"
  on analytics_events for insert
  to anon, authenticated
  with check (true);

create policy "Partners can view their own service analytics"
  on analytics_events for select
  to authenticated
  using (
    exists (
      select 1 from services
      where services.id = analytics_events.service_id
      and services.org_id = auth.uid()
    )
  );

-- Function to get simple view counts (optional helper)
-- useful to avoid pulling all rows to client
create or replace function get_service_views(service_id_param text)
returns bigint
language sql
security definer
as $$
  select count(*) from analytics_events where service_id = service_id_param;
$$;
