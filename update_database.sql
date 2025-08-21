-- Script untuk mengupdate struktur database yang sudah ada
-- Jalankan script ini jika database sudah ada dan ingin diupdate

-- 1. Backup tabel transaksi_op yang ada (jika ada data)
-- CREATE TABLE transaksi_op_backup AS SELECT * FROM transaksi_op;

-- 2. Drop tabel transaksi_op yang lama
DROP TABLE IF EXISTS transaksi_op CASCADE;

-- 3. Buat ulang tabel transaksi_op dengan struktur baru
CREATE TABLE transaksi_op (
    id SERIAL PRIMARY KEY,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_sensor INTEGER DEFAULT NULL,
    id_op INTEGER DEFAULT NULL,
    action TEXT NOT NULL
);

-- 4. Tambah foreign key constraints
ALTER TABLE transaksi_op 
ADD CONSTRAINT transaksi_op_ibfk_1 
FOREIGN KEY (id_sensor) REFERENCES sensor(id) ON DELETE SET NULL;

ALTER TABLE transaksi_op 
ADD CONSTRAINT transaksi_op_ibfk_2 
FOREIGN KEY (id_op) REFERENCES op(id) ON DELETE SET NULL;

-- 5. Tambah komentar untuk kolom action
COMMENT ON COLUMN transaksi_op.action IS 'Deskripsi aksi yang dilakukan operator atau sistem';

-- 6. Insert beberapa data contoh transaksi (opsional)
INSERT INTO transaksi_op (action, tanggal) VALUES 
('Sistem monitoring sensor diaktifkan', CURRENT_TIMESTAMP),
('Database connection established', CURRENT_TIMESTAMP);

-- 7. Tampilkan struktur tabel yang baru
\d transaksi_op


