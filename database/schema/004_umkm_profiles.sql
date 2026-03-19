-- Table for UMKM Profiles
CREATE TABLE IF NOT EXISTS umkm_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) UNIQUE NOT NULL, -- Logical user ID from Auth or Session
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    product_category VARCHAR(100), -- e.g., 'Coffee', 'Spices', 'Handicraft'
    production_capacity_monthly DECIMAL(12, 2), -- in KG or units
    hpp_per_unit DECIMAL(12, 2), -- Harga Pokok Produksi
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster profile lookup
CREATE INDEX IF NOT EXISTS idx_umkm_user_id ON umkm_profiles(user_id);

-- Placeholder for Export Document Logs
CREATE TABLE IF NOT EXISTS export_document_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    umkm_id UUID REFERENCES umkm_profiles(id),
    document_type VARCHAR(50), -- 'Commercial Invoice', 'Packing List'
    country_destination VARCHAR(100),
    file_path TEXT, -- S3/Local path to the generated PDF
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
