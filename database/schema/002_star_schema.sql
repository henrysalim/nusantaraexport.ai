-- =============================================
-- NusantaraExport.AI — Star Schema DDL
-- =============================================
-- Dimensi + Fakta untuk data pasar & UMKM.

-- ===================
-- DIMENSION TABLES
-- ===================

-- Dimensi Waktu
CREATE TABLE IF NOT EXISTS dim_time (
    time_id       SERIAL PRIMARY KEY,
    full_date     DATE        NOT NULL UNIQUE,
    day           SMALLINT    NOT NULL,
    month         SMALLINT    NOT NULL,
    quarter       SMALLINT    NOT NULL,
    year          SMALLINT    NOT NULL,
    month_name    VARCHAR(20) NOT NULL,
    is_weekend    BOOLEAN     DEFAULT FALSE
);

CREATE INDEX idx_dim_time_date ON dim_time (full_date);
CREATE INDEX idx_dim_time_year_month ON dim_time (year, month);

-- Dimensi Negara
CREATE TABLE IF NOT EXISTS dim_country (
    country_id       SERIAL PRIMARY KEY,
    country_code     VARCHAR(3)   NOT NULL UNIQUE,  -- ISO 3166-1 alpha-3
    country_name     VARCHAR(100) NOT NULL,
    region           VARCHAR(50),                    -- e.g. Asia, Europe
    sub_region       VARCHAR(50),                    -- e.g. Southeast Asia
    trade_agreements TEXT[],                          -- e.g. {RCEP, ACFTA}
    created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_dim_country_code ON dim_country (country_code);
CREATE INDEX idx_dim_country_region ON dim_country (region);

-- Dimensi Komoditas
CREATE TABLE IF NOT EXISTS dim_commodity (
    commodity_id    SERIAL PRIMARY KEY,
    commodity_name  VARCHAR(200) NOT NULL,
    category        VARCHAR(100),                     -- e.g. Rempah, Tekstil
    hs_code         VARCHAR(12),                      -- Harmonized System Code
    description     TEXT,
    unit            VARCHAR(20)  DEFAULT 'kg',         -- satuan ukur
    created_at      TIMESTAMPTZ  DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_dim_commodity_hs ON dim_commodity (hs_code);
CREATE INDEX idx_dim_commodity_category ON dim_commodity (category);

-- Dimensi UMKM
CREATE TABLE IF NOT EXISTS dim_umkm (
    umkm_id        SERIAL PRIMARY KEY,
    business_name  VARCHAR(200) NOT NULL,
    owner_name     VARCHAR(100),
    province       VARCHAR(100) NOT NULL,
    city           VARCHAR(100),
    product_types  TEXT[],                             -- array produk
    contact_phone  VARCHAR(20),
    contact_email  VARCHAR(100),
    created_at     TIMESTAMPTZ  DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_dim_umkm_province ON dim_umkm (province);

-- ===================
-- FACT TABLES
-- ===================

-- Fakta Harga Global (hasil scraping marketplace)
CREATE TABLE IF NOT EXISTS fact_global_price (
    id                SERIAL PRIMARY KEY,
    commodity_id      INT          NOT NULL REFERENCES dim_commodity(commodity_id),
    country_id        INT          NOT NULL REFERENCES dim_country(country_id),
    time_id           INT          NOT NULL REFERENCES dim_time(time_id),
    price_usd         NUMERIC(12,2) NOT NULL,
    currency_original VARCHAR(3),
    price_original    NUMERIC(14,2),
    source_url        TEXT,
    platform          VARCHAR(50),                      -- e.g. Amazon, Alibaba
    scraped_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_fact_global_price_commodity ON fact_global_price (commodity_id);
CREATE INDEX idx_fact_global_price_country ON fact_global_price (country_id);
CREATE INDEX idx_fact_global_price_time ON fact_global_price (time_id);

-- Fakta HPP UMKM (Harga Pokok Produksi)
CREATE TABLE IF NOT EXISTS fact_umkm_hpp (
    id                     SERIAL PRIMARY KEY,
    commodity_id           INT          NOT NULL REFERENCES dim_commodity(commodity_id),
    umkm_id                INT          NOT NULL REFERENCES dim_umkm(umkm_id),
    time_id                INT          NOT NULL REFERENCES dim_time(time_id),
    hpp_idr                NUMERIC(14,2) NOT NULL,       -- dalam Rupiah
    production_capacity_kg NUMERIC(10,2),
    lead_time_days         SMALLINT,
    created_at             TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_fact_umkm_hpp_commodity ON fact_umkm_hpp (commodity_id);
CREATE INDEX idx_fact_umkm_hpp_umkm ON fact_umkm_hpp (umkm_id);

-- Fakta Tren Ekspor (data BPS/Kemendag)
CREATE TABLE IF NOT EXISTS fact_export_trend (
    id                SERIAL PRIMARY KEY,
    commodity_id      INT          NOT NULL REFERENCES dim_commodity(commodity_id),
    country_id        INT          NOT NULL REFERENCES dim_country(country_id),
    time_id           INT          NOT NULL REFERENCES dim_time(time_id),
    export_value_usd  NUMERIC(16,2),
    export_volume_kg  NUMERIC(14,2),
    growth_rate_pct   NUMERIC(6,2),                      -- pertumbuhan (%)
    source            VARCHAR(50),                        -- BPS / Kemendag
    created_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_fact_export_trend_commodity ON fact_export_trend (commodity_id);
CREATE INDEX idx_fact_export_trend_country ON fact_export_trend (country_id);

-- Fakta Skor Market Gap (hasil analisis AI)
CREATE TABLE IF NOT EXISTS fact_market_gap_score (
    id                    SERIAL PRIMARY KEY,
    commodity_id          INT          NOT NULL REFERENCES dim_commodity(commodity_id),
    country_id            INT          NOT NULL REFERENCES dim_country(country_id),
    umkm_id               INT          NOT NULL REFERENCES dim_umkm(umkm_id),
    time_id               INT          NOT NULL REFERENCES dim_time(time_id),
    global_price_usd      NUMERIC(12,2),
    hpp_idr               NUMERIC(14,2),
    exchange_rate         NUMERIC(10,2),                  -- USD/IDR saat kalkulasi
    estimated_margin_pct  NUMERIC(6,2),                   -- estimasi margin (%)
    gap_score             NUMERIC(5,3),                   -- skor gap 0-1
    roi_score             NUMERIC(5,3),                   -- skor ROI 0-1
    recommendation        TEXT,                            -- ringkasan rekomendasi
    calculated_at         TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_fact_market_gap_commodity ON fact_market_gap_score (commodity_id);
CREATE INDEX idx_fact_market_gap_country ON fact_market_gap_score (country_id);
CREATE INDEX idx_fact_market_gap_umkm ON fact_market_gap_score (umkm_id);
CREATE INDEX idx_fact_market_gap_score_val ON fact_market_gap_score (gap_score DESC);
