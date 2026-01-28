package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"sitecircuitworks/internal/config"
	"sitecircuitworks/internal/domain"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	// Пока пустая структура для разработки
}

func NewOrderHandler(s3Cfg config.S3Config) *OrderHandler {
	return &OrderHandler{}
}

type CreateOrderRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
	PCBQuantity int    `json:"pcb_quantity" binding:"required,min=1"`
	PCBWidth    int    `json:"pcb_width" binding:"required,min=1"`
	PCBHeight   int    `json:"pcb_height" binding:"required,min=1"`
	LayerCount  int    `json:"layer_count" binding:"required,min=1,max=32"`
	Material    string `json:"material" binding:"required"`
	SMTRequired bool   `json:"smt_required"`
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Временно просто возвращаем успех без БД
	c.JSON(http.StatusCreated, gin.H{
		"id":      fmt.Sprintf("order-%d", time.Now().UnixNano()),
		"status":  domain.StatusDraft,
		"message": "Order created successfully",
		"data": gin.H{
			"title":        req.Title,
			"description":  req.Description,
			"pcb_quantity": req.PCBQuantity,
			"pcb_width":    req.PCBWidth,
			"pcb_height":   req.PCBHeight,
			"layer_count":  req.LayerCount,
			"material":     req.Material,
			"smt_required": req.SMTRequired,
			"customer_id":  userID,
			"created_at":   time.Now().Format(time.RFC3339),
		},
	})
}

func (h *OrderHandler) UploadOrderFile(c *gin.Context) {
	orderID := c.Param("id")
	userID := c.GetString("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Проверяем, что orderID не пустой
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID is required"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File upload required: " + err.Error()})
		return
	}
	defer file.Close()

	// Проверка типа файла
	ext := filepath.Ext(header.Filename)
	allowedTypes := map[string]bool{
		".zip": true, ".rar": true, ".7z": true,
		".gbr": true, ".ger": true, ".xlsx": true, ".csv": true, ".txt": true,
	}
	if !allowedTypes[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File type not allowed. Allowed: .zip, .rar, .7z, .gbr, .ger, .xlsx, .csv, .txt"})
		return
	}

	// Ограничение размера файла (50MB)
	if header.Size > 50*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Max 50MB"})
		return
	}

	// Вычисление SHA256
	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process file: " + err.Error()})
		return
	}
	fileHash := hex.EncodeToString(hasher.Sum(nil))

	// Сброс позиции файла
	if _, err := file.Seek(0, 0); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset file pointer: " + err.Error()})
		return
	}

	// Сохранение в локальную файловую систему
	uploadDir := fmt.Sprintf("./uploads/orders/%s", orderID)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory: " + err.Error()})
		return
	}

	filePath := fmt.Sprintf("%s/%s", uploadDir, header.Filename)
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file: " + err.Error()})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"file_id":  fmt.Sprintf("file-%d", time.Now().UnixNano()),
		"filename": header.Filename,
		"hash":     fileHash,
		"size":     header.Size,
		"path":     filePath,
		"order_id": orderID,
		"message":  "File uploaded successfully",
	})
}
