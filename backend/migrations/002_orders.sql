CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,

    pcb_quantity INT NOT NULL,
    pcb_width INT NOT NULL,
    pcb_height INT NOT NULL,
    layer_count INT NOT NULL,

    smt_required BOOLEAN DEFAULT FALSE,

    status TEXT DEFAULT 'draft',

    created_at TIMESTAMPTZ DEFAULT now()
);
