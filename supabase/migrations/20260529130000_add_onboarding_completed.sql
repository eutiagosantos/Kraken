ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Utilizadores existentes já têm conta configurada — não forçar onboarding.
UPDATE profiles SET onboarding_completed_at = now() WHERE onboarding_completed_at IS NULL;
