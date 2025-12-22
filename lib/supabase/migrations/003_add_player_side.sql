-- Migration 003: Ajouter le champ player_side à la table openings
-- Date: 2025-01-22
-- Description: Ajoute une colonne pour indiquer si l'ouverture est jouée par les blancs ou les noirs

-- Ajouter la colonne player_side avec contrainte de validation
ALTER TABLE openings
ADD COLUMN player_side VARCHAR(10) NOT NULL DEFAULT 'white'
CHECK (player_side IN ('white', 'black'));

-- Créer un index sur player_side pour permettre des filtres efficaces (future feature)
CREATE INDEX idx_openings_player_side ON openings(player_side);

-- Mettre à jour les ouvertures existantes basées sur le premier coup
-- Les coups blancs typiques: e4, d4, Nf3, c4, g3, b3, f4
UPDATE openings
SET player_side = CASE
  WHEN moves->0 = '"e4"' OR 
       moves->0 = '"d4"' OR 
       moves->0 = '"Nf3"' OR 
       moves->0 = '"c4"' OR 
       moves->0 = '"g3"' OR 
       moves->0 = '"b3"' OR 
       moves->0 = '"f4"' THEN 'white'
  ELSE 'black'
END;

-- Commentaire sur la colonne pour documentation
COMMENT ON COLUMN openings.player_side IS 'Indique si l''ouverture est jouée par les blancs (white) ou les noirs (black)';

