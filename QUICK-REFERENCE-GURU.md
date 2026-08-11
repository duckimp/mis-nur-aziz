# 📝 Quick Reference - Guru & Staff System

## 🎯 Quick Start

### Untuk Admin
```
1. Login: /admin/login
2. Menu: Guru & Staff
3. Upload foto: Auto-compress ke WebP
4. Reorder: Gunakan tombol ↑↓
```

### Untuk Public
```
URL: /guru (no login required)
```

## 🔧 Common Tasks

### Tambah Guru Baru
1. Buka `/admin/guru`
2. Isi nama lengkap & gelar (contoh: "Ahmad Rifai, S.Pd")
3. Isi jabatan (contoh: "Guru Kelas 1")
4. Upload foto (JPG/PNG, otomatis jadi WebP)
5. Klik **Tambah**

### Edit Guru
1. Klik tombol **Edit** pada guru yang ingin diedit
2. Ubah data yang perlu diubah
3. Ganti foto (optional)
4. Klik **Simpan**

### Hapus Guru (Admin Only)
1. Klik tombol **Hapus**
2. Konfirmasi penghapusan
3. Foto di storage juga otomatis terhapus

### Ubah Urutan Tampilan
1. Gunakan tombol ↑ (naik) atau ↓ (turun)
2. Urutan otomatis tersimpan
3. Refresh halaman untuk verifikasi

### Import 11 Guru Default
1. Jika tabel kosong, ada tombol **Impor Data**
2. Klik tombol tersebut
3. Tunggu proses selesai
4. 11 guru akan muncul di tabel

## 📸 Upload Foto Tips

### Format yang Didukung
- ✅ JPG/JPEG
- ✅ PNG
- ✅ WebP

### Best Practices
- Foto portrait/tegak (aspect ratio 3:4 ideal)
- Resolusi minimal: 400x600px
- Ukuran max: 5MB (akan auto-compress)
- Background netral lebih baik

### Hasil Auto-Compress
```
Input:  foto.jpg (2.5MB, 2000x3000px)
Output: foto-xxx.webp (~150KB, 533x800px)
Saving: 94% size reduction
```

## 🔐 Role Permissions

### Editor
- ✅ View list guru
- ✅ Add guru baru
- ✅ Edit guru
- ✅ Upload foto
- ✅ Reorder
- ❌ Delete guru

### Admin
- ✅ Semua permissions Editor
- ✅ Delete guru
- ✅ Delete foto dari storage

## 🐛 Troubleshooting

### Foto tidak muncul setelah upload
**Solusi:**
- Refresh halaman (F5)
- Cek di Supabase Storage > bucket `teachers` > ada file .webp
- Pastikan bucket `teachers` adalah PUBLIC

### Upload gagal
**Solusi:**
- Pastikan file size < 5MB
- Cek koneksi internet
- Pastikan sudah login
- Cek Supabase Storage policies

### Reorder tidak work
**Solusi:**
- Refresh halaman
- Cek browser console untuk errors
- Pastikan ada minimal 2 guru

### Data tidak muncul di halaman public
**Solusi:**
- Cek apakah sudah ada data di tabel `teachers`
- Refresh halaman /guru
- Cek browser console

## 📊 Database Queries (untuk Developer)

### Lihat semua guru
```sql
SELECT * FROM teachers ORDER BY order_index;
```

### Reset order_index
```sql
UPDATE teachers 
SET order_index = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num 
  FROM teachers
) AS subquery
WHERE teachers.id = subquery.id;
```

### Hapus semua data (HATI-HATI!)
```sql
DELETE FROM teachers;
```

### Lihat storage files
```sql
SELECT * FROM storage.objects WHERE bucket_id = 'teachers';
```

## 🔗 Useful Links

- Supabase Dashboard: https://app.supabase.com
- Public Page: `/guru`
- Admin Page: `/admin/guru`
- Documentation: `GURU-STAFF-SYSTEM.md`
- Setup Guide: `SETUP-GURU-STAFF.md`

## 💡 Tips & Tricks

1. **Batch Upload**: Upload foto satu per satu dengan edit
2. **Consistent Naming**: Gunakan format "Nama Lengkap, Gelar"
3. **Jabatan Jelas**: Gunakan jabatan yang deskriptif (mis. "Guru Kelas 1" bukan "Guru")
4. **Backup Data**: Export data berkala dari Supabase
5. **Optimize Images**: Upload foto yang sudah di-crop portrait untuk hasil terbaik

---

**Last Updated**: 11 Agustus 2026  
**Version**: 1.0.0
