package main

import (
	"log"
	"net/http"
	"time"

	"sitecircuitworks/internal/config"
	"sitecircuitworks/internal/handler"
	"sitecircuitworks/internal/middleware"
	"sitecircuitworks/internal/pkg/database"
	"sitecircuitworks/internal/repository/postgres"
	pgrepo "sitecircuitworks/internal/repository/postgres"
	"sitecircuitworks/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Загрузка переменных окружения
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warning: .env file not found:", err)
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
	db, err := database.NewPostgres(database.DBConfig{
		Host: cfg.DB.Host, Port: cfg.DB.Port, User: cfg.DB.User,
		Password: cfg.DB.Password, DBName: cfg.DB.DBName, SSLMode: cfg.DB.SSLMode,
	})

	if err != nil {
		log.Fatal("❌ DB connection failed:", err)
	}
	defer db.Close()

	userRepo := pgrepo.NewUserRepo(db)
	refreshRepo := pgrepo.NewRefreshTokenRepo(db)
	authSvc := service.NewAuthService(userRepo, refreshRepo, cfg.JWTSecret)

	authHandler := handler.NewAuthHandler(authSvc)
	orderRepo := postgres.NewOrderRepo(db)
	orderHandler := handler.NewOrderHandler(orderRepo)

	// factoryHandler := handler.NewFactoryHandler() // пока закомментируем

	// Публичные маршруты
	api := router.Group("/api/v1")
	{
		// Аутентификация
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/refresh", authHandler.RefreshToken)
		api.POST("/auth/logout", authHandler.Logout)

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
		protected.GET("/orders", orderHandler.ListOrders)
		protected.POST("/orders", orderHandler.CreateOrder)

		// protected.GET("/orders/:id", orderHandler.GetOrder)
		// protected.PUT("/orders/:id/status", orderHandler.UpdateOrderStatus)
		protected.POST("/orders/:id/files", orderHandler.UploadOrderFile)

		// Для заводов (пока закомментируем)
		// protected.GET("/factory/orders", factoryHandler.ListAvailableOrders)

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
