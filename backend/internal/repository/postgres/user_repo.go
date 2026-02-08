package postgres

import (
	"context"
	"database/sql"
	"errors"
	"strings"

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

func nullIfEmpty(s string) interface{} {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}

func (r *UserRepo) Create(ctx context.Context, u *domain.User) error {
	// first_name/last_name имеют DEFAULT '', поэтому их можно не вставлять
	const q = `
		INSERT INTO users (email, password_hash, role, company_name, country, phone)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, created_at, updated_at;
	`

	err := r.db.QueryRowContext(ctx, q,
		u.Email,
		u.PasswordHash,
		string(u.Role),
		nullIfEmpty(u.CompanyName),
		u.Country,
		nullIfEmpty(u.Phone),
	).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique") {
			return ErrEmailExists
		}
		return err
	}

	return nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	const q = `
		SELECT id, email, password_hash, role,
		       first_name, last_name,
		       company_name, country, phone,
		       email_verified,
		       created_at, updated_at
		FROM users
		WHERE email = $1
		LIMIT 1;
	`

	u := &domain.User{}
	var role string
	var company sql.NullString
	var phone sql.NullString

	err := r.db.QueryRowContext(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &role,
		&u.FirstName, &u.LastName,
		&company, &u.Country, &phone,
		&u.EmailVerified,
		&u.CreatedAt, &u.UpdatedAt,
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
		SELECT id, email, password_hash, role,
		       first_name, last_name,
		       company_name, country, phone,
		       email_verified,
		       created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1;
	`

	u := &domain.User{}
	var role string
	var company sql.NullString
	var phone sql.NullString

	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &role,
		&u.FirstName, &u.LastName,
		&company, &u.Country, &phone,
		&u.EmailVerified,
		&u.CreatedAt, &u.UpdatedAt,
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

func (r *UserRepo) UpdateProfile(
	ctx context.Context,
	userID string,
	firstName string,
	lastName string,
	companyName string,
	country string,
	phone string,
) (*domain.User, error) {

	const q = `
		UPDATE users
		SET first_name = $2,
		    last_name = $3,
		    company_name = $4,
		    country = $5,
		    phone = $6,
		    updated_at = now()
		WHERE id = $1
		RETURNING id, email, password_hash, role,
		          first_name, last_name,
		          company_name, country, phone,
		          email_verified,
		          created_at, updated_at;
	`

	u := &domain.User{}
	var role string
	var company sql.NullString
	var ph sql.NullString

	err := r.db.QueryRowContext(ctx, q,
		userID,
		strings.TrimSpace(firstName),
		strings.TrimSpace(lastName),
		nullIfEmpty(companyName),
		strings.TrimSpace(country),
		nullIfEmpty(phone),
	).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &role,
		&u.FirstName, &u.LastName,
		&company, &u.Country, &ph,
		&u.EmailVerified,
		&u.CreatedAt, &u.UpdatedAt,
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
	if ph.Valid {
		u.Phone = ph.String
	}

	return u, nil
}

func (r *UserRepo) UpdatePasswordHash(ctx context.Context, userID, newHash string) error {
	const q = `
		UPDATE users
		SET password_hash = $2, updated_at = now()
		WHERE id = $1;
	`

	res, err := r.db.ExecContext(ctx, q, userID, newHash)
	if err != nil {
		return err
	}
	aff, _ := res.RowsAffected()
	if aff == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *UserRepo) MarkEmailVerified(ctx context.Context, userID string) error {
	const q = `
		UPDATE users
		SET email_verified = true, updated_at = now()
		WHERE id = $1;
	`
	_, err := r.db.ExecContext(ctx, q, userID)
	return err
}
