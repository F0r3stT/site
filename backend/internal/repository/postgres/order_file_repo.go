package postgres

import (
	"context"
	"database/sql"
	"time"

	"sitecircuitworks/internal/domain"
)

type OrderFileRepo struct {
	db *sql.DB
}

func NewOrderFileRepo(db *sql.DB) *OrderFileRepo {
	return &OrderFileRepo{db: db}
}

func (r *OrderRepo) Create(ctx context.Context, userID string, o *domain.Order) error {
	// Вставляем с ID (так будет работать и если в БД нет DEFAULT gen_random_uuid())
	query := `
		INSERT INTO orders
			(id, customer_id, title, description, pcb_quantity, pcb_width, pcb_height, layer_count, material, smt_required, status)
		VALUES
			($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at
	`

	var created time.Time
	err := r.db.QueryRowContext(ctx, query,
		o.ID, userID,
		o.Title, o.Description,
		o.PCBQuantity, o.PCBWidth, o.PCBHeight,
		o.LayerCount, o.Material,
		o.SMTRequired, o.Status,
	).Scan(&created)

	if err != nil {
		return err
	}

	o.CreatedAt = created.Format(time.RFC3339)
	return nil
}
func (r *OrderFileRepo) Save(ctx context.Context, f *domain.OrderFile) error {
	query := `
	INSERT INTO order_files
	(id, order_id, filename, file_type, description, file_url, file_size, sha256)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`

	_, err := r.db.ExecContext(ctx, query,
		f.ID, f.OrderID, f.Filename, f.FileType,
		f.Description, f.FileURL, f.FileSize, f.SHA256,
	)

	return err
}

func (r *OrderFileRepo) ListByOrder(ctx context.Context, orderID string) ([]domain.OrderFile, error) {
	query := `
	SELECT id, order_id, filename, file_type, description,
	       file_url, file_size, sha256, uploaded_at
	FROM order_files
	WHERE order_id=$1
	ORDER BY uploaded_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []domain.OrderFile

	for rows.Next() {
		var f domain.OrderFile
		rows.Scan(
			&f.ID, &f.OrderID,
			&f.Filename, &f.FileType,
			&f.Description,
			&f.FileURL, &f.FileSize,
			&f.SHA256, &f.UploadedAt,
		)
		files = append(files, f)
	}

	return files, nil
}
