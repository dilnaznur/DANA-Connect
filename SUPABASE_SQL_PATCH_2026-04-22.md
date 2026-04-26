set search_path = public;

alter table public.research_opportunities
add column if not exists contact_email text;

alter table public.research_opportunities
add column if not exists contact_telegram text;

update public.research_opportunities ro
set contact_email = p.email
from public.profiles p
where ro.mentor_id = p.id
and (ro.contact_email is null or btrim(ro.contact_email) = '');

update public.research_opportunities ro
set contact_telegram = p.phone
from public.profiles p
where ro.mentor_id = p.id
and (ro.contact_telegram is null or btrim(ro.contact_telegram) = '')
and p.phone is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'research_opportunities_contact_required'
  ) then
    execute $c$
alter table public.research_opportunities
add constraint research_opportunities_contact_required
check (
contact_email is not null and btrim(contact_email) <> ''
and contact_telegram is not null and btrim(contact_telegram) <> ''
) not valid;
$c$;
end if;
end $$;

alter table public.applications
add column if not exists cv_url text;

create extension if not exists pgcrypto;

create table if not exists public.projects (
id uuid default gen_random_uuid() primary key,
creator_id uuid references public.profiles(id) on delete cascade not null,
title text not null,
description text not null,
tags text[] default '{}'::text[],
contact_email text,
contact_telegram text,
deadline date,
max_members integer default 5 check (max_members >= 1),
filled_members integer default 1 check (filled_members >= 1),
is_open boolean default true,
created_at timestamptz default now(),
updated_at timestamptz default now()
);

alter table public.projects
add column if not exists contact_email text;

alter table public.projects
add column if not exists contact_telegram text;

create table if not exists public.project_requests (
id uuid default gen_random_uuid() primary key,
project_id uuid references public.projects(id) on delete cascade not null,
requester_id uuid references public.profiles(id) on delete cascade not null,
message text,
status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
created_at timestamptz default now(),
updated_at timestamptz default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='project_requests' and column_name='user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='project_requests' and column_name='requester_id'
  ) then
    execute 'alter table public.project_requests rename column user_id to requester_id';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_requests_project_id_requester_id_key'
  ) then
    execute 'alter table public.project_requests add constraint project_requests_project_id_requester_id_key unique (project_id, requester_id)';
  end if;
end $$;

update public.projects pr
set contact_email = p.email
from public.profiles p
where pr.creator_id = p.id
and (pr.contact_email is null or btrim(pr.contact_email) = '');

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_contact_required'
  ) then
    execute $c$
alter table public.projects
add constraint projects_contact_required
check (
contact_email is not null and btrim(contact_email) <> ''
and contact_telegram is not null and btrim(contact_telegram) <> ''
) not valid;
$c$;
end if;
end $$;

alter table public.projects enable row level security;
alter table public.project_requests enable row level security;

do $$
begin
if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='public_read_open_projects') then
execute 'create policy "public_read_open_projects" on public.projects for select using (is_open = true)';
end if;

if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='user_read_own_projects') then
execute 'create policy "user_read_own_projects" on public.projects for select using (creator_id = auth.uid())';
end if;

if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='auth_insert_projects') then
execute 'create policy "auth_insert_projects" on public.projects for insert with check (creator_id = auth.uid())';
end if;

if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='user_update_own_projects') then
execute 'create policy "user_update_own_projects" on public.projects for update using (creator_id = auth.uid())';
end if;

if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='user_delete_own_projects') then
execute 'create policy "user_delete_own_projects" on public.projects for delete using (creator_id = auth.uid())';
end if;
end $$;

do $$
begin
if not exists (select 1 from pg_policies where schemaname='public' and tablename='project_requests' and policyname='user_manage_own_requests') then
execute 'create policy "user_manage_own_requests" on public.project_requests for all using (requester_id = auth.uid())';
end if;

if not exists (select 1 from pg_policies where schemaname='public' and tablename='project_requests' and policyname='creator_read_requests') then
execute $p$
create policy "creator_read_requests" on public.project_requests
for select using (
project_id in (select id from public.projects where creator_id = auth.uid())
)
$p$;
end if;

if not exists (select 1 from pg_policies where schemaname='public' and tablename='project_requests' and policyname='creator_update_requests') then
execute $p$
create policy "creator_update_requests" on public.project_requests
for update using (
project_id in (select id from public.projects where creator_id = auth.uid())
)
$p$;
end if;
end $$;

create or replace function public.update_updated_at()
returns trigger as $$
begin
new.updated_at = now();
return new;
end;

$$
language plpgsql;

do
$$

begin
if not exists (
select 1 from pg_trigger
where tgname = 'projects_updated_at'
) then
execute 'create trigger projects_updated_at before update on public.projects for each row execute function public.update_updated_at()';
end if;

if not exists (
select 1 from pg_trigger
where tgname = 'project_requests_updated_at'
) then
execute 'create trigger project_requests_updated_at before update on public.project_requests for each row execute function public.update_updated_at()';
end if;
end $$;
