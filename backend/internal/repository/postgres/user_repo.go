package postgres

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"sitecircuitworks/internal/domain"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrEmailExists  = errors.New("email already exists")
	ErrInvalidRole  = errors.New("invalid role")
)

type UserRepo struct {
	db *sql.DB
}

func NewUserRepo(db *sql.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, u *domain.User) error {
	const q = `
		INSERT INTO users (email, password_hash, role, company_name, country, phone)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, created_at, updated_at;
	`

	err := r.db.QueryRowContext(ctx, q,
		u.Email, u.PasswordHash, string(u.Role), nullIfEmpty(u.CompanyName), u.Country, nullIfEmpty(u.Phone),
	).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)

	if err != nil {
		// грубо, но стабильно: ловим unique violation по тексту
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique") {
			return ErrEmailExists
		}
		return err
	}
	return nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	const q = `
		SELECT id, email, password_hash, role, company_name, country, phone, created_at, updated_at
		FROM users
		WHERE email = $1
		LIMIT 1;
	`
	u := &domain.User{}
	var role string
	var company sql.NullString
	var phone sql.NullString

	err := r.db.QueryRowContext(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &role, &company, &u.Country, &phone, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	u.Role = domain.UserRole(role)
	if company.Valid {
		u.CompanyName = company.String
	}
	if phone.Valid {
		u.Phone = phone.String
	}
	return u, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	const q = `
		SELECT id, email, password_hash, role, company_name, country, phone, created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1;
	`
	u := &domain.User{}
	var role string
	var company sql.NullString
	var phone sql.NullString

	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &role, &company, &u.Country, &phone, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	u.Role = domain.UserRole(role)
	if company.Valid {
		u.CompanyName = company.String
	}
	if phone.Valid {
		u.Phone = phone.String
	}
	return u, nil
}

func nullIfEmpty(s string) interface{} {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}

// опционально можно обновлять updated_at триггером, но пока так достаточно
func touchNow() time.Time { return time.Now().UTC() }
