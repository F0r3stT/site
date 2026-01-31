package domain

import "time"

type LoginOTPChallenge struct {
	ID         string
	UserID     string
	CodeHash   string
	CreatedAt  time.Time
	ExpiresAt  time.Time
	ConsumedAt *time.Time

	Attempts    int
	MaxAttempts int

	SendCount  int
	LastSentAt time.Time

	IPAddress string
	UserAgent string
}
