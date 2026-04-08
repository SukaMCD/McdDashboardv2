-- =====================================================
-- SukaMCD v2 - Database Schema untuk Supabase
-- Jalankan di: Supabase Dashboard -> SQL Editor
-- =====================================================

-- CATATAN:
-- Tabel 'sukamcd_users' dari Laravel DIGANTIKAN oleh auth.users bawaan Supabase.
-- Kita buat tabel 'profiles' yang berelasi ke auth.users untuk menyimpan
-- data profil tambahan (username, profile_picture, dsb).
-- Tabel sukamcd_sessions dan password_reset_tokens TIDAK diperlukan karena
-- Supabase Auth menangani session dan password reset secara otomatis.


-- =====================================================
-- 1. PROFILES (Menggantikan sukamcd_users + profile fields)
-- =====================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  username    TEXT UNIQUE,
  phone_number TEXT,
  role        TEXT NOT NULL DEFAULT 'admin',
  bio         TEXT,
  profile_picture TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Otomatis buat profil saat user baru registrasi via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: Hanya user itu sendiri yang bisa baca/update profilnya
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- =====================================================
-- 2. MCDCRYPT FILES (File enkripsi)
-- =====================================================
CREATE TABLE public.mcdcrypt_files (
  id             BIGSERIAL PRIMARY KEY,
  parent_id      BIGINT REFERENCES public.mcdcrypt_files(id) ON DELETE CASCADE,
  original_name  TEXT NOT NULL,
  is_folder      BOOLEAN NOT NULL DEFAULT FALSE,
  encrypted_path TEXT,
  mime_type      TEXT,
  size           BIGINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Hanya user yang sudah login yang bisa akses
ALTER TABLE public.mcdcrypt_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage files"
  ON public.mcdcrypt_files FOR ALL
  USING (auth.role() = 'authenticated');


-- =====================================================
-- 3. MCDAI - AI Conversations & Messages
-- =====================================================
CREATE TABLE public.mcdai_conversations (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.mcdai_messages (
  id                BIGSERIAL PRIMARY KEY,
  conversation_id   BIGINT NOT NULL REFERENCES public.mcdai_conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL, -- 'user' atau 'model'
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Hanya pemilik conversation yang bisa akses
ALTER TABLE public.mcdai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcdai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON public.mcdai_conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in own conversations"
  ON public.mcdai_messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM public.mcdai_conversations WHERE user_id = auth.uid()
    )
  );


-- =====================================================
-- 4. MCDBACKUP - Catatan backup
-- =====================================================
CREATE TABLE public.mcdbackup_backups (
  id         BIGSERIAL PRIMARY KEY,
  filename   TEXT NOT NULL UNIQUE,
  size       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Hanya user yang sudah login
ALTER TABLE public.mcdbackup_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage backups"
  ON public.mcdbackup_backups FOR ALL
  USING (auth.role() = 'authenticated');


-- =====================================================
-- 5. MCD LOGS - Activity log
-- =====================================================
CREATE TABLE public.mcdlogs_activities (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,       -- e.g. 'LOGIN', 'TERMINAL_EXEC'
  description TEXT NOT NULL,
  context     JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  type        TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Hanya user yang sudah login
ALTER TABLE public.mcdlogs_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view logs"
  ON public.mcdlogs_activities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert logs"
  ON public.mcdlogs_activities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
