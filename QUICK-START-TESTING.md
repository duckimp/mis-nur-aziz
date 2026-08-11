# 🚀 Quick Start - Testing Guru & Staff System

## Status Setup ✅
- ✅ Environment variables configured (`.env`)
- ✅ Database table `teachers` (7 columns)
- ✅ Storage bucket `teachers` (PUBLIC, 4 RLS policies)
- ✅ Dev server running on **http://localhost:4322/**

---

## Langkah Testing Cepat

### 1️⃣ Import Data Default (11 Guru)
```
1. Buka: http://localhost:4322/admin/guru
2. Klik tombol "Impor Data Default" (icon upload, pojok kanan)
3. Tunggu ~2 detik
4. ✅ Harus muncul 11 guru dengan foto default
```

**Expected Result**:
- Total: 11 items
- Semua guru punya foto default (dari picsum.photos)
- Nama & jabatan tampil lengkap

---

### 2️⃣ Upload Foto dengan WebP Compression
```
1. Klik salah satu card guru
2. Dialog edit terbuka
3. Klik "Pilih Foto" atau drag & drop foto JPG/PNG (2-5 MB)
4. Tunggu upload selesai
5. ✅ Foto ter-compress menjadi ~150-200 KB (format .webp)
```

**Test Size Reduction**:
- Before: 2.5 MB JPG
- After: ~150 KB WebP
- Reduction: ~94%

---

### 3️⃣ CRUD Operations

**Create (Tambah Guru)**:
```
1. Klik "Tambah Guru" (tombol hijau, top-right)
2. Isi:
   - Nama: "Budi Santoso, S.Pd"
   - Jabatan: "Guru Matematika"
3. Upload foto (optional)
4. Klik "Simpan"
5. ✅ Guru baru muncul di list paling bawah
```

**Update (Edit)**:
```
1. Klik card guru
2. Edit nama atau jabatan
3. Ganti foto (optional)
4. Klik "Simpan"
5. ✅ Data ter-update, foto lama terhapus (jika diganti)
```

**Delete (Hapus)**:
```
1. Klik card guru
2. Klik tombol "Hapus" (merah)
3. Confirm
4. ✅ Guru & foto terhapus
```

---

### 4️⃣ Drag & Drop Reorder
```
1. Drag card guru (hold & drag)
2. Drop ke posisi baru
3. ✅ Order otomatis ter-update dengan smooth animation
```

**Verify di Database**:
```sql
SELECT name, order_index FROM teachers ORDER BY order_index;
-- order_index harus sequential: 0, 1, 2, 3, ...
```

---

### 5️⃣ Test Public Page
```
1. Buka: http://localhost:4322/guru
2. ✅ Menampilkan semua guru (read-only)
3. ✅ Urutan sama dengan admin page
4. ✅ Responsive: Desktop (3 col), Tablet (2 col), Mobile (1 col)
```

---

## Checklist Testing ✅

### Basic Features
- [ ] Import 11 guru default berhasil
- [ ] Upload foto terkompresi ke WebP
- [ ] Create guru baru
- [ ] Edit guru existing
- [ ] Delete guru (data + foto)
- [ ] Drag & drop reorder

### Advanced Features
- [ ] Upload foto besar (> 5 MB) → compress otomatis
- [ ] Delete guru dengan foto → foto terhapus dari storage
- [ ] Network error handling (pause network, coba save)

### Public Page
- [ ] Halaman `/guru` menampilkan data
- [ ] Responsive di mobile/tablet/desktop
- [ ] Foto loading dengan lazy loading

### Database & Storage
- [ ] No duplicate order_index
- [ ] Foto tersimpan dalam format `.webp` di storage
- [ ] RLS policies berfungsi (public read, authenticated write)

---

## Troubleshooting

### Server tidak jalan
```bash
# Kill process lama
pkill -f "astro dev"

# Restart
npm run dev
```

### Port 4321 sudah terpakai
✅ **Solved**: Server otomatis pindah ke port **4322**

### Error "Invalid supabaseUrl"
```bash
# Cek .env sudah terisi
cat .env | grep PUBLIC_SUPABASE_URL

# Restart server
npm run dev
```

### Foto tidak muncul
- Cek storage bucket `teachers` is PUBLIC
- Cek policy "Anyone can read teacher images"

---

## URLs

- **Admin Page**: http://localhost:4322/admin/guru
- **Public Page**: http://localhost:4322/guru
- **Supabase Dashboard**: https://app.supabase.com/project/zovtklnzyimqvvacvblu

---

## Next Steps

Setelah semua testing PASSED:
1. ✅ Commit & push ke Git
2. ✅ Deploy ke production (Vercel/Netlify)
3. ✅ Update env variables di production
4. ✅ Run SQL schema di production database

---

**Dev Server**: http://localhost:4322/  
**Status**: 🟢 Running  
**Last Updated**: 2026-08-11
