-- Smart Gestion - S'assurer que chaque faculté a au moins un département
-- Créer "Principal" pour les facultés qui n'en ont pas

INSERT INTO departments (faculty_id, nom, code)
SELECT f.id, 'Principal', 'PRIN'
FROM faculties f
WHERE NOT EXISTS (SELECT 1 FROM departments d WHERE d.faculty_id = f.id);
