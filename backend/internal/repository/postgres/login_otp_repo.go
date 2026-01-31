package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"sitecircuitworks/internal/domain"
)

var (
	ErrOTPNotFound = errors.New("otp challenge not found")
)

type LoginOTPRepo struct {
	db *sql.DB
}

func NewLoginOTPRepo(db *sql.DB) *LoginOTPRepo {
	return &LoginOTPRepo{db: db}
}

// Инвалидируем все активные challenges пользователя (чтобы не было 5 кодов одновременно)
func (r *LoginOTPRepo) ConsumeAllActiveByUser(ctx context.Context, userID string) error {
	const q = `
		UPDATE login_otp_challenges
		SET consumed_at = now()
		WHERE user_id = $1 AND consumed_at IS NULL AND expires_at > now();
	`
	_, err := r.db.ExecContext(ctx, q, userID)
	return err
}

func (r *LoginOTPRepo) Create(ctx context.Context, ch *domain.LoginOTPChallenge) error {
	const q = `
		INSERT INTO login_otp_challenges (
			id, user_id, code_hash, expires_at, max_attempts, send_count, last_sent_at, ip_address, user_agent
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING created_at;
	`
	return r.db.QueryRowContext(ctx, q,
		ch.ID, ch.UserID, ch.CodeHash, ch.ExpiresAt, ch.MaxAttempts, ch.SendCount, ch.LastSentAt, nullIfEmpty(ch.IPAddress), nullIfEmpty(ch.UserAgent),
	).Scan(&ch.CreatedAt)
}

func (r *LoginOTPRepo) GetByID(ctx context.Context, id string) (*domain.LoginOTPChallenge, error) {
	const q = `
		SELECT id, user_id, code_hash, created_at, expires_at, consumed_at,
		       attempts, max_attempts, send_count, last_sent_at, ip_address, user_agent
		FROM login_otp_challenges
		WHERE id = $1
		LIMIT 1;
	`
	var ch domain.LoginOTPChallenge
	var consumed sql.NullTime
	var ip sql.NullString
	var ua sql.NullString

	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&ch.ID, &ch.UserID, &ch.CodeHash, &ch.CreatedAt, &ch.ExpiresAt, &consumed,
		&ch.Attempts, &ch.MaxAttempts, &ch.SendCount, &ch.LastSentAt, &ip, &ua,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrOTPNotFound
		}
		return nil, err
	}

	if consumed.Valid {
		t := consumed.Time
		ch.ConsumedAt = &t
	}
	if ip.Valid {
		ch.IPAddress = ip.String
	}
	if ua.Valid {
		ch.UserAgent = ua.String
	}
	return &ch, nil
}

func (r *LoginOTPRepo) IncrementAttempts(ctx context.Context, id string) (int, error) {
	const q = `
		UPDATE login_otp_challenges
		SET attempts = attempts + 1
		WHERE id = $1
		RETURNING attempts;
	`
	var attempts int
	if err := r.db.QueryRowContext(ctx, q, id).Scan(&attempts); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrOTPNotFound
		}
		return 0, err
	}
	return attempts, nil
}

func (r *LoginOTPRepo) Consume(ctx context.Context, id string) error {
	const q = `
		UPDATE login_otp_challenges
		SET consumed_at = now()
		WHERE id = $1 AND consumed_at IS NULL;
	`
	res, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrOTPNotFound
	}
	return nil
}

func (r *LoginOTPRepo) UpdateForResend(ctx context.Context, id, newHash string, newExpires time.Time, newLastSent time.Time) (sendCount int, err error) {
	const q = `
		UPDATE login_otp_challenges
		SET code_hash = $2,
		    expires_at = $3,
		    send_count = send_count + 1,
		    last_sent_at = $4
		WHERE id = $1 AND consumed_at IS NULL
		RETURNING send_count;
	`
	if err := r.db.QueryRowContext(ctx, q, id, newHash, newExpires, newLastSent).Scan(&sendCount); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrOTPNotFound
		}
		return 0, err
	}
	return sendCount, nil
}
