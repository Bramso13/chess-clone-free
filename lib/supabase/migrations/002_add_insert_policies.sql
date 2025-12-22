-- Migration 002: Add INSERT policies for seeding
-- Story 2.1: Openings Database Population
-- Date: 2025-12-22

-- Cette migration ajoute les policies d'insertion pour permettre le seeding des données
-- NOTE: Ces policies permettent l'insertion publique pour le MVP
-- En production, ces policies doivent être restreintes ou utiliser une clé service_role

-- Supprimer les policies existantes si elles existent déjà
DROP POLICY IF EXISTS "Allow public insert on openings" ON openings;
DROP POLICY IF EXISTS "Allow public insert on tactical_problems" ON tactical_problems;

-- Ajouter les policies d'insertion publique
CREATE POLICY "Allow public insert on openings"
    ON openings
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public insert on tactical_problems"
    ON tactical_problems
    FOR INSERT
    WITH CHECK (true);

-- Ajouter une contrainte unique sur eco_code pour supporter l'upsert
-- Note: Cette commande échouera si la contrainte existe déjà, ce qui est normal
ALTER TABLE openings ADD CONSTRAINT openings_eco_code_key UNIQUE (eco_code);

-- Vérification
-- Vous pouvez vérifier que les policies sont bien créées avec:
-- SELECT * FROM pg_policies WHERE tablename IN ('openings', 'tactical_problems');

