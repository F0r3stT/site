package domain

type UserRole string
type OrderStatus string

const (
	StatusDraft     OrderStatus = "draft"
	StatusSubmitted OrderStatus = "submitted"
	StatusInReview  OrderStatus = "in_review"
	StatusAccepted  OrderStatus = "accepted"
	StatusRejected  OrderStatus = "rejected"
	StatusQuoted    OrderStatus = "quoted"
	StatusPaid      OrderStatus = "paid"
	StatusCompleted OrderStatus = "completed"
	StatusCancelled OrderStatus = "cancelled"
)
const (
	RoleCustomer UserRole = "customer"
	RoleFactory  UserRole = "factory"
	RoleDFM      UserRole = "dfm"
	RoleAdmin    UserRole = "admin"
)
