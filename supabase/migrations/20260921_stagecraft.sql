-- StageCraft multi-tenant schema
-- Run in Supabase SQL editor when connecting a hosted project.
-- Local workspace uses the same permission rules in src/lib/workspace.ts

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  account_type text not null check (account_type in ('artist', 'venue_owner', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  primary key (org_id, user_id)
);

create table if not exists public.plots (
  id uuid primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  act_name text not null default '',
  updated_at timestamptz not null default now(),
  project jsonb not null
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  artist_id uuid not null references public.profiles (id) on delete cascade,
  artist_name text not null,
  act_name text not null,
  event_name text not null default '',
  show_date text not null default '',
  submitted_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('submitted', 'accepted')),
  snapshot jsonb not null
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.plots enable row level security;
alter table public.submissions enable row level security;

create policy "profiles are self readable" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are self writable" on public.profiles
  for insert with check (auth.uid() = id);

create policy "org members can read their orgs" on public.organizations
  for select using (
    exists (
      select 1 from public.org_members
      where org_members.org_id = organizations.id
        and org_members.user_id = auth.uid()
    )
  );

create policy "venue owners can create orgs" on public.organizations
  for insert with check (auth.uid() = owner_id);

create policy "members can read memberships" on public.org_members
  for select using (user_id = auth.uid() or exists (
    select 1 from public.org_members mine
    where mine.org_id = org_members.org_id and mine.user_id = auth.uid()
  ));

create policy "owners can add staff" on public.org_members
  for insert with check (
    exists (
      select 1 from public.org_members
      where org_id = org_members.org_id and user_id = auth.uid() and role = 'owner'
    )
  );

create policy "artists manage own plots" on public.plots
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "artists insert own submissions" on public.submissions
  for insert with check (artist_id = auth.uid());

create policy "artists read own submissions" on public.submissions
  for select using (
    artist_id = auth.uid()
    or exists (
      select 1 from public.org_members
      where org_members.org_id = submissions.org_id
        and org_members.user_id = auth.uid()
    )
  );
