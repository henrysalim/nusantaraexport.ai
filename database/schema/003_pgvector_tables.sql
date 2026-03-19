-- =============================================
-- NusantaraExport.AI — pgvector Tables
-- =============================================
-- Tabel untuk embeddings: RAG documents & HS Code matching.

-- Dokumen RAG (untuk LLM context retrieval)
CREATE TABLE IF NOT EXISTS rag_documents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(300)  NOT NULL,
    content     TEXT          NOT NULL,
    source_url  TEXT,
    doc_type    VARCHAR(50),                          -- e.g. regulasi, panduan_ekspor
    country     VARCHAR(3),                           -- ISO code negara terkait
    embedding   vector(1536),                         -- embedding vector
    metadata    JSONB         DEFAULT '{}',
    created_at  TIMESTAMPTZ   DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- HNSW index untuk pencarian approximate nearest neighbor
CREATE INDEX idx_rag_documents_embedding
    ON rag_documents
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_rag_documents_type ON rag_documents (doc_type);
CREATE INDEX idx_rag_documents_country ON rag_documents (country);

-- Embeddings HS Code (untuk pencocokan semantik produk → kode HS)
CREATE TABLE IF NOT EXISTS hs_code_embeddings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hs_code     VARCHAR(12)  NOT NULL,
    description TEXT         NOT NULL,
    section     VARCHAR(10),                           -- section HS (I-XXI)
    chapter     VARCHAR(10),                           -- chapter HS (01-97)
    embedding   vector(1536),                          -- embedding vector
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_hs_code_embedding
    ON hs_code_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE UNIQUE INDEX idx_hs_code_unique ON hs_code_embeddings (hs_code);
CREATE INDEX idx_hs_code_chapter ON hs_code_embeddings (chapter);
