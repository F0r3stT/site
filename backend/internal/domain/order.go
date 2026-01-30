package domain

type Order struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`

	PCBQuantity int    `json:"pcb_quantity"`
	PCBWidth    int    `json:"pcb_width"`
	PCBHeight   int    `json:"pcb_height"`
	LayerCount  int    `json:"layer_count"`
	Material    string `json:"material"` // <-- добавить
	SMTRequired bool   `json:"smt_required"`

	CreatedAt string `json:"created_at"`
}
