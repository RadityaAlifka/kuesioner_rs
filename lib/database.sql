-- Table: responses
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usia INTEGER,
  jenis_kelamin VARCHAR(20)
);

-- Table: questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  urutan INTEGER,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: answers
CREATE TABLE IF NOT EXISTS answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Optional, bisa diaktifkan sesuai kebutuhan
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Contoh policy - sesuaikan dengan kebutuhan aplikasi
-- CREATE POLICY "Allow read for all users" ON responses FOR SELECT USING (true);
-- CREATE POLICY "Allow insert for authenticated users" ON responses FOR INSERT WITH CHECK (auth.role() = 'authenticated');