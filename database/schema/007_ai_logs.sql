-- =============================================
-- NusantaraExport.AI — AI Inference Logs
-- Merekam setiap inferensi AI untuk metrik nyata
-- Database: nusantaraexport_ai (port 5432)
-- =============================================

CREATE TABLE IF NOT EXISTS ai_inference_logs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module           VARCHAR(50)  NOT NULL,   -- "chat", "packaging", "nego_coach", "hs_code", "dry_run", dll.
    ai_tier          VARCHAR(30)  NOT NULL,   -- "gemini_flash" | "backup_llm" | "rule_based"
    model_used       VARCHAR(80),             -- "gemini-3.5-flash-lite"
    confidence       FLOAT,                   -- 0.0 – 1.0 estimasi
    finish_reason    VARCHAR(30),             -- "STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION"
    response_time_ms INTEGER,                 -- latency aktual dalam ms
    has_image        BOOLEAN      DEFAULT false,
    -- User feedback (human oversight)
    feedback         SMALLINT,                -- NULL = belum ada | +1 = membantu | -1 = salah/menyesatkan
    feedback_note    TEXT,                    -- catatan opsional dari user saat laporkan salah
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk query agregat per modul dan waktu
CREATE INDEX IF NOT EXISTS idx_ai_logs_module     ON ai_inference_logs(module);
CREATE INDEX IF NOT EXISTS idx_ai_logs_tier       ON ai_inference_logs(ai_tier);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created    ON ai_inference_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feedback   ON ai_inference_logs(feedback) WHERE feedback IS NOT NULL;

-- View untuk agregat cepat (dipakai oleh /api/ai/transparency/metrics)
CREATE OR REPLACE VIEW ai_metrics_summary AS
SELECT
    module,
    COUNT(*)                                                    AS total_calls,
    ROUND(AVG(confidence)::NUMERIC, 3)                         AS avg_confidence,
    ROUND(AVG(response_time_ms)::NUMERIC, 0)                   AS avg_response_time_ms,
    COUNT(*) FILTER (WHERE ai_tier = 'gemini_flash')            AS gemini_calls,
    COUNT(*) FILTER (WHERE ai_tier = 'backup_llm')              AS backup_llm_calls,
    COUNT(*) FILTER (WHERE ai_tier = 'rule_based')              AS rule_based_calls,
    COUNT(*) FILTER (WHERE feedback = 1)                        AS helpful_count,
    COUNT(*) FILTER (WHERE feedback = -1)                       AS wrong_count
FROM ai_inference_logs
GROUP BY module;
