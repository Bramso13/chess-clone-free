-- ============================================
-- Supabase Database Schema
-- Story 1.2: Supabase Integration and Database Schema
-- ============================================

-- Table: openings
-- Stores chess opening information
CREATE TABLE IF NOT EXISTS openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    eco_code VARCHAR(10) NOT NULL UNIQUE,
    moves JSONB NOT NULL,
    variations JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: tactical_problems
-- Stores tactical chess problems for training
CREATE TABLE IF NOT EXISTS tactical_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_fen VARCHAR(100) NOT NULL,
    solution_moves JSONB NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Facile', 'Moyen', 'Difficile')),
    tactic_type VARCHAR(50) NOT NULL,
    explanation TEXT NOT NULL,
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'generated', 'imported')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_openings_eco_code ON openings(eco_code);
CREATE INDEX IF NOT EXISTS idx_openings_name ON openings(name);
CREATE INDEX IF NOT EXISTS idx_tactical_problems_difficulty ON tactical_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_tactical_problems_tactic_type ON tactical_problems(tactic_type);
CREATE INDEX IF NOT EXISTS idx_tactical_problems_source ON tactical_problems(source);

-- Row Level Security (RLS) Configuration
-- Enable RLS on both tables
ALTER TABLE openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_problems ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public read access (MVP without authentication)
CREATE POLICY "Allow public read access on openings"
    ON openings
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on tactical_problems"
    ON tactical_problems
    FOR SELECT
    USING (true);

-- RLS Policies: Allow public insert for seeding (MVP only - should be restricted in production)
CREATE POLICY "Allow public insert on openings"
    ON openings
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public insert on tactical_problems"
    ON tactical_problems
    FOR INSERT
    WITH CHECK (true);

