CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  keychain_key TEXT,
  last_synced_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS usage_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id TEXT NOT NULL,
  snapshot_type TEXT NOT NULL,
  tokens_used INTEGER,
  tokens_limit INTEGER,
  cost_usd REAL,
  raw_json TEXT,
  captured_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS daily_spend (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id TEXT NOT NULL,
  date TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  UNIQUE(provider_id, date),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id TEXT NOT NULL,
  plan_name TEXT,
  cost_usd REAL,
  billing_cycle TEXT,
  next_reset_at INTEGER,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO providers (id, name, enabled, keychain_key) VALUES
  ('claude_web',  'Claude Web',    1, 'claude_web_session'),
  ('claude_code', 'Claude Code',   1, NULL),
  ('openai',      'OpenAI API',    1, 'openai_api_key'),
  ('openrouter',  'OpenRouter',    1, 'openrouter_api_key'),
  ('chatgpt_web', 'ChatGPT Web',   1, 'chatgpt_web_session');

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('icon_style', 'icon_only'),
  ('menu_bar_metric', 'total_cost'),
  ('show_time_remaining', 'false'),
  ('budget_alerts', 'true'),
  ('weekly_summary', 'false'),
  ('reset_reminder', 'false');
