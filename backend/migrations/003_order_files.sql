CREATE TABLE order_files (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- gerber / bom / drawing / other
    description TEXT,

    file_url TEXT NOT NULL,  -- путь или ссылка S3
    file_size BIGINT NOT NULL,
    sha256 TEXT NOT NULL,

    uploaded_at TIMESTAMP DEFAULT now()
);
