-- Migration 004: Vérification et optimisation de la configuration tactical_problems
-- Story 4.1: Tactical Problems Database and Fallback System
-- Date: 2025-12-23
-- Description: Vérifie que la table tactical_problems a tous les indexes et policies nécessaires

-- Note: Cette migration est idempotente et peut être exécutée plusieurs fois sans risque
-- Elle vérifie et crée uniquement ce qui manque

-- Vérifier que la table existe (devrait déjà exister depuis schema.sql)
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

-- S'assurer que RLS est activé
ALTER TABLE tactical_problems ENABLE ROW LEVEL SECURITY;

-- Créer les indexes s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_tactical_problems_difficulty ON tactical_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_tactical_problems_tactic_type ON tactical_problems(tactic_type);
CREATE INDEX IF NOT EXISTS idx_tactical_problems_source ON tactical_problems(source);

-- Index composé pour des requêtes combinées (optionnel mais utile)
CREATE INDEX IF NOT EXISTS idx_tactical_problems_difficulty_type 
    ON tactical_problems(difficulty, tactic_type);

-- Recréer les policies si elles n'existent pas
DO $$ 
BEGIN
    -- Policy pour SELECT public
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tactical_problems' 
        AND policyname = 'Allow public read access on tactical_problems'
    ) THEN
        CREATE POLICY "Allow public read access on tactical_problems"
            ON tactical_problems
            FOR SELECT
            USING (true);
    END IF;

    -- Policy pour INSERT public (pour seed)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tactical_problems' 
        AND policyname = 'Allow public insert on tactical_problems'
    ) THEN
        CREATE POLICY "Allow public insert on tactical_problems"
            ON tactical_problems
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- Ajouter des commentaires pour documentation
COMMENT ON TABLE tactical_problems IS 'Problèmes tactiques pour l''entraînement aux échecs';
COMMENT ON COLUMN tactical_problems.position_fen IS 'Position initiale du problème en notation FEN';
COMMENT ON COLUMN tactical_problems.solution_moves IS 'Séquence de coups solution en notation SAN (JSON array)';
COMMENT ON COLUMN tactical_problems.difficulty IS 'Niveau de difficulté: Facile, Moyen, ou Difficile';
COMMENT ON COLUMN tactical_problems.tactic_type IS 'Type de tactique (ex: Fourchette, Clouage, Mat, etc.)';
COMMENT ON COLUMN tactical_problems.explanation IS 'Explication textuelle de la combinaison tactique';
COMMENT ON COLUMN tactical_problems.source IS 'Source du problème: manual, generated, ou imported';

-- Vérification: Afficher un résumé des indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'tactical_problems'
ORDER BY indexname;

-- Vérification: Afficher un résumé des policies
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'tactical_problems'
ORDER BY policyname;

