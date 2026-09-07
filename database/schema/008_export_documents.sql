-- =======================================================
-- NusantaraExport.AI — Export Documents Schema (9 Doc Types)
-- Database: nusantaraexport_ai (port 5432)
-- =======================================================

CREATE TABLE IF NOT EXISTS export_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Draft Dokumen Ekspor',
    status VARCHAR(50) DEFAULT 'draft',
    
    -- Step 1: Profil UMKM (Auto-filled)
    company_logo_url TEXT,
    company_name VARCHAR(255),
    company_address TEXT,
    company_phone VARCHAR(100),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    owner_name VARCHAR(255),
    
    -- Step 2: Produk & Buyer
    product_name VARCHAR(255),
    hs_code VARCHAR(50),
    product_spec TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    buyer_name VARCHAR(255),
    buyer_country VARCHAR(100),
    buyer_address TEXT,
    incoterm VARCHAR(50),
    payment_method VARCHAR(100),
    transaction_date DATE,
    invoice_ref_no VARCHAR(100),
    
    -- Step 3: Pengiriman
    port_loading VARCHAR(255),
    port_destination VARCHAR(255),
    vessel_name VARCHAR(255),
    etd_date DATE,
    eta_date DATE,
    container_no VARCHAR(100),
    seal_no VARCHAR(100),
    container_type VARCHAR(100),
    forwarder_name VARCHAR(255),
    pickup_address TEXT,
    
    -- Step 4: Keuangan
    usd_idr_rate NUMERIC(15, 2),
    price_at_warehouse NUMERIC(15, 2),
    qty_kg NUMERIC(15, 2),
    loading_cost NUMERIC(15, 2),
    trucking_cost NUMERIC(15, 2),
    thc_cost NUMERIC(15, 2),
    insurance_pct NUMERIC(5, 2),
    deposit_pct NUMERIC(5, 2),
    bank_account TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_export_documents_user ON export_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_export_documents_updated ON export_documents(updated_at DESC);
