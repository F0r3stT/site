package domain

import "time"

type OrderFile struct {
	ID      string `json:"id"`
	OrderID string `json:"order_id"`

	Filename    string `json:"filename"`
	FileType    string `json:"file_type"`
	Description string `json:"description"`

	FileURL  string `json:"file_url"`
	FileSize int64  `json:"file_size"`
	SHA256   string `json:"sha256"`

	UploadedAt time.Time `json:"uploaded_at"`
}
