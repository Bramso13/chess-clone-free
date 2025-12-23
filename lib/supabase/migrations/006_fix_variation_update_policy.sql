-- ============================================
-- Migration 006: Fix variation update policy
-- Permet la mise à jour des variations pour toutes les ouvertures
-- ============================================

-- Supprimer la policy existante si elle existe
DROP POLICY IF EXISTS "Allow public update variations on all openings" ON openings;

-- Recréer la policy pour permettre la mise à jour des variations sur toutes les ouvertures
-- Cette policy doit permettre UPDATE même pour les ouvertures basiques (is_custom = false)
CREATE POLICY "Allow public update variations on all openings"
    ON openings
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Vérification: Cette policy devrait permettre la mise à jour de toutes les ouvertures
-- Les autres policies (comme "Allow public update on custom openings") sont combinées avec OR
-- donc une ouverture basique devrait pouvoir être mise à jour via cette policy

