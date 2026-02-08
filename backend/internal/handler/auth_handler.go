package handler

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"time"

	"sitecircuitworks/internal/domain"
	"sitecircuitworks/internal/repository/postgres"
	"sitecircuitworks/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	auth *service.AuthService
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

type RegisterRequest struct {
	Email       string          `json:"email" binding:"required,email"`
	Password    string          `json:"password" binding:"required,min=8"`
	Role        domain.UserRole `json:"role" binding:"required,oneof=customer factory dfm admin"`
	CompanyName string          `json:"company_name"`
	Country     string          `json:"country" binding:"required"`
	Phone       string          `json:"phone"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.auth.Register(c.Request.Context(), service.RegisterInput{
		Email:       req.Email,
		Password:    req.Password,
		Role:        req.Role,
		CompanyName: req.CompanyName,
		Country:     req.Country,
		Phone:       req.Phone,
	})
	if err != nil {
		if errors.Is(err, postgres.ErrEmailExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register"})
		return
	}

	if res.VerifyRequired {
		c.JSON(http.StatusAccepted, gin.H{
			"verify_required": true,
			"challenge_id":    res.ChallengeID,
			"expires_at":      res.ExpiresAt.Format(time.RFC3339),
			"user":            res.User,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    res.User,
	})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ip := c.ClientIP()
	ua := c.GetHeader("User-Agent")

	res, err := h.auth.Login(c.Request.Context(), req.Email, req.Password, ip, ua)
	if err != nil {
		log.Printf("LOGIN ERROR email=%s err=%v", req.Email, err)

		if errors.Is(err, service.ErrInvalidCredentials) ||
			errors.Is(err, postgres.ErrUserNotFound) ||
			errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		if errors.Is(err, service.ErrEmailNotVerified) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Email not verified"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Login failed"})
		return
	}
	// ✅ ВСЕГДА обычный ответ (без OTP)
	c.JSON(http.StatusOK, gin.H{
		"access_token":  res.AccessToken,
		"refresh_token": res.RefreshToken,
		"user":          res.User,
	})
}

type VerifyOTPRequest struct {
	ChallengeID string `json:"challenge_id" binding:"required"`
	Code        string `json:"code" binding:"required"`
}

func (h *AuthHandler) RegisterVerify(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	access, refresh, user, err := h.auth.VerifyRegisterOTP(c.Request.Context(), req.ChallengeID, req.Code)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrOTPInvalid),
			errors.Is(err, service.ErrOTPConsumed):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid code"})
			return
		case errors.Is(err, service.ErrOTPExpired):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Code expired"})
			return
		case errors.Is(err, service.ErrOTPTooManyAttempts):
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Too many attempts"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Verification failed"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  access,
		"refresh_token": refresh,
		"user":          user,
	})
}

type ResendOTPRequest struct {
	ChallengeID string `json:"challenge_id" binding:"required"`
}

func (h *AuthHandler) RegisterResend(c *gin.Context) {
	var req ResendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	expires, err := h.auth.ResendRegisterOTP(c.Request.Context(), req.ChallengeID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrOTPResendTooSoon):
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Resend too soon"})
			return
		case errors.Is(err, service.ErrOTPResendLimit):
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Resend limit reached"})
			return
		case errors.Is(err, service.ErrOTPSendFailed):
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Failed to send code"})
			return
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot resend"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Code resent",
		"expires_at": expires.Format(time.RFC3339),
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newAccess, err := h.auth.Refresh(c.Request.Context(), req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": newAccess,
		"message":      "Token refreshed successfully",
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.auth.Logout(c.Request.Context(), req.RefreshToken); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}
