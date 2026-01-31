package config

import (
	"os"
	"strconv"
)

type Config struct {
	Env       string
	Port      string
	DB        DBConfig
	JWTSecret string
	S3Config  S3Config

	SMTP SMTPConfig
	OTP  OTPConfig
}

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type S3Config struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	Region    string
	UseSSL    bool
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

type OTPConfig struct {
	Enabled              bool
	TTLMinutes           int
	MaxAttempts          int
	ResendCooldownSecond int
	MaxSends             int
	Pepper               string
}

func Load() *Config {
	return &Config{
		Env:  getEnv("APP_ENV", "development"),
		Port: getEnv("PORT", "8080"),
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "pcb_marketplace"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		JWTSecret: getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		S3Config: S3Config{
			Endpoint:  getEnv("S3_ENDPOINT", ""),
			AccessKey: getEnv("S3_ACCESS_KEY", ""),
			SecretKey: getEnv("S3_SECRET_KEY", ""),
			Bucket:    getEnv("S3_BUCKET", "pcb-files"),
			Region:    getEnv("S3_REGION", "us-east-1"),
			UseSSL:    getEnvAsBool("S3_USE_SSL", true),
		},

		SMTP: SMTPConfig{
			Host:               getEnv("SMTP_HOST", ""),
			Port:               getEnvAsInt("SMTP_PORT", 587),
			User:               getEnv("SMTP_USER", ""),
			Pass:               getEnv("SMTP_PASS", ""),
			From:               getEnv("SMTP_FROM", ""),
			StartTLS:           getEnvAsBool("SMTP_STARTTLS", true),
			InsecureSkipVerify: getEnvAsBool("SMTP_INSECURE_SKIP_VERIFY", false),
		},

		OTP: OTPConfig{
			Enabled:              getEnvAsBool("OTP_ENABLED", false),
			TTLMinutes:           getEnvAsInt("OTP_TTL_MINUTES", 10),
			MaxAttempts:          getEnvAsInt("OTP_MAX_ATTEMPTS", 5),
			ResendCooldownSecond: getEnvAsInt("OTP_RESEND_COOLDOWN_SECONDS", 60),
			MaxSends:             getEnvAsInt("OTP_MAX_SENDS", 3),
			Pepper:               getEnv("OTP_PEPPER", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if n, err := strconv.Atoi(value); err == nil {
			return n
		}
	}
	return defaultValue
}
