package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var ErrRefreshNotFound = errors.New("refresh token not found")

type RefreshTokenRepo struct {
	db *sql.DB
}

func NewRefreshTokenRepo(db *sql.DB) *RefreshTokenRepo {
	return &RefreshTokenRepo{db: db}
}

func (r *RefreshTokenRepo) Save(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	const q = `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1,$2,$3)
		ON CONFLICT (user_id, token_hash) DO NOTHING;
	`
	_, err := r.db.ExecContext(ctx, q, userID, tokenHash, expiresAt)
	return err
}

func (r *RefreshTokenRepo) ExistsActive(ctx context.Context, userID, tokenHash string) (bool, error) {
	const q = `
		SELECT EXISTS(
			SELECT 1
			FROM refresh_tokens
			WHERE user_id = $1
			  AND token_hash = $2
			  AND revoked_at IS NULL
			  AND expires_at > now()
		);
	`
	var ok bool
	if err := r.db.QueryRowContext(ctx, q, userID, tokenHash).Scan(&ok); err != nil {
		return false, err
	}
	return ok, nil
}

func (r *RefreshTokenRepo) Revoke(ctx context.Context, userID, tokenHash string) error {
	const q = `
		UPDATE refresh_tokens
		SET revoked_at = now()
		WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL;
	`
	res, err := r.db.ExecContext(ctx, q, userID, tokenHash)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrRefreshNotFound
	}
	return nil
}
