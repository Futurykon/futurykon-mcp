#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const MCP_EDGE_URL =
  process.env.FUTURYKON_MCP_URL ??
  'https://qqegucrcohiwhbhhwrjw.supabase.co/functions/v1/mcp';

// Public anon key — safe to embed, this is a project identifier not a secret.
// The real auth happens via the api_key in the request body (validated server-side).
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZWd1Y3Jjb2hpd2hiaGh3cmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTI5OTYsImV4cCI6MjA4NDAyODk5Nn0.jgsNXuxE_VbS3cCOBNHoCahoyztz_0YQWXRJ_v1syb0';

const API_KEY =
  process.env.FUTURYKON_API_KEY ??
  (() => {
    // Check CLI args: --api-key=xxx or --api-key xxx
    const idx = process.argv.findIndex((a) => a === '--api-key');
    if (idx !== -1) return process.argv[idx + 1];
    const flag = process.argv.find((a) => a.startsWith('--api-key='));
    if (flag) return flag.split('=')[1];
    return undefined;
  })();

if (!API_KEY) {
  console.error(
    'Error: Futurykon API key required.\n' +
    'Set FUTURYKON_API_KEY env var or pass --api-key=<key>',
  );
  process.exit(1);
}

async function callTool(tool: string, params: Record<string, unknown>) {
  const res = await fetch(MCP_EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ tool, params, api_key: API_KEY }),
  });
  const json = (await res.json()) as { data?: unknown; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.data;
}

const server = new McpServer({
  name: 'futurykon',
  version: '0.1.0',
});

// ── Read tools ────────────────────────────────────────────────────────────────

server.tool(
  'list_questions',
  'List Futurykon questions, optionally filtered by status and tag',
  {
    status: z.enum(['pending', 'yes', 'no']).optional().describe("Filter by resolution status"),
    tag: z.string().optional().describe('Filter by a single tag'),
  },
  async ({ status, tag }) => {
    const data = await callTool('list_questions', { status, tag });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'search_questions',
  'Full-text search questions by keyword and/or filters',
  {
    query: z.string().optional().describe('Text to search in title, description, resolution criteria'),
    tags: z.array(z.string()).optional().describe('Filter to questions with all these tags'),
    status: z.enum(['pending', 'yes', 'no']).optional(),
    closing_before: z.string().optional().describe('ISO date — questions closing before this date'),
    closing_after: z.string().optional().describe('ISO date — questions closing after this date'),
    created_after: z.string().optional().describe('ISO date — questions created after this date'),
  },
  async (params) => {
    const data = await callTool('search_questions', params);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'get_question',
  'Get a single question by ID, including its community prediction',
  { id: z.string().describe('Question UUID') },
  async ({ id }) => {
    const data = await callTool('get_question', { id });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'get_my_predictions',
  'Get your latest prediction for each question you have predicted on',
  {},
  async () => {
    const data = await callTool('get_my_predictions', {});
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'get_leaderboard',
  'Get the Futurykon leaderboard ranked by average time-averaged log score',
  {},
  async () => {
    const data = await callTool('get_leaderboard', {});
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Write tools ───────────────────────────────────────────────────────────────

server.tool(
  'create_prediction',
  'Submit or update your probability prediction for a question (0–100)',
  {
    question_id: z.string().describe('Question UUID'),
    probability: z.number().int().min(0).max(100).describe('Probability as integer 0–100'),
    reasoning: z.string().optional().describe('Optional explanation for your prediction'),
  },
  async (params) => {
    const data = await callTool('create_prediction', params);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Admin tools ───────────────────────────────────────────────────────────────

server.tool(
  'create_question',
  'Create a new prediction question (admin only)',
  {
    title: z.string().describe('Question title'),
    resolution_criteria: z.string().describe('Exact criteria for resolving the question yes or no'),
    close_date: z.string().describe('ISO datetime after which no new predictions are accepted'),
    description: z.string().optional().describe('Optional longer description'),
    tags: z.array(z.string()).optional().describe('Tag names for the question'),
  },
  async (params) => {
    const data = await callTool('create_question', params);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'resolve_question',
  'Resolve a question as yes or no (admin only)',
  {
    id: z.string().describe('Question UUID'),
    outcome: z.enum(['yes', 'no']).describe('Resolution outcome'),
  },
  async ({ id, outcome }) => {
    const data = await callTool('resolve_question', { id, outcome });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'delete_question',
  'Permanently delete a question (admin only)',
  { id: z.string().describe('Question UUID') },
  async ({ id }) => {
    const data = await callTool('delete_question', { id });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
