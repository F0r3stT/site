package handler

import (
	"log"
	"net/http"
	"time"

	"sitecircuitworks/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	jwtSecret string
}

func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{
		jwtSecret: jwtSecret,
	}
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

	// Хеширование пароля
	_, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Режим разработки - просто логируем
	log.Printf("DEV MODE: User registered - Email: %s, Role: %s, Company: %s",
		req.Email, req.Role, req.CompanyName)

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user": gin.H{
			"email":   req.Email,
			"role":    req.Role,
			"company": req.CompanyName,
			"country": req.Country,
			"phone":   req.Phone,
		},
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

	// Тестовые учетные данные для разработки
	validCredentials := map[string]string{
		"customer@example.com": "password123",
		"factory@example.com":  "password123",
		"admin@example.com":    "password123",
		"dfm@example.com":      "password123",
	}

	// Проверка учетных данных
	expectedPassword, exists := validCredentials[req.Email]
	if !exists || req.Password != expectedPassword {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Определяем роль по email
	role := "customer"
	switch req.Email {
	case "factory@example.com":
		role = "factory"
	case "admin@example.com":
		role = "admin"
	case "dfm@example.com":
		role = "dfm"
	}

	// Генерация токенов
	accessToken, err := h.generateToken(req.Email, role, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	refreshToken, err := h.generateToken(req.Email, role, 7*24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user": gin.H{
			"id":      "user-" + req.Email, // временный ID
			"email":   req.Email,
			"role":    role,
			"company": "Demo Company",
		},
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

	// Декодируем refresh токен для получения данных пользователя
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userID, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)

	// Генерируем новый access токен
	newAccessToken, err := h.generateToken(userID, role, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": newAccessToken,
		"message":      "Token refreshed successfully",
	})
}

func (h *AuthHandler) generateToken(userID, role string, expiry time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(expiry).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}
