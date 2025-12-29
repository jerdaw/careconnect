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

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table organizations enable row level security;
alter table services enable row level security;

-- Policies (Draft)
-- Public can read all verified services
create policy "Public services are viewable by everyone."
  on services for select
  using ( true );

-- Only admins/partners can insert/update (To be refined with Auth)
create policy "Admins can insert services."
  on services for insert
  with check ( false ); -- Placeholder: locked down by default until Auth is ready
