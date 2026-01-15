CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'factory', 'dfm', 'admin')),
    company_name VARCHAR(255),
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'submitted', 'in_review', 'accepted', 
                         'rejected', 'quoted', 'paid', 'in_production', 
                         'shipped', 'completed', 'disputed', 'cancelled')),
    
    -- PCB Requirements
    pcb_quantity INTEGER NOT NULL CHECK (pcb_quantity > 0),
    pcb_width INTEGER NOT NULL CHECK (pcb_width > 0),
    pcb_height INTEGER NOT NULL CHECK (pcb_height > 0),
    layer_count INTEGER NOT NULL CHECK (layer_count BETWEEN 1 AND 32),
    material VARCHAR(100) NOT NULL,
    
    -- SMT Requirements
    smt_required BOOLEAN DEFAULT false,
    components_qty INTEGER DEFAULT 0,
    
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);

CREATE TABLE order_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    version INTEGER DEFAULT 1,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_files_order ON order_files(order_id);

CREATE TABLE factories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    capabilities TEXT[] DEFAULT '{}',
    min_order_qty INTEGER DEFAULT 1,
    max_layers INTEGER DEFAULT 2,
    certificates TEXT[] DEFAULT '{}',
    country VARCHAR(100) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) NOT NULL,
    factory_id UUID REFERENCES factories(id) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
    comments TEXT,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, factory_id)
);

CREATE INDEX idx_offers_order ON offers(order_id);
CREATE INDEX idx_offers_factory ON offers(factory_id);