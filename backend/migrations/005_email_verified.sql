ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- Опционально:
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified_at timestamptz NULL;

-- Чтобы не заблокировать уже существующих юзеров в dev:
UPDATE users SET email_verified = true
WHERE email_verified = false;
