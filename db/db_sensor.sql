-- Set timezone
SET timezone = '+00:00';

-- Buat tabel acuan_baku
CREATE TABLE acuan_baku (
    id SERIAL PRIMARY KEY,
    min FLOAT NOT NULL,
    max FLOAT NOT NULL,
    status VARCHAR(50) DEFAULT NULL
);

-- Tambah komentar untuk kolom status
COMMENT ON COLUMN acuan_baku.status IS 'Contoh: Normal, Waspada, Bahaya';

-- Buat tabel op
CREATE TABLE op (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telp VARCHAR(20) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'Umum'
);

-- Struktur dari tabel sensor (PostgreSQL syntax)
CREATE TABLE sensor (
    id SERIAL PRIMARY KEY,
    nama_sensor VARCHAR(100) NOT NULL,
    tanggal DATE NOT NULL,
    nilai FLOAT NOT NULL,
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat tabel transaksi_op
CREATE TABLE transaksi_op (
    id SERIAL PRIMARY KEY,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_sensor INTEGER DEFAULT NULL,
    id_op INTEGER DEFAULT NULL,
    action SMALLINT DEFAULT 0
);

-- Tambah foreign key constraints
ALTER TABLE transaksi_op 
ADD CONSTRAINT transaksi_op_ibfk_1 
FOREIGN KEY (id_sensor) REFERENCES sensor(id) ON DELETE SET NULL;

ALTER TABLE transaksi_op 
ADD CONSTRAINT transaksi_op_ibfk_2 
FOREIGN KEY (id_op) REFERENCES op(id) ON DELETE SET NULL;

-- Tambah beberapa data contoh
INSERT INTO acuan_baku (min, max, status) VALUES 
(20.0, 35.0, 'Normal'),
(15.0, 40.0, 'Waspada'),
(10.0, 45.0, 'Bahaya');

INSERT INTO op (name, email, password, telp, status) VALUES 
('Admin', 'admin@sensor.com', 'admin123', '08123456789', 'Umum'),
('Operator1', 'op1@sensor.com', 'op123', '08123456788', 'Umum');