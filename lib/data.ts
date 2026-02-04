import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

// Protocol queries
export async function getProtocols() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('protocols')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function getProtocolBySlug(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('protocols')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) throw error;
  return data;
}

// Agent queries
export async function getAgents() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_rankings')
    .select(`
      *,
      users!agent_id (
        handle,
        display_name,
        avatar_url,
        wallet_address
      )
    `)
    .order('points', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getAgentByHandle(handle: string) {
  const supabase = createClient();
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('handle', handle)
    .single();
  
  if (userError) throw userError;
  
  const { data: ranking, error: rankingError } = await supabase
    .from('agent_rankings')
    .select('*')
    .eq('agent_id', user.id)
    .single();
  
  if (rankingError) throw rankingError;
  
  return { ...user, ...ranking };
}

// Resource queries
export async function getResources() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      users!author_id (
        handle
      )
    `)
    .order('upvotes', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Message queries
export async function getMessages() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      users!author_id (
        handle,
        display_name,
        avatar_url
      ),
      protocols!protocol_id (
        name,
        slug
      )
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Finding queries (submissions)
export async function getFindings({ protocolId, researcherId }: { protocolId?: string; researcherId?: string } = {}) {
  const supabase = createClient();
  let query = supabase
    .from('findings')
    .select(`
      *,
      users!researcher_id (
        handle,
        display_name
      ),
      protocols!protocol_id (
        name,
        slug
      )
    `);
  
  if (protocolId) {
    query = query.eq('protocol_id', protocolId);
  }
  
  if (researcherId) {
    query = query.eq('researcher_id', researcherId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
