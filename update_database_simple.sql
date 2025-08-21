-- Script sederhana untuk mengupdate struktur database
-- Jalankan di PostgreSQL

-- 1. Hapus tabel transaksi_op yang lama (jika ada)
DROP TABLE IF EXISTS transaksi_op CASCADE;

-- 2. Buat tabel transaksi_op baru
CREATE TABLE transaksi_op (
    id SERIAL PRIMARY KEY,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_sensor INTEGER DEFAULT NULL,
    id_op INTEGER DEFAULT NULL,
    action TEXT NOT NULL
);

-- 3. Tambah foreign key constraints
ALTER TABLE transaksi_op 
ADD CONSTRAINT transaksi_op_ibfk_1 
FOREIGN KEY (id_sensor) REFERENCES sensor(id) ON DELETE SET NULL;

ALTER TABLE transaksi_op 
ADD CONSTRAINT transaksi_op_ibfk_2 
FOREIGN KEY (id_op) REFERENCES op(id) ON DELETE SET NULL;

-- 4. Insert data awal
INSERT INTO transaksi_op (action, tanggal) VALUES 
('Database updated - Sistem monitoring sensor diaktifkan', CURRENT_TIMESTAMP);

-- 5. Tampilkan hasil
SELECT 'Tabel transaksi_op berhasil diupdate!' as status;
SELECT COUNT(*) as total_transactions FROM transaksi_op;
