package domain

import "time"

type User struct {
	ID           string   `json:"id"`
	Email        string   `json:"email"`
	Role         UserRole `json:"role"`
	CompanyName  string   `json:"company_name,omitempty"`
	Country      string   `json:"country"`
	Phone        string   `json:"phone,omitempty"`
	PasswordHash string   `json:"-"` // не отдаём наружу
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
