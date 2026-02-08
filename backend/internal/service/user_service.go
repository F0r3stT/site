package service

import (
	"context"
	"errors"
	"strings"

	"sitecircuitworks/internal/domain"
	pgrepo "sitecircuitworks/internal/repository/postgres"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailCannotBeChanged   = errors.New("email cannot be changed")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
	ErrPasswordTooShort       = errors.New("password must be at least 8 characters")
	ErrFirstNameRequired      = errors.New("first name is required")
)

type UserService struct {
	users *pgrepo.UserRepo
}

func NewUserService(users *pgrepo.UserRepo) *UserService {
	return &UserService{users: users}
}

func (s *UserService) GetProfile(ctx context.Context, userID string) (*domain.User, error) {
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	u.PasswordHash = ""
	return u, nil
}

type UpdateProfileInput struct {
	FirstName   string
	LastName    string
	CompanyName string
	Country     string
	Phone       string
	Email       string // если фронт отправляет read-only email — проверим совпадение
}

func (s *UserService) UpdateProfile(ctx context.Context, userID string, in UpdateProfileInput) (*domain.User, error) {
	in.FirstName = strings.TrimSpace(in.FirstName)
	in.LastName = strings.TrimSpace(in.LastName)

	if in.FirstName == "" {
		return nil, ErrFirstNameRequired
	}
	if in.Country == "" {
		return nil, errors.New("country is required")
	}

	if strings.TrimSpace(in.Email) != "" {
		cur, err := s.users.GetByID(ctx, userID)
		if err != nil {
			return nil, err
		}
		if strings.TrimSpace(in.Email) != cur.Email {
			return nil, ErrEmailCannotBeChanged
		}
	}

	u, err := s.users.UpdateProfile(ctx, userID, in.FirstName, in.LastName, in.CompanyName, in.Country, in.Phone)
	if err != nil {
		return nil, err
	}

	u.PasswordHash = ""
	return u, nil
}

func (s *UserService) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	newPassword = strings.TrimSpace(newPassword)
	if len(newPassword) < 8 {
		return ErrPasswordTooShort
	}

	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(currentPassword)) != nil {
		return ErrInvalidCurrentPassword
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.users.UpdatePasswordHash(ctx, userID, string(hash))
}
