# 📌 Web Kuesioner dengan Dashboard & Laporan Email

Aplikasi web untuk mengumpulkan data kuesioner dari user, menyimpan data ke Supabase, menyediakan dashboard admin dengan tabel & chart interaktif, serta mengirimkan laporan mingguan via email secara otomatis.

## 🛠️ Teknologi

* **Frontend:** Next.js (App Router, React Server Components)
* **Database & Auth:** Supabase (Postgres + Supabase Auth untuk admin)
* **Styling:** Tailwind CSS + shadcn/ui → modern, minimalis, responsif
* **Charting:** Recharts (pie, bar, line chart)
* **Email Service:** Resend
* **Scheduler:** Vercel Cron Job
* **Deployment:** Vercel (frontend & API), Supabase (backend)

## 🎨 Desain

* **Modern minimalis**, mobile-first
* Warna: **oranye (#f25022)** sebagai primary, putih, abu netral
* **UI pattern:**
  * Card untuk pertanyaan & jawaban
  * Tombol oranye full-width
  * Dashboard: chart + tabel clean

## 📂 Struktur Database (Supabase)

### Table: `responses`
* `id` (PK)
* `created_at`
* `usia`
* `jenis_kelamin`

### Table: `questions`
* `id` (PK)
* `text` (pertanyaan)
* `urutan` (int, untuk sorting)
* `aktif` (bool)
* `created_at`

### Table: `answers`
* `id` (PK)
* `response_id` (FK → responses.id)
* `question_id` (FK → questions.id)
* `value` (jawaban)
* `created_at`

## 📱 Fitur Utama

### 1. Halaman Publik (User)
* Form kuesioner (pertanyaan diambil dari `questions` yang aktif)
* Input tambahan: usia, jenis kelamin
* Submit → insert ke `responses` + insert multiple ke `answers`
* Halaman **Terima Kasih** setelah submit

### 2. Halaman Admin (Private)
* Login admin via Supabase Auth
* Dashboard berisi:
  * Statistik singkat (jumlah responden, distribusi usia/jenis kelamin)
  * Chart hasil per pertanyaan (bar/pie chart)
  * Tabel jawaban lengkap dengan search/sort
* Export & Download:
  * Chart → PNG/PDF
  * Tabel → CSV/Excel

### 3. Laporan Email Mingguan
* **Cron Job Vercel** trigger API `/api/reports` (contoh: tiap Senin jam 08:00)
* API ambil data Supabase → generate laporan
* Laporan berisi:
  * Ringkasan total responden
  * Grafik (embed image)
  * Tabel (HTML table / CSV attachment)
* Email dikirim via **Resend**

## 🔧 Cara Menjalankan Aplikasi

1. **Instal dependensi:**
   ```bash
   npm install
   ```

2. **Buat file `.env.local` dan tambahkan variabel lingkungan:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=your_email_sender
   REPORT_EMAIL_RECIPIENT=recipient_email
   ```

3. **Buat tabel database di Supabase menggunakan file `lib/database.sql`**

4. **Jalankan aplikasi dalam mode development:**
   ```bash
   npm run dev
   ```

5. **Buka [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi**

## 🚀 Deployment ke Vercel

1. Pastikan project Anda sudah terhubung ke repositori Git
2. Import project ke Vercel dashboard
3. Tambahkan environment variables ke Vercel dashboard
4. Vercel akan otomatis mendeploy aplikasi dan menjalankan cron job sesuai dengan konfigurasi di `vercel.json`

## 📅 Workflow Development

1. Setup Next.js + Tailwind + Supabase client
2. Test fetch data pertanyaan dari `questions`
3. Buat form kuesioner → insert ke DB
4. Tambah halaman terima kasih
5. Buat halaman admin + login
6. Bangun dashboard (chart + tabel + export)
7. Tambahkan API reports untuk email
8. Konfigurasi cron job di Vercel

Dengan ini, projectmu sudah lengkap: **kuesioner, dashboard admin, laporan email otomatis mingguan**.