package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"sitecircuitworks/internal/repository/postgres"
	"sitecircuitworks/internal/service"

	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	users *service.UserService
}

func NewProfileHandler(users *service.UserService) *ProfileHandler {
	return &ProfileHandler{users: users}
}

func getUserID(c *gin.Context) (string, bool) {
	v, ok := c.Get("user_id")
	if !ok || v == nil {
		return "", false
	}
	switch t := v.(type) {
	case string:
		return t, true
	default:
		return fmt.Sprint(t), true
	}
}

func (h *ProfileHandler) GetProfile(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	u, err := h.users.GetProfile(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, postgres.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load profile"})
		return
	}

	c.JSON(http.StatusOK, u)
}

type UpdateProfileRequest struct {
	// поддерживаем snake_case и camelCase
	FirstName      string `json:"first_name"`
	FirstNameCamel string `json:"firstName"`

	LastName      string `json:"last_name"`
	LastNameCamel string `json:"lastName"`

	Phone string `json:"phone"`

	CompanyName      string `json:"company_name"`
	CompanyNameCamel string `json:"companyName"`

	Email string `json:"email"` // менять нельзя, но фронт может отправлять
}

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	first := strings.TrimSpace(req.FirstName)
	if first == "" {
		first = strings.TrimSpace(req.FirstNameCamel)
	}

	last := strings.TrimSpace(req.LastName)
	if last == "" {
		last = strings.TrimSpace(req.LastNameCamel)
	}

	company := strings.TrimSpace(req.CompanyName)
	if company == "" {
		company = strings.TrimSpace(req.CompanyNameCamel)
	}

	in := service.UpdateProfileInput{
		FirstName:   first,
		LastName:    last,
		CompanyName: company,
		Phone:       strings.TrimSpace(req.Phone),
		Email:       strings.TrimSpace(req.Email),
	}

	u, err := h.users.UpdateProfile(c.Request.Context(), userID, in)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFirstNameRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": "First name is required"})
			return
		case errors.Is(err, service.ErrEmailCannotBeChanged):
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email cannot be changed"})
			return
		case errors.Is(err, postgres.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}
	}

	c.JSON(http.StatusOK, u)
}

type ChangePasswordRequest struct {
	CurrentPassword      string `json:"current_password"`
	CurrentPasswordCamel string `json:"currentPassword"`

	NewPassword      string `json:"new_password"`
	NewPasswordCamel string `json:"newPassword"`

	ConfirmPassword      string `json:"confirm_password"`
	ConfirmPasswordCamel string `json:"confirmPassword"`
}

func (h *ProfileHandler) ChangePassword(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cur := req.CurrentPassword
	if strings.TrimSpace(cur) == "" {
		cur = req.CurrentPasswordCamel
	}

	newPass := req.NewPassword
	if strings.TrimSpace(newPass) == "" {
		newPass = req.NewPasswordCamel
	}

	confirm := req.ConfirmPassword
	if strings.TrimSpace(confirm) == "" {
		confirm = req.ConfirmPasswordCamel
	}

	if strings.TrimSpace(confirm) != "" && confirm != newPass {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Passwords do not match"})
		return
	}

	if strings.TrimSpace(cur) == "" || strings.TrimSpace(newPass) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "current_password and new_password are required"})
		return
	}

	err := h.users.ChangePassword(c.Request.Context(), userID, cur, newPass)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCurrentPassword):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid current password"})
			return
		case errors.Is(err, service.ErrPasswordTooShort):
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
			return
		case errors.Is(err, postgres.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change password"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}
