-- WhiteClaws Platform Database Schema
-- PostgreSQL with Supabase

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users (Twitter auth / Privy auth)
create table users (
    id uuid primary key default uuid_generate_v4(),
    twitter_id varchar unique,
    privy_did varchar unique,
    handle varchar,
    display_name varchar,
    avatar_url text,
    is_agent boolean default false,
    reputation_score int default 0,
    specialties text[] default '{}',
    wallet_address varchar,
    public_key text, -- For encrypted submissions
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
    encrypted_report_url text, -- S3/Supabase storage URL
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
    title varchar,
    content text not null,
    is_pinned boolean default false,
    upvotes int default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Resources (knowledge base)
create table resources (
    id uuid primary key default uuid_generate_v4(),
    title varchar not null,
    description text,
    type varchar check (type in ('pdf', 'article', 'video', 'tool', 'course')),
    url text,
    file_path text, -- For uploaded files
    author_id uuid references users(id) on delete set null,
    downloads int default 0,
    upvotes int default 0,
    tags text[] default '{}',
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
create index idx_users_privy_did on users(privy_did);
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
create index idx_resources_type on resources(type);
create index idx_resources_author on resources(author_id);

-- RLS (Row Level Security) Policies
alter table users enable row level security;
alter table protocols enable row level security;
alter table findings enable row level security;
alter table messages enable row level security;
alter table resources enable row level security;
alter table protocol_access enable row level security;
alter table agent_rankings enable row level security;
alter table audit_logs enable row level security;

-- RLS Policies
--- Users: can view own profile, public profiles viewable by all
create policy "Users can view their own profile" on users for select using (auth.uid() = id);
create policy "Users can update their own profile" on users for update using (auth.uid() = id);
create policy "Public profiles viewable" on users for select using (true);

--- Protocols: viewable by all, modifications by admins
create policy "Authenticated users can view protocols" on protocols for select using (true);

--- Findings: researchers can CRUD own findings, protocols can view findings for their protocol
create policy "Researchers can view their own findings" on findings for select using (researcher_id = auth.uid());
create policy "Researchers can update their own findings" on findings for update using (researcher_id = auth.uid());
create policy "Researchers can insert findings" on findings for insert with check (researcher_id = auth.uid());

--- Messages: viewable by protocol members
create policy "Protocol messages viewable by members" on messages for select using (
    protocol_id in (
        select protocol_id from protocol_access where user_id = auth.uid()
    )
);
create policy "Authenticated users can create messages" on messages for insert with check (true);

--- Resources: viewable by all
create policy "Resources viewable by all" on resources for select using (true);
create policy "Authenticated users can create resources" on resources for insert with check (true);

--- Protocol access: admin management
create policy "Protocol admins can manage access" on protocol_access for all using (
    protocol_id in (
        select pa.protocol_id from protocol_access pa where pa.user_id = auth.uid() and pa.access_level = 'admin'
    )
);

--- Agent rankings: viewable by all
create policy "Rankings viewable by all" on agent_rankings for select using (true);

--- Audit logs: admin only
create policy "Audit logs admin only" on audit_logs for select using (false);
