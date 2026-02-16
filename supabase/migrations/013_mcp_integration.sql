-- Migration: 013_mcp_integration.sql
-- WhiteClaws MCP (Model Context Protocol) Server Integration
-- Tracks agents connecting via MCP-compatible clients (Claude Code, Cursor, etc.)

-- ═══════════════════════════════════════════════════════════════
-- MCP Connections Table
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mcp_connections (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_name      text,
    mcp_client_info jsonb DEFAULT '{}',
    wallet_address  text NOT NULL,
    first_connected timestamptz DEFAULT now(),
    last_heartbeat  timestamptz DEFAULT now(),
    total_tool_calls integer DEFAULT 0,
    created_at      timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_user ON mcp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_wallet ON mcp_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mcp_last_heartbeat ON mcp_connections(last_heartbeat DESC);

-- Comment for documentation
COMMENT ON TABLE mcp_connections IS 'Tracks MCP-connected agents for universal integration (Initiative 1)';
COMMENT ON COLUMN mcp_connections.mcp_client_info IS 'Stores client metadata: { client: "claude-code", version: "1.0", capabilities: [...] }';
COMMENT ON COLUMN mcp_connections.total_tool_calls IS 'Total number of MCP tool calls made by this connection';

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for mcp_connections
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE mcp_connections ENABLE ROW LEVEL SECURITY;

-- Users can read their own MCP connections
CREATE POLICY "Users can view own MCP connections"
    ON mcp_connections
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all MCP connections
CREATE POLICY "Service role full access to MCP connections"
    ON mcp_connections
    FOR ALL
    USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- Extend participation_events for MCP sources
-- ═══════════════════════════════════════════════════════════════
-- NOTE: No schema changes needed - we use existing metadata jsonb column
-- MCP events will store: { "source": "mcp", "client": "claude-code", "tool": "submit_finding" }

COMMENT ON COLUMN participation_events.metadata IS 'Event metadata including MCP source tracking: { source?: "mcp", client?: string, tool?: string, ... }';
