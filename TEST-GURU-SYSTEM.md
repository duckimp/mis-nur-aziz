# Testing Checklist - Sistem Guru & Staff

## Pre-Testing
- [x] Environment variables sudah diisi (`.env`)
- [x] Database tabel `teachers` sudah dibuat
- [x] Storage bucket `teachers` sudah dibuat (PUBLIC)
- [x] RLS policies sudah aktif (4 policies)
- [ ] Dev server running (`npm run dev`)

## 1. Test Import Data Default
**URL**: http://localhost:4321/admin/guru

**Steps**:
1. Buka halaman `/admin/guru`
2. Klik tombol "Impor Data Default" (icon upload)
3. **Expected**: 
   - Loading indicator muncul
   - Success notification: "Berhasil mengimpor 11 guru"
   - List menampilkan 11 guru dengan foto default
   - Total: 11 items

**Verify Database**:
```sql
SELECT COUNT(*) FROM teachers; -- Should return 11
SELECT name, role, order_index FROM teachers ORDER BY order_index;
```

---

## 2. Test Upload Foto (WebP Compression)
**URL**: http://localhost:4321/admin/guru

**Steps**:
1. Pilih salah satu guru dari list
2. Klik card guru → Dialog terbuka
3. Klik "Pilih Foto" atau drag & drop foto (JPG/PNG, misal 2-3 MB)
4. **Expected**:
   - Preview foto muncul
   - Loading indicator saat upload
   - Foto ter-upload dan terkompresi ke WebP
   - Size reduction: ~94% (2.5MB → ~150KB)
   - Success notification

**Verify Storage**:
- Buka Supabase Dashboard → Storage → `teachers` bucket
- File harus format `.webp`
- Size harus jauh lebih kecil dari original

---

## 3. Test CRUD Operations

### A. Create (Tambah Guru Baru)
**Steps**:
1. Klik tombol "Tambah Guru" (hijau, top-right)
2. Isi form:
   - Nama: "Budi Santoso, S.Pd"
   - Jabatan: "Guru Matematika"
3. Upload foto (optional)
4. Klik "Simpan"
5. **Expected**:
   - Dialog tertutup
   - Guru baru muncul di list (paling bawah)
   - Total items bertambah
   - Success notification

### B. Read (View)
**Steps**:
1. Scroll list guru
2. **Expected**:
   - Semua foto loading dengan lazy loading
   - Nama dan jabatan tampil jelas
   - Card hover effect bekerja

### C. Update (Edit)
**Steps**:
1. Klik salah satu guru
2. Edit nama atau jabatan
3. Ganti foto (optional)
4. Klik "Simpan"
5. **Expected**:
   - Data ter-update
   - Foto lama terhapus dari storage (jika diganti)
   - Success notification

### D. Delete (Hapus)
**Steps**:
1. Klik salah satu guru
2. Klik tombol "Hapus" (merah)
3. Confirm dialog muncul
4. Klik "Hapus" lagi
5. **Expected**:
   - Guru terhapus dari list
   - Foto terhapus dari storage
   - Total items berkurang
   - Success notification

---

## 4. Test Drag & Drop Reorder
**URL**: http://localhost:4321/admin/guru

**Steps**:
1. Drag card guru dari posisi bawah ke atas
2. Drop di posisi yang diinginkan
3. **Expected**:
   - Card berpindah posisi dengan smooth animation
   - Order index ter-update otomatis
   - Success notification: "Urutan berhasil diperbarui"

**Verify Database**:
```sql
SELECT name, order_index FROM teachers ORDER BY order_index;
-- order_index harus sequential: 0, 1, 2, 3, ...
```

---

## 5. Test Public Page
**URL**: http://localhost:4321/guru

**Steps**:
1. Buka halaman public `/guru`
2. **Expected**:
   - Menampilkan semua guru dalam grid responsive
   - Foto loading dengan lazy loading
   - Nama dan jabatan tampil
   - Urutan sesuai dengan `order_index` (sama seperti admin)
   - Tidak ada tombol edit/hapus (read-only)

**Test Responsive**:
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

---

## 6. Test Edge Cases

### A. Upload Foto Besar
**Steps**:
1. Upload foto > 5 MB
2. **Expected**:
   - Foto ter-compress hingga ~150-200 KB
   - Upload sukses
   - Kualitas foto masih bagus

### B. Upload Non-Image File
**Steps**:
1. Coba upload PDF/DOC
2. **Expected**:
   - Error notification: "File harus berupa gambar"
   - Upload dibatalkan

### C. Delete Guru dengan Foto
**Steps**:
1. Hapus guru yang punya foto
2. **Expected**:
   - Data terhapus dari database
   - Foto terhapus dari storage
   - Tidak ada orphan files di storage

### D. Network Error Handling
**Steps**:
1. Matikan internet / pause network di DevTools
2. Coba save/upload
3. **Expected**:
   - Error notification muncul
   - Form tidak reset
   - User bisa retry setelah koneksi kembali

---

## 7. Security Check

### A. RLS Policies
**Test Public Read**:
1. Buka `/guru` (public page)
2. **Expected**: Data tampil tanpa login

**Test Storage Access**:
1. Copy URL foto dari storage
2. Paste di browser (incognito)
3. **Expected**: Foto tampil (public bucket)

---

## 8. Database Integrity

**Run Queries**:
```sql
-- Check no duplicate order_index
SELECT order_index, COUNT(*) 
FROM teachers 
GROUP BY order_index 
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Check all records
SELECT name, role, order_index, image_url FROM teachers ORDER BY order_index;
```

---

## Troubleshooting

### Error: "Invalid supabaseUrl"
- Cek `.env` → `PUBLIC_SUPABASE_URL` harus diisi
- Restart dev server: `npm run dev`

### Error: "Failed to upload image"
- Cek storage bucket `teachers` sudah dibuat
- Cek policies (4 policies harus aktif)
- Cek size limit di Supabase (default 50 MB)

### Error: "Failed to import data"
- Cek tabel `teachers` sudah dibuat
- Cek RLS policies untuk INSERT
- Cek console untuk detail error

### Foto tidak muncul di public page
- Cek storage bucket `teachers` is PUBLIC
- Cek policy "Anyone can read teacher images" (SELECT)
- Cek CORS settings di Supabase

---

## Success Criteria ✅

Sistem dianggap **production-ready** jika:
- [ ] Import 11 guru default berhasil
- [ ] Upload foto berhasil dengan compression WebP (94% reduction)
- [ ] CRUD operations berjalan lancar (Create, Read, Update, Delete)
- [ ] Drag & drop reorder bekerja dengan smooth
- [ ] Public page menampilkan data dengan benar
- [ ] Responsive di semua device
- [ ] Tidak ada error di console
- [ ] RLS policies berfungsi dengan baik
- [ ] Storage bucket cleanup otomatis saat delete

---

**Last Updated**: 2026-08-11  
**Status**: Ready for Testing 🚀
