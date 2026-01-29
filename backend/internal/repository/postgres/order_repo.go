package postgres

import (
	"database/sql"
	"time"

	"sitecircuitworks/internal/domain"
)

type OrderRepo struct {
	db *sql.DB
}

func NewOrderRepo(db *sql.DB) *OrderRepo {
	return &OrderRepo{db: db}
}

func (r *OrderRepo) ListByUser(userID string) ([]domain.Order, error) {
	rows, err := r.db.Query(`
		SELECT id, title, description, status,
		       pcb_quantity, pcb_width, pcb_height,
		       layer_count, smt_required, created_at
		FROM orders
		WHERE customer_id=$1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []domain.Order

	for rows.Next() {
		var o domain.Order
		var created time.Time

		err := rows.Scan(
			&o.ID,
			&o.Title,
			&o.Description,
			&o.Status,
			&o.PCBQuantity,
			&o.PCBWidth,
			&o.PCBHeight,
			&o.LayerCount,
			&o.SMTRequired,
			&created,
		)
		if err != nil {
			return nil, err
		}

		o.CreatedAt = created.Format(time.RFC3339)
		orders = append(orders, o)
	}

	return orders, nil
}
