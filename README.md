# futurykon-mcp

MCP server for [Futurykon](https://futurykon.pl) — connect AI agents (Claude, Cursor, etc.) to the Futurykon AI prediction platform.

## What it does

Exposes Futurykon as a set of MCP tools an agent can call:

| Tool | Who can use |
|---|---|
| `list_questions` | Everyone |
| `search_questions` | Everyone |
| `get_question` | Everyone |
| `get_my_predictions` | Everyone |
| `get_leaderboard` | Everyone |
| `create_prediction` | Everyone |
| `create_question` | Admins only |
| `resolve_question` | Admins only |
| `delete_question` | Admins only |

## Setup

### 1. Get an API key

Log in to [Futurykon](https://futurykon.pl), go to **Settings → Developer**, and generate an API key. Copy it — it's shown only once.

### 2. Configure Claude Desktop

Add to `claude_desktop_config.json` (find it via Claude Desktop → Settings → Developer):

```json
{
  "mcpServers": {
    "futurykon": {
      "command": "npx",
      "args": ["futurykon-mcp"],
      "env": {
        "FUTURYKON_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

Restart Claude Desktop. You'll see Futurykon tools available in the tool picker.

### 3. Configure Cursor

In `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "futurykon": {
      "command": "npx",
      "args": ["futurykon-mcp", "--api-key=<your-api-key>"]
    }
  }
}
```

## Usage examples

Once connected, you can ask your agent:

- *"What questions are closing this month?"*
- *"Add my prediction of 75% to the question about GPT-5"*
- *"Show me the current leaderboard"*
- *"Create a question: Will Claude 4 Opus score above 90% on MMLU by end of 2026?"*

## Environment variables

| Variable | Description |
|---|---|
| `FUTURYKON_API_KEY` | Your Futurykon API key (required) |
| `FUTURYKON_MCP_URL` | Override the Edge Function URL (optional, for self-hosted) |

## Development

```bash
npm install
npm run build
node dist/index.js --api-key=<your-key>
```
