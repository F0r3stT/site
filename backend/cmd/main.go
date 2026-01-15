package main

import (
	"log"
	"net/http"
	"time"

	"sitecircuitworks/internal/config"
	"sitecircuitworks/internal/handler"
	"sitecircuitworks/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Загрузка переменных окружения
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Загрузка конфигурации
	cfg := config.Load()

	// Настройка режима Gin
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Создание роутера
	router := gin.New()
	router.Use(
		gin.Recovery(),
		middleware.CORS(),
		middleware.Logger(),
	)

	// Инициализация обработчиков
	// Используем упрощенные конструкторы без БД
	authHandler := handler.NewAuthHandler(cfg.JWTSecret)
	orderHandler := handler.NewOrderHandler(cfg.S3Config)
	// factoryHandler := handler.NewFactoryHandler() // пока закомментируем

	// Публичные маршруты
	api := router.Group("/api/v1")
	{
		// Аутентификация
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/refresh", authHandler.RefreshToken)

		// Публичная информация
		api.GET("/stats", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"active_orders":        154,
				"registered_factories": 23,
				"completed_projects":   892,
			})
		})
	}

	// Защищенные маршруты
	protected := api.Group("/")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	{
		// Заказы
		protected.POST("/orders", orderHandler.CreateOrder)
		// protected.GET("/orders", orderHandler.ListOrders) // пока закомментируем
		// protected.GET("/orders/:id", orderHandler.GetOrder)
		// protected.PUT("/orders/:id/status", orderHandler.UpdateOrderStatus)
		protected.POST("/orders/:id/files", orderHandler.UploadOrderFile)

		// Для заводов (пока закомментируем)
		// protected.GET("/factory/orders", factoryHandler.ListAvailableOrders)
		// protected.POST("/orders/:id/offer", factoryHandler.CreateOffer)
		// protected.PUT("/offers/:id/accept", factoryHandler.AcceptOffer)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().Unix(),
			"service":   "PCB Marketplace API",
			"version":   "1.0.0",
		})
	})

	// Статические файлы (для фронтенда, если нужно)
	router.Static("/static", "./static")

	// Serve frontend (опционально)
	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	// Настройка и запуск сервера
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("🚀 Server starting on http://localhost:%s", cfg.Port)
	log.Printf("📡 API available at http://localhost:%s/api/v1", cfg.Port)
	log.Printf("🏥 Health check at http://localhost:%s/health", cfg.Port)
	log.Printf("🔐 JWT Secret configured: %t", cfg.JWTSecret != "")

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("❌ Server failed:", err)
	}
}
