package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"sitecircuitworks/internal/domain"
)

type OrderRepo struct {
	db *sql.DB
}

func NewOrderRepo(db *sql.DB) *OrderRepo {
	return &OrderRepo{db: db}
}

var ErrOrderNotFound = errors.New("order not found")

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

		if err := rows.Scan(
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
		); err != nil {
			return nil, err
		}

		o.CreatedAt = created.Format(time.RFC3339)
		orders = append(orders, o)
	}

	return orders, nil
}

func (r *OrderRepo) GetByIDForUser(ctx context.Context, orderID, userID string) (*domain.Order, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, title, description, status,
		       pcb_quantity, pcb_width, pcb_height,
		       layer_count, material, smt_required, created_at
		FROM orders
		WHERE id=$1 AND customer_id=$2
	`, orderID, userID)

	var o domain.Order
	var created time.Time

	err := row.Scan(
		&o.ID, &o.Title, &o.Description, &o.Status,
		&o.PCBQuantity, &o.PCBWidth, &o.PCBHeight,
		&o.LayerCount, &o.Material, &o.SMTRequired,
		&created,
	)
	if err == sql.ErrNoRows {
		return nil, ErrOrderNotFound
	}
	if err != nil {
		return nil, err
	}

	o.CreatedAt = created.Format(time.RFC3339)
	return &o, nil
}

// DeleteByUser deletes an order owned by userID and its order_files rows.
func (r *OrderRepo) DeleteByUser(ctx context.Context, orderID, userID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Ensure it exists and belongs to user
	var ok bool
	err = tx.QueryRowContext(ctx, `SELECT true FROM orders WHERE id=$1 AND customer_id=$2`, orderID, userID).Scan(&ok)
	if err == sql.ErrNoRows {
		return ErrOrderNotFound
	}
	if err != nil {
		return err
	}

	// If FK has ON DELETE CASCADE, this is still fine.
	if _, err := tx.ExecContext(ctx, `DELETE FROM order_files WHERE order_id=$1`, orderID); err != nil {
		return err
	}

	res, err := tx.ExecContext(ctx, `DELETE FROM orders WHERE id=$1 AND customer_id=$2`, orderID, userID)
	if err != nil {
		return err
	}
	aff, _ := res.RowsAffected()
	if aff == 0 {
		return ErrOrderNotFound
	}

	return tx.Commit()
}

// DeleteAny deletes any order by id (admin use-case).
func (r *OrderRepo) DeleteAny(ctx context.Context, orderID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM order_files WHERE order_id=$1`, orderID); err != nil {
		return err
	}

	res, err := tx.ExecContext(ctx, `DELETE FROM orders WHERE id=$1`, orderID)
	if err != nil {
		return err
	}
	aff, _ := res.RowsAffected()
	if aff == 0 {
		return ErrOrderNotFound
	}

	return tx.Commit()
}
