package domain

import "time"

type User struct {
	ID    string   `json:"id"`
	Email string   `json:"email"`
	Role  UserRole `json:"role"`

	// Profile fields
	FirstName   string `json:"first_name,omitempty"`
	LastName    string `json:"last_name,omitempty"`
	CompanyName string `json:"company_name,omitempty"`
	Country     string `json:"country"`
	Phone       string `json:"phone,omitempty"`

	EmailVerified bool   `json:"email_verified"`
	PasswordHash  string `json:"-"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
