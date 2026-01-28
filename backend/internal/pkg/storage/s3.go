package storage

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

// S3Config содержит конфигурацию для подключения к S3-совместимому хранилищу
type S3Config struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	Region    string
	UseSSL    bool
}

// S3Client предоставляет методы для работы с S3
type S3Client struct {
	uploader   *s3manager.Uploader
	downloader *s3manager.Downloader
	s3         *s3.S3
	bucket     string
}

// NewS3Client создает новый клиент S3
func NewS3Client(cfg S3Config) *S3Client {
	// Настройка конфигурации AWS
	s3Config := &aws.Config{
		Credentials:      credentials.NewStaticCredentials(cfg.AccessKey, cfg.SecretKey, ""),
		Endpoint:         aws.String(cfg.Endpoint),
		Region:           aws.String(cfg.Region),
		DisableSSL:       aws.Bool(!cfg.UseSSL),
		S3ForcePathStyle: aws.Bool(true),
	}

	// Создание сессии
	sess := session.Must(session.NewSession(s3Config))

	return &S3Client{
		uploader:   s3manager.NewUploader(sess),
		downloader: s3manager.NewDownloader(sess),
		s3:         s3.New(sess),
		bucket:     cfg.Bucket,
	}
}

// Upload загружает файл в S3
func (c *S3Client) Upload(ctx context.Context, key string, body io.Reader, size int64) error {
	_, err := c.uploader.UploadWithContext(ctx, &s3manager.UploadInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
		Body:   body,
		ACL:    aws.String("private"),
	})

	if err != nil {
		return fmt.Errorf("failed to upload file to S3: %w", err)
	}

	return nil
}

// Download скачивает файл из S3
func (c *S3Client) Download(ctx context.Context, key string, w io.WriterAt) error {
	_, err := c.downloader.DownloadWithContext(ctx, w, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})

	if err != nil {
		return fmt.Errorf("failed to download file from S3: %w", err)
	}

	return nil
}

// Delete удаляет файл из S3
func (c *S3Client) Delete(ctx context.Context, key string) error {
	_, err := c.s3.DeleteObjectWithContext(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})

	if err != nil {
		return fmt.Errorf("failed to delete file from S3: %w", err)
	}

	return nil
}

// GeneratePresignedURL генерирует временную ссылку для скачивания файла
func (c *S3Client) GeneratePresignedURL(key string, expires time.Duration) (string, error) {
	req, _ := c.s3.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})

	url, err := req.Presign(expires)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return url, nil
}

// FileExists проверяет существование файла в S3
func (c *S3Client) FileExists(ctx context.Context, key string) (bool, error) {
	_, err := c.s3.HeadObjectWithContext(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})

	if err != nil {
		// Если файл не найден
		if aerr, ok := err.(interface{ Code() string }); ok && aerr.Code() == "NotFound" {
			return false, nil
		}
		// Другая ошибка
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}

// ListFiles возвращает список файлов в префиксе (директории)
func (c *S3Client) ListFiles(ctx context.Context, prefix string) ([]string, error) {
	result, err := c.s3.ListObjectsV2WithContext(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(c.bucket),
		Prefix: aws.String(prefix),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w", err)
	}

	var files []string
	for _, obj := range result.Contents {
		if obj.Key != nil {
			files = append(files, *obj.Key)
		}
	}

	return files, nil
}

// GetFileSize возвращает размер файла
func (c *S3Client) GetFileSize(ctx context.Context, key string) (int64, error) {
	head, err := c.s3.HeadObjectWithContext(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})

	if err != nil {
		return 0, fmt.Errorf("failed to get file size: %w", err)
	}

	if head.ContentLength != nil {
		return *head.ContentLength, nil
	}

	return 0, nil
}
