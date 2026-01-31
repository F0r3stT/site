package mailer

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strings"
	"time"
)

type SMTPMailer struct {
	cfg SMTPConfig
}

func NewSMTPMailer(cfg SMTPConfig) (*SMTPMailer, error) {
	return &SMTPMailer{cfg: cfg}, nil
}

func (m *SMTPMailer) Send(to, subject, bodyText string) error {
	addr := fmt.Sprintf("%s:%d", m.cfg.Host, m.cfg.Port)

	// Заголовки письма
	msg := buildPlainMessage(m.cfg.From, to, subject, bodyText)

	// SMTP auth (может быть пустым, если локальный SMTP)
	var auth smtp.Auth
	if m.cfg.User != "" || m.cfg.Pass != "" {
		// host нужен именно домен (без порта)
		auth = smtp.PlainAuth("", m.cfg.User, m.cfg.Pass, m.cfg.Host)
	}

	// Вариант STARTTLS (обычно порт 587)
	if m.cfg.StartTLS {
		conn, err := net.DialTimeout("tcp", addr, 10*time.Second)
		if err != nil {
			return err
		}
		defer conn.Close()

		c, err := smtp.NewClient(conn, m.cfg.Host)
		if err != nil {
			return err
		}
		defer c.Quit()

		tlsCfg := &tls.Config{
			ServerName:         m.cfg.Host,
			InsecureSkipVerify: m.cfg.InsecureSkipVerify, // только если понимаешь риск
		}
		if err := c.StartTLS(tlsCfg); err != nil {
			return err
		}

		if auth != nil {
			if err := c.Auth(auth); err != nil {
				return err
			}
		}

		if err := c.Mail(extractEmail(m.cfg.From)); err != nil {
			return err
		}
		if err := c.Rcpt(to); err != nil {
			return err
		}

		w, err := c.Data()
		if err != nil {
			return err
		}
		if _, err := w.Write([]byte(msg)); err != nil {
			_ = w.Close()
			return err
		}
		return w.Close()
	}

	// Plain (без TLS) — только для локальных SMTP, dev
	return smtp.SendMail(addr, auth, extractEmail(m.cfg.From), []string{to}, []byte(msg))
}

func buildPlainMessage(from, to, subject, body string) string {
	// Важно: \r\n
	headers := []string{
		"From: " + from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=\"utf-8\"",
	}
	return strings.Join(headers, "\r\n") + "\r\n\r\n" + body + "\r\n"
}

func extractEmail(from string) string {
	// "Name <email@x.com>" -> email@x.com
	if i := strings.LastIndex(from, "<"); i != -1 {
		if j := strings.LastIndex(from, ">"); j != -1 && j > i {
			return strings.TrimSpace(from[i+1 : j])
		}
	}
	return strings.TrimSpace(from)
}
