package main

import (
	"log"
	"net/http"
	"time"

	"sitecircuitworks/internal/config"
	"sitecircuitworks/internal/handler"
	"sitecircuitworks/internal/middleware"
	"sitecircuitworks/internal/pkg/database"
	"sitecircuitworks/internal/pkg/mailer"
	pgrepo "sitecircuitworks/internal/repository/postgres"
	"sitecircuitworks/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load env
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warning: .env file not found:", err)
	}

	cfg := config.Load()

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(
		gin.Recovery(),
		middleware.CORS(),
		middleware.Logger(),
	)

	// DB
	db, err := database.NewPostgres(database.DBConfig{
		Host: cfg.DB.Host, Port: cfg.DB.Port, User: cfg.DB.User,
		Password: cfg.DB.Password, DBName: cfg.DB.DBName, SSLMode: cfg.DB.SSLMode,
	})
	if err != nil {
		log.Fatal("❌ DB connection failed:", err)
	}
	defer db.Close()

	// Repos
	userRepo := pgrepo.NewUserRepo(db)
	refreshRepo := pgrepo.NewRefreshTokenRepo(db)
	otpRepo := pgrepo.NewLoginOTPRepo(db)
	// Profile / User service
	userSvc := service.NewUserService(userRepo)
	profileHandler := handler.NewProfileHandler(userSvc)

	orderRepo := pgrepo.NewOrderRepo(db)
	orderFileRepo := pgrepo.NewOrderFileRepo(db)

	// Mailer
	m, mailErr := mailer.NewFromSMTPConfig(mailer.SMTPConfig{
		Host:               cfg.SMTP.Host,
		Port:               cfg.SMTP.Port,
		User:               cfg.SMTP.User,
		Pass:               cfg.SMTP.Pass,
		From:               cfg.SMTP.From,
		StartTLS:           cfg.SMTP.StartTLS,
		InsecureSkipVerify: cfg.SMTP.InsecureSkipVerify,
	})
	if mailErr != nil {
		// В production — падаем, чтобы не “сломать” логин.
		if cfg.OTP.Enabled && cfg.Env == "production" {
			log.Fatal("OTP enabled but SMTP is not configured:", mailErr)
		}

		// В dev — фолбэк на консоль
		log.Println("SMTP not configured, using ConsoleMailer:", mailErr)
		m = &mailer.ConsoleMailer{}
	}

	// Services / Handlers
	authSvc := service.NewAuthService(
		userRepo,
		refreshRepo,
		otpRepo,
		m,
		cfg.JWTSecret,
		service.OTPConfig{
			Enabled:              cfg.OTP.Enabled,
			TTLMinutes:           cfg.OTP.TTLMinutes,
			MaxAttempts:          cfg.OTP.MaxAttempts,
			ResendCooldownSecond: cfg.OTP.ResendCooldownSecond,
			MaxSends:             cfg.OTP.MaxSends,
			Pepper:               cfg.OTP.Pepper,
		},
	)
	authHandler := handler.NewAuthHandler(authSvc)

	orderHandler := handler.NewOrderHandler(orderRepo, orderFileRepo)

	// Public routes
	api := router.Group("/api/v1")
	{
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/register/verify", authHandler.RegisterVerify)
		api.POST("/auth/register/resend", authHandler.RegisterResend)

		api.POST("/auth/refresh", authHandler.RefreshToken)
		api.POST("/auth/logout", authHandler.Logout)

		api.GET("/stats", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"active_orders":        154,
				"registered_factories": 23,
				"completed_projects":   892,
			})
		})
	}

	// Protected routes
	protected := api.Group("/")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	{
		protected.GET("/profile", profileHandler.GetProfile)
		protected.PUT("/profile", profileHandler.UpdateProfile)
		protected.POST("/profile/change-password", profileHandler.ChangePassword)

		protected.GET("/orders", orderHandler.ListOrders)
		protected.POST("/orders", orderHandler.CreateOrder)

		protected.DELETE("/orders/:id", orderHandler.DeleteOrder)

		protected.POST("/orders/:id/files", orderHandler.UploadOrderFile)
		protected.GET("/orders/:id/files", orderHandler.ListOrderFiles)
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

	// Static
	router.Static("/static", "./static")
	router.Static("/uploads", "./uploads")

	// Server
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

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("❌ Server failed:", err)
	}
}
