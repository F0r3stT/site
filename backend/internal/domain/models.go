package domain

import "time"

type UserRole string

const (
	RoleCustomer UserRole = "customer"
	RoleFactory  UserRole = "factory"
	RoleDFM      UserRole = "dfm"
	RoleAdmin    UserRole = "admin"
)

type OrderStatus string

const (
	StatusDraft        OrderStatus = "draft"
	StatusSubmitted    OrderStatus = "submitted"
	StatusInReview     OrderStatus = "in_review"
	StatusAccepted     OrderStatus = "accepted"
	StatusRejected     OrderStatus = "rejected"
	StatusQuoted       OrderStatus = "quoted"
	StatusPaid         OrderStatus = "paid"
	StatusInProduction OrderStatus = "in_production"
	StatusShipped      OrderStatus = "shipped"
	StatusCompleted    OrderStatus = "completed"
	StatusDisputed     OrderStatus = "disputed"
	StatusCancelled    OrderStatus = "cancelled"
)

// User - временная структура
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         UserRole  `json:"role"`
	CompanyName  string    `json:"company_name"`
	Country      string    `json:"country"`
	Phone        string    `json:"phone"`
	CreatedAt    time.Time `json:"created_at"`
}
