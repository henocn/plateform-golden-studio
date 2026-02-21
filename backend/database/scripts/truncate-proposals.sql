-- Vide les tables des propositions (à exécuter avec prudence).
-- Usage: psql -U postgres -d govcom_db -f database/scripts/truncate-proposals.sql
-- (remplacer postgres par votre utilisateur PostgreSQL si besoin)

-- Ordre: tables enfants puis parents (à cause des clés étrangères)
TRUNCATE TABLE proposal_comments CASCADE;
TRUNCATE TABLE validations CASCADE;
TRUNCATE TABLE proposals CASCADE;
