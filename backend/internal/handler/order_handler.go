package handler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"sitecircuitworks/internal/domain"
	"sitecircuitworks/internal/pkg/utils"
	"sitecircuitworks/internal/repository/postgres"

	"github.com/gin-gonic/gin"
)

type OrderRepository interface {
	ListByUser(userID string) ([]domain.Order, error)
	Create(ctx context.Context, userID string, o *domain.Order) error

	GetByIDForUser(ctx context.Context, orderID, userID string) (*domain.Order, error)
	DeleteByUser(ctx context.Context, orderID, userID string) error
	DeleteAny(ctx context.Context, orderID string) error
}

type OrderHandler struct {
	repo     OrderRepository
	fileRepo *postgres.OrderFileRepo
}

func NewOrderHandler(repo OrderRepository, fileRepo *postgres.OrderFileRepo) *OrderHandler {
	return &OrderHandler{repo: repo, fileRepo: fileRepo}
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

	order := domain.Order{
		ID:          utils.GenerateUUID(),
		Title:       req.Title,
		Description: req.Description,
		Status:      string(domain.StatusDraft),
		PCBQuantity: req.PCBQuantity,
		PCBWidth:    req.PCBWidth,
		PCBHeight:   req.PCBHeight,
		LayerCount:  req.LayerCount,
		SMTRequired: req.SMTRequired,
		Material:    req.Material,                    // см. пункт 2
		CreatedAt:   time.Now().Format(time.RFC3339), // можно перезаписать значением из БД
	}

	if err := h.repo.Create(c.Request.Context(), userID, &order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order"})
		return
	}

	// Лучше вернуть сам заказ — фронту проще получить order.id
	c.JSON(http.StatusCreated, order)
}
func (h *OrderHandler) ListOrders(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	orders, err := h.repo.ListByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load orders"})
		return
	}

	c.JSON(http.StatusOK, orders)
}

func (h *OrderHandler) ListOrderFiles(c *gin.Context) {
	orderID := c.Param("id")

	files, err := h.fileRepo.ListByOrder(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to load files"})
		return
	}

	c.JSON(200, files)

}

func (h *OrderHandler) UploadOrderFile(c *gin.Context) {
	orderID := c.Param("id")

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"error": "file required"})
		return
	}

	if file.Size > 50*1024*1024 {
		c.JSON(400, gin.H{"error": "file too large"})
		return
	}

	description := c.PostForm("description")
	fileType := c.PostForm("type")
	if fileType == "" {
		fileType = "other"
	}

	// 1) Создаём папку uploads/orders/<orderID>/
	dir := filepath.Join("uploads", "orders", orderID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		c.JSON(500, gin.H{"error": "cannot create upload dir"})
		return
	}

	// 2) Безопасное имя файла
	filename := filepath.Base(file.Filename)
	localPath := filepath.Join(dir, filename)

	// 3) Сохраняем multipart-файл на диск
	if err := c.SaveUploadedFile(file, localPath); err != nil {
		c.JSON(500, gin.H{"error": "cannot save file"})
		return
	}

	// 4) Считаем sha256 и размер из сохранённого файла
	f, err := os.Open(localPath)
	if err != nil {
		c.JSON(500, gin.H{"error": "cannot open saved file"})
		return
	}
	defer f.Close()

	hasher := sha256.New()
	n, err := io.Copy(hasher, f)
	if err != nil {
		c.JSON(500, gin.H{"error": "cannot hash file"})
		return
	}
	sha := hex.EncodeToString(hasher.Sum(nil))

	// 5) Пишем в БД (FileURL = URL для скачивания через /uploads/...)
	publicURL := "/" + filepath.ToSlash(localPath)

	orderFile := domain.OrderFile{
		ID:          utils.GenerateUUID(),
		OrderID:     orderID,
		Filename:    filename,
		FileType:    fileType,
		Description: description,
		FileURL:     publicURL,
		FileSize:    n,
		SHA256:      sha,
	}

	if err := h.fileRepo.Save(c.Request.Context(), &orderFile); err != nil {
		c.JSON(500, gin.H{"error": "db save failed", "details": err.Error()})
		return
	}

	c.JSON(201, orderFile)
}

func (h *OrderHandler) DeleteOrder(c *gin.Context) {
	orderID := c.Param("id")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order id required"})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	role := c.GetString("role")

	// admin can delete any order
	if role == "admin" {
		if err := h.repo.DeleteAny(c.Request.Context(), orderID); err != nil {
			if err == postgres.ErrOrderNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete order"})
			return
		}

		_ = os.RemoveAll(filepath.Join("uploads", "orders", orderID))
		c.Status(http.StatusNoContent)
		return
	}

	// customer: can delete only own draft orders
	order, err := h.repo.GetByIDForUser(c.Request.Context(), orderID, userID)
	if err != nil {
		if err == postgres.ErrOrderNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load order"})
		return
	}

	if order.Status != string(domain.StatusDraft) {
		c.JSON(http.StatusConflict, gin.H{"error": "only draft orders can be deleted"})
		return
	}

	if err := h.repo.DeleteByUser(c.Request.Context(), orderID, userID); err != nil {
		if err == postgres.ErrOrderNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete order"})
		return
	}

	_ = os.RemoveAll(filepath.Join("uploads", "orders", orderID))
	c.Status(http.StatusNoContent)
}
