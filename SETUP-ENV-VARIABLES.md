# 🔧 Cara Setup Environment Variables Supabase

## ❗ ERROR yang Muncul:
```
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
```

## ✅ SOLUSI:

### Langkah 1: Buka Supabase Dashboard
1. Buka browser: https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project: **si-aziz** (ducklimp's Org)

### Langkah 2: Ambil Credentials
1. Di dashboard project, klik **Settings** (icon gear) di sidebar kiri
2. Klik **API** di menu Settings
3. Anda akan melihat:

```
┌─────────────────────────────────────────────────────────────┐
│ Project URL                                                 │
│ https://xxxxxxxxxxxxxxxx.supabase.co                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ API Keys                                                    │
│                                                             │
│ anon public                                                 │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...                 │
│                                                             │
│ service_role (secret)                                       │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...                 │
└─────────────────────────────────────────────────────────────┘
```

### Langkah 3: Copy ke File .env
1. Buka file: `.env` di root project
2. Replace placeholder dengan nilai yang sebenarnya:

```bash
# Sebelum:
PUBLIC_SUPABASE_URL=your_supabase_url_here

# Sesudah (contoh):
PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

```bash
# Sebelum:
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Sesudah (contoh):
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzI0MDAwMCwiZXhwIjoxOTM4ODE2MDAwfQ.abcdefghijklmnopqrstuvwxyz123456789
```

```bash
# Sebelum:
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Sesudah (contoh):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjIzMjQwMDAwLCJleHAiOjE5Mzg4MTYwMDB9.xyz123456789abcdefghijklmnopqrstuvwxyz
```

### Langkah 4: Save & Restart Server
1. **Save** file `.env` (Ctrl + S)
2. **Stop** dev server (Ctrl + C di terminal)
3. **Restart** server:
   ```bash
   npm run dev
   ```

### Langkah 5: Verifikasi
1. Buka browser: http://localhost:4321
2. Seharusnya tidak ada error lagi
3. Coba akses: http://localhost:4321/admin/login

---

## 📋 Checklist:

- [ ] Sudah buka Supabase Dashboard
- [ ] Sudah masuk ke Settings > API
- [ ] Sudah copy Project URL
- [ ] Sudah copy anon public key
- [ ] Sudah copy service_role key
- [ ] Sudah paste ke file .env
- [ ] Sudah save file .env
- [ ] Sudah restart npm run dev
- [ ] Website sudah bisa dibuka tanpa error

---

## 🚨 Troubleshooting:

### Masih error setelah restart?
**Cek:**
1. File `.env` ada di root project (bukan di folder src/)
2. Tidak ada spasi sebelum/sesudah `=`
3. Tidak ada tanda kutip `"` atau `'` di sekitar nilai
4. URL dimulai dengan `https://`

### Contoh yang BENAR:
```bash
PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
```

### Contoh yang SALAH:
```bash
PUBLIC_SUPABASE_URL = "https://abcdefgh.supabase.co"  ❌ (ada spasi & kutip)
PUBLIC_SUPABASE_URL=http://abcdefgh.supabase.co      ❌ (http bukan https)
PUBLIC_SUPABASE_URL= https://abcdefgh.supabase.co    ❌ (ada spasi sebelum value)
```

---

## ⚠️ PENTING:

1. **JANGAN share credentials** ini ke orang lain
2. **JANGAN commit** file `.env` ke Git (sudah ada di `.gitignore`)
3. **Service role key** sangat rahasia, bisa akses full database
4. Jika key ter-expose, regenerate di Supabase Dashboard

---

**Setelah ini, lanjut setup tabel `teachers` di Supabase!**
