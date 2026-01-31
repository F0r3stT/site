package service

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"sitecircuitworks/internal/domain"
	"sitecircuitworks/internal/pkg/mailer"
	"sitecircuitworks/internal/pkg/utils"
	pgrepo "sitecircuitworks/internal/repository/postgres"

	"crypto/rand"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidRefresh     = errors.New("invalid refresh token")

	ErrOTPRequired        = errors.New("otp required")
	ErrOTPInvalid         = errors.New("invalid otp code")
	ErrOTPExpired         = errors.New("otp expired")
	ErrOTPConsumed        = errors.New("otp already used")
	ErrOTPTooManyAttempts = errors.New("too many otp attempts")
	ErrOTPResendTooSoon   = errors.New("otp resend too soon")
	ErrOTPResendLimit     = errors.New("otp resend limit reached")
	ErrOTPSendFailed      = errors.New("failed to send otp email")
)

type AuthService struct {
	users       *pgrepo.UserRepo
	refreshRepo *pgrepo.RefreshTokenRepo
	otpRepo     *pgrepo.LoginOTPRepo

	mail mailer.Mailer

	jwtSecret  string
	otpPepper  string
	otpEnabled bool

	accessTTL  time.Duration
	refreshTTL time.Duration

	otpTTL         time.Duration
	otpMaxAttempts int
	otpResendCD    time.Duration
	otpMaxSends    int
}

type OTPConfig struct {
	Enabled              bool
	TTLMinutes           int
	MaxAttempts          int
	ResendCooldownSecond int
	MaxSends             int
	Pepper               string
}

func NewAuthService(
	users *pgrepo.UserRepo,
	refreshRepo *pgrepo.RefreshTokenRepo,
	otpRepo *pgrepo.LoginOTPRepo,
	mailSvc mailer.Mailer,
	jwtSecret string,
	otpCfg OTPConfig,
) *AuthService {

	pepper := otpCfg.Pepper
	if pepper == "" {
		// fallback, но лучше отдельно в .env
		pepper = jwtSecret
	}

	return &AuthService{
		users:       users,
		refreshRepo: refreshRepo,
		otpRepo:     otpRepo,
		mail:        mailSvc,

		jwtSecret:  jwtSecret,
		otpPepper:  pepper,
		otpEnabled: otpCfg.Enabled,

		accessTTL:  15 * time.Minute,
		refreshTTL: 7 * 24 * time.Hour,

		otpTTL:         time.Duration(otpCfg.TTLMinutes) * time.Minute,
		otpMaxAttempts: otpCfg.MaxAttempts,
		otpResendCD:    time.Duration(otpCfg.ResendCooldownSecond) * time.Second,
		otpMaxSends:    otpCfg.MaxSends,
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

	u.PasswordHash = ""
	return u, nil
}

type LoginResult struct {
	MFARequired bool
	ChallengeID string
	ExpiresAt   time.Time

	AccessToken  string
	RefreshToken string
	User         *domain.User
}

// Login: если OTP включён → вернёт MFARequired=true и challenge_id.
// если OTP выключён → вернёт access/refresh как раньше.
func (s *AuthService) Login(ctx context.Context, email, password, ip, userAgent string) (LoginResult, error) {
	u, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return LoginResult{}, err
	}

	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
		return LoginResult{}, ErrInvalidCredentials
	}

	u.PasswordHash = ""

	if !s.otpEnabled {
		access, refresh, err := s.issueTokens(ctx, u.ID, string(u.Role))
		if err != nil {
			return LoginResult{}, err
		}
		return LoginResult{
			MFARequired:  false,
			AccessToken:  access,
			RefreshToken: refresh,
			User:         u,
		}, nil
	}

	if s.mail == nil {
		return LoginResult{}, ErrOTPSendFailed
	}

	// Инвалидируем старые активные challenges (важно, чтобы не путаться кодами)
	_ = s.otpRepo.ConsumeAllActiveByUser(ctx, u.ID)

	code, err := generate6Digits()
	if err != nil {
		return LoginResult{}, err
	}
	codeHash := s.hashOTP(code)

	ch := &domain.LoginOTPChallenge{
		ID:          utils.GenerateUUID(),
		UserID:      u.ID,
		CodeHash:    codeHash,
		ExpiresAt:   time.Now().Add(s.otpTTL),
		MaxAttempts: s.otpMaxAttempts,
		SendCount:   1,
		LastSentAt:  time.Now(),
		IPAddress:   ip,
		UserAgent:   userAgent,
	}

	if err := s.otpRepo.Create(ctx, ch); err != nil {
		return LoginResult{}, err
	}

	// Письмо отправляем после записи в БД; если не ушло — “сжигаем” challenge, чтобы не висел
	body := mailer.FormatLoginOTPBody(code, int(s.otpTTL.Minutes()))
	if err := s.mail.Send(u.Email, "Your CircuitWorks login code", body); err != nil {
		_ = s.otpRepo.Consume(ctx, ch.ID)
		return LoginResult{}, ErrOTPSendFailed
	}

	return LoginResult{
		MFARequired: true,
		ChallengeID: ch.ID,
		ExpiresAt:   ch.ExpiresAt,
		User:        u, // можно вернуть user чтобы фронт показал “куда отправили”
	}, nil
}

// VerifyLoginOTP: второй шаг — проверка кода и выдача токенов.
func (s *AuthService) VerifyLoginOTP(ctx context.Context, challengeID, code string) (accessToken, refreshToken string, user *domain.User, err error) {
	ch, err := s.otpRepo.GetByID(ctx, challengeID)
	if err != nil {
		return "", "", nil, err
	}

	if ch.ConsumedAt != nil {
		return "", "", nil, ErrOTPConsumed
	}
	if time.Now().After(ch.ExpiresAt) {
		_ = s.otpRepo.Consume(ctx, ch.ID)
		return "", "", nil, ErrOTPExpired
	}
	if ch.Attempts >= ch.MaxAttempts {
		_ = s.otpRepo.Consume(ctx, ch.ID)
		return "", "", nil, ErrOTPTooManyAttempts
	}

	inHash := s.hashOTP(code)
	if subtle.ConstantTimeCompare([]byte(inHash), []byte(ch.CodeHash)) != 1 {
		attempts, _ := s.otpRepo.IncrementAttempts(ctx, ch.ID)
		if attempts >= ch.MaxAttempts {
			_ = s.otpRepo.Consume(ctx, ch.ID)
			return "", "", nil, ErrOTPTooManyAttempts
		}
		return "", "", nil, ErrOTPInvalid
	}

	// Успех: consume, выдаём токены
	if err := s.otpRepo.Consume(ctx, ch.ID); err != nil {
		return "", "", nil, err
	}

	u, err := s.users.GetByID(ctx, ch.UserID)
	if err != nil {
		return "", "", nil, err
	}
	u.PasswordHash = ""

	accessToken, refreshToken, err = s.issueTokens(ctx, u.ID, string(u.Role))
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, u, nil
}

// ResendLoginOTP: переслать код (с cooldown и лимитом отправок).
func (s *AuthService) ResendLoginOTP(ctx context.Context, challengeID string) (time.Time, error) {
	if !s.otpEnabled {
		return time.Time{}, errors.New("otp disabled")
	}
	if s.mail == nil {
		return time.Time{}, ErrOTPSendFailed
	}

	ch, err := s.otpRepo.GetByID(ctx, challengeID)
	if err != nil {
		return time.Time{}, err
	}
	if ch.ConsumedAt != nil {
		return time.Time{}, ErrOTPConsumed
	}
	if ch.SendCount >= s.otpMaxSends {
		return time.Time{}, ErrOTPResendLimit
	}
	if time.Since(ch.LastSentAt) < s.otpResendCD {
		return time.Time{}, ErrOTPResendTooSoon
	}

	u, err := s.users.GetByID(ctx, ch.UserID)
	if err != nil {
		return time.Time{}, err
	}

	code, err := generate6Digits()
	if err != nil {
		return time.Time{}, err
	}

	newExpires := time.Now().Add(s.otpTTL)
	body := mailer.FormatLoginOTPBody(code, int(s.otpTTL.Minutes()))

	// Письмо сначала отправляем; если не отправилось — не “съедаем” лимит send_count
	if err := s.mail.Send(u.Email, "Your CircuitWorks login code (resend)", body); err != nil {
		return time.Time{}, ErrOTPSendFailed
	}

	// После успешной отправки обновляем challenge
	_, err = s.otpRepo.UpdateForResend(ctx, challengeID, s.hashOTP(code), newExpires, time.Now())
	if err != nil {
		return time.Time{}, err
	}

	return newExpires, nil
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

func (s *AuthService) issueTokens(ctx context.Context, userID, role string) (accessToken, refreshToken string, err error) {
	accessToken, err = s.generateToken(userID, role, "access", s.accessTTL)
	if err != nil {
		return "", "", err
	}
	refreshToken, err = s.generateToken(userID, role, "refresh", s.refreshTTL)
	if err != nil {
		return "", "", err
	}

	// сохраняем hash refresh токена в БД
	rtHash := hashToken(refreshToken)
	_ = s.refreshRepo.Save(ctx, userID, rtHash, time.Now().Add(s.refreshTTL))

	return accessToken, refreshToken, nil
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

func (s *AuthService) hashOTP(code string) string {
	sum := sha256.Sum256([]byte(fmt.Sprintf("%s:%s", code, s.otpPepper)))
	return hex.EncodeToString(sum[:])
}

func generate6Digits() (string, error) {
	// криптостойко: 4 байта -> uint32 -> mod 1e6
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	n := binary.BigEndian.Uint32(b) % 1000000
	return fmt.Sprintf("%06d", n), nil
}
