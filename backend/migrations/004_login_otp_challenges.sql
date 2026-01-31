CREATE TABLE IF NOT EXISTS login_otp_challenges (
  id           TEXT PRIMARY KEY,

  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  code_hash    TEXT NOT NULL,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ NULL,

  attempts     INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,

  send_count   INT NOT NULL DEFAULT 1,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  ip_address   TEXT NULL,
  user_agent   TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_otp_active_user
  ON login_otp_challenges(user_id)
  WHERE consumed_at IS NULL;
