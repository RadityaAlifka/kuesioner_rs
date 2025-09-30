

# 📌 Project Summary – Web Kuesioner dengan Dashboard & Laporan Email

## 🎯 Tujuan

Aplikasi web untuk:

1. Mengumpulkan data kuesioner dari user.
2. Menyimpan data ke **Supabase**.
3. Menyediakan **dashboard admin** dengan tabel & chart interaktif.
4. Mengirimkan **laporan mingguan via email** (grafik + tabel) secara otomatis menggunakan scheduler di Vercel.

---

## 🛠️ Teknologi

* **Frontend:** Next.js (App Router, React Server Components).
* **Database & Auth:** Supabase (Postgres + Supabase Auth untuk admin).
* **Styling:** Tailwind CSS + shadcn/ui → modern, minimalis, responsif.
* **Charting:** Recharts (pie, bar, line chart).
* **Email Service:** Resend (disarankan), alternatif: SendGrid / SMTP Gmail.
* **Scheduler:** Vercel Cron Job.
* **Deployment:** Vercel (frontend & API), Supabase (backend).

---

## 🎨 Desain

* **Modern minimalis**, mobile-first.
* Warna: **oranye (#f25022)** sebagai primary, putih, abu netral.
* **UI pattern:**

  * Card untuk pertanyaan & jawaban.
  * Tombol oranye full-width.
  * Dashboard: chart + tabel clean.

---

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

---

## 📱 Fitur Utama

### 1. Halaman Publik (User)

* Form kuesioner (pertanyaan diambil dari `questions` yang aktif).
* Input tambahan: usia, jenis kelamin.
* Submit → insert ke `responses` + insert multiple ke `answers`.
* Halaman **Terima Kasih** setelah submit.

### 2. Halaman Admin (Private)

* Login admin via Supabase Auth.
* Dashboard berisi:

  * Statistik singkat (jumlah responden, distribusi usia/jenis kelamin).
  * Chart hasil per pertanyaan (bar/pie chart).
  * Tabel jawaban lengkap dengan search/sort.
* Export & Download:

  * Chart → PNG/PDF.
  * Tabel → CSV/Excel.

### 3. Laporan Email Mingguan

* **Cron Job Vercel** trigger API `/api/reports` (contoh: tiap Senin jam 08:00).
* API ambil data Supabase → generate laporan.
* Laporan berisi:

  * Ringkasan total responden.
  * Grafik (embed image).
  * Tabel (HTML table / CSV attachment).
* Email dikirim via **Resend** (recommended).

---

## 📂 Struktur Project (Next.js + Supabase)

```
project/
 ├─ app/
 │   ├─ page.tsx                → halaman kuesioner
 │   ├─ thankyou/page.tsx       → halaman terima kasih
 │   ├─ admin/
 │   │   ├─ login/page.tsx      → login admin
 │   │   ├─ dashboard/page.tsx  → dashboard admin
 │   │   └─ components/         → chart, tabel, cards
 │   └─ api/
 │       └─ reports/route.ts    → API generate & kirim email laporan
 ├─ lib/
 │   └─ supabaseClient.ts       → koneksi Supabase
 ├─ styles/                     → Tailwind global styles
 ├─ tailwind.config.js
 └─ vercel.json                 → config cron job
```

---

## 🔄 Alur Data

1. **User submit kuesioner**

   * Next.js form → insert `responses` → insert multiple `answers`.
2. **Admin buka dashboard**

   * Query join `answers + questions` → render chart & tabel.
3. **Scheduler jalan (mingguan)**

   * Vercel cron trigger API `/api/reports`.
   * API ambil data → generate laporan → kirim via email (Resend).

---

## 📅 Workflow Development

1. Setup Next.js + Tailwind + Supabase client.
2. Test fetch data pertanyaan dari `questions`.
3. Buat form kuesioner → insert ke DB.
4. Tambah halaman terima kasih.
5. Buat halaman admin + login.
6. Bangun dashboard (chart + tabel + export).
7. Tambahkan API reports untuk email.
8. Konfigurasi cron job di Vercel.

---

👉 Dengan ini, projectmu sudah lengkap: **kuesioner, dashboard admin, laporan email otomatis mingguan**.


