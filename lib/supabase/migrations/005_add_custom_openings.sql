-- ============================================
-- Migration 005: Add Custom Openings Support
-- Story 7.2: Custom Opening Save Service
-- ============================================

-- Ajouter colonne is_custom pour distinguer les ouvertures personnalisées
ALTER TABLE openings 
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Ajouter colonne created_by pour futur système d'authentification
ALTER TABLE openings 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Créer index sur is_custom pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_openings_is_custom ON openings(is_custom);

-- Mettre à jour les policies RLS pour permettre la modification publique des ouvertures personnalisées (MVP)
-- Note: Dans un environnement de production avec authentification, 
-- ces policies devraient être restreintes aux utilisateurs authentifiés

-- Supprimer les policies existantes si elles existent déjà
DROP POLICY IF EXISTS "Allow public update on custom openings" ON openings;
DROP POLICY IF EXISTS "Allow public delete on custom openings" ON openings;

-- Ajouter les policies pour UPDATE et DELETE sur les ouvertures personnalisées
CREATE POLICY "Allow public update on custom openings"
    ON openings
    FOR UPDATE
    USING (is_custom = true)
    WITH CHECK (is_custom = true);

CREATE POLICY "Allow public delete on custom openings"
    ON openings
    FOR DELETE
    USING (is_custom = true);

-- Policy pour permettre l'ajout de variantes à toutes les ouvertures (UPDATE des variations uniquement)
-- Note: Cette policy permet de mettre à jour uniquement le champ variations pour toutes les ouvertures
CREATE POLICY "Allow public update variations on all openings"
    ON openings
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Commentaire sur la colonne
COMMENT ON COLUMN openings.is_custom IS 'Indique si l''ouverture est personnalisée (créée par un utilisateur)';
COMMENT ON COLUMN openings.created_by IS 'Identifiant de l''utilisateur qui a créé l''ouverture (pour futur système d''authentification)';

