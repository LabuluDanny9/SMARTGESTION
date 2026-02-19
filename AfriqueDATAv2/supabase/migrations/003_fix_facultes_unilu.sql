-- Correction structure facultés UNILU selon spécification
-- ESI contient PreESI et Bac1 (avec 4 spécialités Génie)
-- À exécuter dans Supabase SQL Editor après 001_initial_schema

-- Ajouter les promotions sous ESI (ignore si déjà existant)
INSERT INTO promotions (faculty_id, nom, annee)
SELECT f.id, 'PreESI', EXTRACT(YEAR FROM CURRENT_DATE)
FROM faculties f WHERE f.code = 'ESI'
AND NOT EXISTS (SELECT 1 FROM promotions p WHERE p.faculty_id = f.id AND p.nom = 'PreESI');

INSERT INTO promotions (faculty_id, nom, annee)
SELECT f.id, 'Bac1 - Génie Informatique IA', EXTRACT(YEAR FROM CURRENT_DATE)
FROM faculties f WHERE f.code = 'ESI'
AND NOT EXISTS (SELECT 1 FROM promotions p WHERE p.faculty_id = f.id AND p.nom = 'Bac1 - Génie Informatique IA');

INSERT INTO promotions (faculty_id, nom, annee)
SELECT f.id, 'Bac1 - Génie Civil', EXTRACT(YEAR FROM CURRENT_DATE)
FROM faculties f WHERE f.code = 'ESI'
AND NOT EXISTS (SELECT 1 FROM promotions p WHERE p.faculty_id = f.id AND p.nom = 'Bac1 - Génie Civil');

INSERT INTO promotions (faculty_id, nom, annee)
SELECT f.id, 'Bac1 - Génie de Procédés', EXTRACT(YEAR FROM CURRENT_DATE)
FROM faculties f WHERE f.code = 'ESI'
AND NOT EXISTS (SELECT 1 FROM promotions p WHERE p.faculty_id = f.id AND p.nom = 'Bac1 - Génie de Procédés');

INSERT INTO promotions (faculty_id, nom, annee)
SELECT f.id, 'Bac1 - Génie Électrique', EXTRACT(YEAR FROM CURRENT_DATE)
FROM faculties f WHERE f.code = 'ESI'
AND NOT EXISTS (SELECT 1 FROM promotions p WHERE p.faculty_id = f.id AND p.nom = 'Bac1 - Génie Électrique');

-- Ajouter sous-types de Pratiques ( Génie Civil, Procédés, Électrique )
INSERT INTO activity_types (nom, parent_id)
SELECT 'Génie Civil', id FROM activity_types WHERE nom = 'Pratiques' AND parent_id IS NULL
AND NOT EXISTS (SELECT 1 FROM activity_types WHERE nom = 'Génie Civil');

INSERT INTO activity_types (nom, parent_id)
SELECT 'Génie de Procédés', id FROM activity_types WHERE nom = 'Pratiques' AND parent_id IS NULL
AND NOT EXISTS (SELECT 1 FROM activity_types WHERE nom = 'Génie de Procédés');

INSERT INTO activity_types (nom, parent_id)
SELECT 'Génie Électrique', id FROM activity_types WHERE nom = 'Pratiques' AND parent_id IS NULL
AND NOT EXISTS (SELECT 1 FROM activity_types WHERE nom = 'Génie Électrique');
