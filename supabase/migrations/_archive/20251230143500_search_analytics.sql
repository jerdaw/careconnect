-- Create a privacy-preserving analytics table for search events
-- This table does NOT store the actual search query text
create table if not exists search_analytics (
  id uuid default gen_random_uuid() primary key,
  category text,                     -- 'Food', 'Crisis', etc.
  result_count_bucket text,          -- '0', '1-5', '5+'
  has_location boolean,              -- true if user used geo-location
  timestamp timestamptz default now()
);

-- Enable RLS
alter table search_analytics enable row level security;

-- Allow public insert (for anonymous users)
create policy "Allow public insert" 
on search_analytics for insert 
to anon
with check (true);

-- Allow authenticated insert
create policy "Allow authenticated insert" 
on search_analytics for insert 
to authenticated
with check (true);

-- Only admins can view analytics data
create policy "Allow admin select" 
on search_analytics for select 
to authenticated 
using (auth.jwt() ->> 'role' = 'service_role');
