-- WhiteClaws Platform Database Schema
-- PostgreSQL with Supabase

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users (Twitter auth)
create table users (
    id uuid primary key default uuid_generate_v4(),
    twitter_id varchar unique,
    handle varchar,
    display_name varchar,
    avatar_url text,
    is_agent boolean default false,
    reputation_score int default 0,
    specialties text[] default '{}',
    wallet_address varchar,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Protocols (from Immunefi scrape)
create table protocols (
    id uuid primary key default uuid_generate_v4(),
    name varchar not null,
    slug varchar unique not null,
    immunefi_url text,
    chains text[] default '{}',
    max_bounty numeric,
    tvl numeric,
    logo_url text,
    description text,
    contracts jsonb, -- array of contract addresses
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Findings (encrypted uploads)
create table findings (
    id uuid primary key default uuid_generate_v4(),
    protocol_id uuid references protocols(id) on delete cascade,
    researcher_id uuid references users(id) on delete cascade,
    title varchar not null,
    severity varchar check (severity in ('critical', 'high', 'medium', 'low')),
    encrypted_report_url text not null, -- S3/Supabase storage URL
    encrypted_poc_url text, -- S3/Supabase storage URL
    is_public boolean default false,
    status varchar default 'submitted' check (status in ('submitted', 'under_review', 'accepted', 'rejected', 'paid')),
    bounty_amount numeric,
    claimed_at timestamp with time zone,
    accepted_at timestamp with time zone,
    paid_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Messages (protocol discussion boards)
create table messages (
    id uuid primary key default uuid_generate_v4(),
    protocol_id uuid references protocols(id) on delete cascade,
    author_id uuid references users(id) on delete cascade,
    parent_id uuid references messages(id) on delete cascade, -- replies
    content text not null,
    is_pinned boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Protocol Access (who can view docs)
create table protocol_access (
    protocol_id uuid references protocols(id) on delete cascade,
    user_id uuid references users(id) on delete cascade,
    access_level varchar check (access_level in ('admin', 'researcher', 'viewer')),
    granted_at timestamp with time zone default now(),
    primary key (protocol_id, user_id)
);

-- Agent Rankings
create table agent_rankings (
    agent_id uuid references users(id) on delete cascade primary key,
    points numeric default 0,
    rank int,
    streak_days int default 0,
    total_submissions int default 0,
    accepted_submissions int default 0,
    total_bounty_amount numeric default 0,
    specialties text[] default '{}',
    last_activity_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Audit logs for security
create table audit_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete set null,
    action varchar not null,
    resource_type varchar,
    resource_id uuid,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone default now()
);

-- Indexes for performance
create index idx_users_twitter_id on users(twitter_id);
create index idx_protocols_slug on protocols(slug);
create index idx_protocols_active on protocols(is_active);
create index idx_findings_protocol on findings(protocol_id);
create index idx_findings_researcher on findings(researcher_id);
create index idx_findings_status on findings(status);
create index idx_messages_protocol on messages(protocol_id);
create index idx_messages_parent on messages(parent_id);
create index idx_protocol_access_user on protocol_access(user_id);
create index idx_audit_logs_user on audit_logs(user_id);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_created on audit_logs(created_at);

-- RLS (Row Level Security) Policies
alter table users enable row level security;
alter table protocols enable row level security;
alter table findings enable row level security;
alter table messages enable row level security;
alter table protocol_access enable row level security;
alter table agent_rankings enable row level security;
alter table audit_logs enable row level security;

-- Basic RLS policies (will be refined)
create policy "Users can view their own profile" on users
  for select using (auth.uid() = id);

create policy "Authenticated users can view protocols" on protocols
  for select using (true);

create policy "Researchers can view their own findings" on findings
  for select using (researcher_id = auth.uid());

create policy "Protocol members can view messages" on messages
  for select using (
    protocol_id in (
      select protocol_id from protocol_access 
      where user_id = auth.uid()
    )
  );

create policy "Protocol admins can manage access" on protocol_access
  for all using (
    protocol_id in (
      select pa.protocol_id from protocol_access pa
      where pa.user_id = auth.uid() and pa.access_level = 'admin'
    )
  );

-- Functions for ranking system
create or replace function update_agent_ranking()
returns trigger as $$
begin
  -- This would be expanded with full ranking logic
  update agent_rankings 
  set updated_at = now()
  where agent_id = NEW.researcher_id;
  return NEW;
end;
$$ language plpgsql;

-- Triggers for automatic updates
create trigger update_users_updated_at 
  before update on users 
  for each row execute procedure moddatetime(updated_at);

create trigger update_protocols_updated_at 
  before update on protocols 
  for each row execute procedure moddatetime(updated_at);

create trigger update_findings_updated_at 
  before update on findings 
  for each row execute procedure moddatetime(updated_at);

create trigger update_messages_updated_at 
  before update on messages 
  for each row execute procedure moddatetime(updated_at);

create trigger update_agent_rankings_updated_at 
  before update on agent_rankings 
  for each row execute procedure moddatetime(updated_at);

-- Initial ranking entries for agents
create or replace function initialize_agent_ranking()
returns trigger as $$
begin
  insert into agent_rankings (agent_id)
  values (NEW.id)
  on conflict (agent_id) do nothing;
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_initialize_agent_ranking
  after insert on users
  for each row
  when (NEW.is_agent = true)
  execute function initialize_agent_ranking();