package mailer

import (
	"errors"
	"fmt"
	"log"
)

var ErrNotConfigured = errors.New("mailer not configured")

type Mailer interface {
	Send(to, subject, bodyText string) error
}

type ConsoleMailer struct{}

func (m *ConsoleMailer) Send(to, subject, bodyText string) error {
	log.Printf("[MAIL][console] to=%s subject=%s\n%s", to, subject, bodyText)
	return nil
}

type SMTPConfig struct {
	Host               string
	Port               int
	User               string
	Pass               string
	From               string
	StartTLS           bool
	InsecureSkipVerify bool
}

func NewFromSMTPConfig(cfg SMTPConfig) (Mailer, error) {
	if cfg.Host == "" || cfg.Port == 0 || cfg.From == "" {
		return nil, ErrNotConfigured
	}
	return NewSMTPMailer(cfg)
}

func FormatLoginOTPBody(code string, ttlMinutes int) string {
	return fmt.Sprintf(
		"Your CircuitWorks login code: %s\n\nThis code expires in %d minutes.\nIf you didn't request this, ignore this email.",
		code, ttlMinutes,
	)
}
