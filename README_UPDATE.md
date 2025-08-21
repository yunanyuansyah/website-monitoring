# Update Sistem Sensor Monitoring

## Perubahan yang Telah Dibuat

### 1. Modifikasi Struktur Database

- **Tabel `transaksi_op`** telah diupdate:
  - Kolom `action` diubah dari `SMALLINT` menjadi `TEXT` untuk menyimpan deskripsi aksi yang informatif
  - Kolom `additional_data` dihapus (sesuai permintaan)
  - Kolom `action` sekarang berisi informasi lengkap tentang apa yang dilakukan user/operator

### 2. Endpoint Baru yang Ditambahkan

- **`POST /register-operator`** - Untuk registrasi operator baru
- **`GET /operators`** - Untuk melihat semua operator yang terdaftar
- **`GET /transactions`** - Untuk melihat semua transaksi operator

### 3. Logging Transaksi Otomatis

- Setiap registrasi operator akan otomatis dicatat ke tabel `transaksi_op`
- Setiap data sensor yang diterima dari ESP32 juga akan dicatat
- Fungsi `log_transaction()` otomatis mencatat semua aktivitas

## Cara Menggunakan

### 1. Update Database

Jika database sudah ada, jalankan script `update_database.sql`:

```sql
-- Jalankan di PostgreSQL
\i update_database.sql
```

### 2. Jalankan API Server

```bash
cd esp32_dht11_temperature
python main.py
```

Server akan berjalan di `http://localhost:8000`

### 3. Test Registrasi Operator

Buka file `test_registration.html` di browser untuk testing:

- **Registrasi Operator**: Isi form dan klik "Registrasi Operator"
- **Lihat Operator**: Klik "Tampilkan Operator" untuk melihat semua operator
- **Lihat Transaksi**: Klik "Tampilkan Transaksi" untuk melihat log aktivitas
- **Test Sensor**: Kirim data sensor untuk testing

## Contoh Data yang Akan Tercatat

### Tabel `transaksi_op` akan berisi:

```sql
id | tanggal           | id_sensor | id_op | action
1  | 2024-01-01 10:00 | NULL      | 1     | "Registrasi operator baru: John Doe (john@example.com)"
2  | 2024-01-01 10:05 | 1         | NULL  | "Data sensor DHT11 dengan nilai 25.5 diterima dari ESP32"
3  | 2024-01-01 10:10 | NULL      | 2     | "Registrasi operator baru: Jane Smith (jane@example.com)"
```

## Struktur Kolom Action

Kolom `action` berisi deskripsi lengkap seperti:

- **Registrasi**: "Registrasi operator baru: [nama] ([email])"
- **Sensor Data**: "Data sensor [nama_sensor] dengan nilai [nilai] diterima dari ESP32"
- **Login/Logout**: "Operator [nama] melakukan login/logout"
- **Update Data**: "Operator [nama] mengupdate [jenis_data]"
- **Delete Data**: "Operator [nama] menghapus [jenis_data]"

## Keuntungan Perubahan Ini

1. **Informasi Lengkap**: Kolom `action` berisi deskripsi yang jelas dan mudah dibaca
2. **Audit Trail**: Semua aktivitas operator tercatat dengan baik
3. **Monitoring**: Bisa melacak siapa melakukan apa dan kapan
4. **Debugging**: Lebih mudah untuk troubleshooting jika ada masalah

## Troubleshooting

### Jika tabel `transaksi_op` masih kosong:

1. Pastikan API server berjalan
2. Cek koneksi database
3. Pastikan script update database sudah dijalankan
4. Coba registrasi operator baru melalui endpoint `/register-operator`

### Jika ada error:

1. Cek log server Python
2. Pastikan semua dependency terinstall (`pip install -r requirements.txt`)
3. Cek konfigurasi database di `main.py`

## File yang Telah Dimodifikasi

- `db/db_sensor.sql` - Struktur database baru
- `esp32_dht11_temperature/main.py` - API dengan endpoint baru
- `update_database.sql` - Script untuk update database existing
- `test_registration.html` - Halaman testing
- `README_UPDATE.md` - Dokumentasi ini


