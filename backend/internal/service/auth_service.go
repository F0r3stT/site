package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"sitecircuitworks/internal/domain"
	pgrepo "sitecircuitworks/internal/repository/postgres"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidRefresh     = errors.New("invalid refresh token")
)

type AuthService struct {
	users       *pgrepo.UserRepo
	refreshRepo *pgrepo.RefreshTokenRepo
	jwtSecret   string
	accessTTL   time.Duration
	refreshTTL  time.Duration
}

func NewAuthService(users *pgrepo.UserRepo, refreshRepo *pgrepo.RefreshTokenRepo, jwtSecret string) *AuthService {
	return &AuthService{
		users:       users,
		refreshRepo: refreshRepo,
		jwtSecret:   jwtSecret,
		accessTTL:   15 * time.Minute,
		refreshTTL:  7 * 24 * time.Hour,
	}
}

type RegisterInput struct {
	Email       string
	Password    string
	Role        domain.UserRole
	CompanyName string
	Country     string
	Phone       string
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*domain.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &domain.User{
		Email:        in.Email,
		PasswordHash: string(hash),
		Role:         in.Role,
		CompanyName:  in.CompanyName,
		Country:      in.Country,
		Phone:        in.Phone,
	}

	if err := s.users.Create(ctx, u); err != nil {
		return nil, err
	}

	// пароль наружу не отдаём
	u.PasswordHash = ""
	return u, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (accessToken, refreshToken string, user *domain.User, err error) {
	u, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return "", "", nil, err
	}

	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
		return "", "", nil, ErrInvalidCredentials
	}

	accessToken, err = s.generateToken(u.ID, string(u.Role), "access", s.accessTTL)
	if err != nil {
		return "", "", nil, err
	}

	refreshToken, err = s.generateToken(u.ID, string(u.Role), "refresh", s.refreshTTL)
	if err != nil {
		return "", "", nil, err
	}

	// сохраняем hash refresh токена в БД
	rtHash := hashToken(refreshToken)
	_ = s.refreshRepo.Save(ctx, u.ID, rtHash, time.Now().Add(s.refreshTTL))

	u.PasswordHash = ""
	return accessToken, refreshToken, u, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (newAccess string, err error) {
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return "", ErrInvalidRefresh
	}

	if claims["typ"] != "refresh" {
		return "", ErrInvalidRefresh
	}

	userID, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)
	if userID == "" || role == "" {
		return "", ErrInvalidRefresh
	}

	ok, err := s.refreshRepo.ExistsActive(ctx, userID, hashToken(refreshToken))
	if err != nil || !ok {
		return "", ErrInvalidRefresh
	}

	newAccess, err = s.generateToken(userID, role, "access", s.accessTTL)
	if err != nil {
		return "", err
	}
	return newAccess, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return ErrInvalidRefresh
	}
	userID, _ := claims["user_id"].(string)
	if userID == "" {
		return ErrInvalidRefresh
	}
	return s.refreshRepo.Revoke(ctx, userID, hashToken(refreshToken))
}

func (s *AuthService) generateToken(userID, role, typ string, ttl time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"typ":     typ,
		"exp":     time.Now().Add(ttl).Unix(),
		"iat":     time.Now().Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) parseToken(tok string) (jwt.MapClaims, error) {
	t, err := jwt.Parse(tok, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !t.Valid {
		return nil, ErrInvalidRefresh
	}
	claims, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidRefresh
	}
	return claims, nil
}

func hashToken(t string) string {
	h := sha256.Sum256([]byte(t))
	return hex.EncodeToString(h[:])
}
