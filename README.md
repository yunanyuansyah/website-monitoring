# 🌡️ Sensor Monitoring System

Website monitoring sensor yang modern, futuristik, dan interaktif dengan tema gelap. Dibangun menggunakan HTML, CSS, dan JavaScript dengan desain responsive dan fitur real-time.

## ✨ Fitur Utama

### 🔐 Sistem Autentikasi

- Login dengan email dan password
- Session management dengan localStorage
- Logout functionality
- Demo credentials: `admin@sensor.com` / `admin123`

### 📊 Dashboard Monitoring

- **Statistik Real-time**: Total sensor, data hari ini, total data, status sistem, update terakhir
- **Grafik Interaktif**: Chart.js dengan animasi smooth dan responsive
- **Tabel Data Sensor**: Menampilkan **SEMUA** data sensor tanpa limit dengan fitur search dan filter
- **Auto-refresh**: Update data setiap 30 detik
- **No Data Limit**: Semua data sensor diambil dari database tanpa batasan

### 🎨 Desain Modern & Futuristik

- Tema gelap dengan aksen biru (#00d4ff)
- Gradient backgrounds dan glassmorphism effects
- Animasi CSS yang smooth dan interaktif
- Responsive design untuk semua ukuran layar
- Custom scrollbar dan loading animations

### 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 768px (tablet), 480px (mobile)
- Flexible grid system
- Touch-friendly interface

## 🚀 Cara Menjalankan

### 1. Setup Database

Pastikan PostgreSQL sudah terinstall dan jalankan script database:

```sql
-- Jalankan file db/db_sensor.sql di PostgreSQL
psql -U postgres -d sensor_db -f db/db_sensor.sql
```

### 2. Test API (Optional)

Untuk memverifikasi bahwa limit sudah dihapus:

```bash
python test_api.py
```

### 3. Jalankan API Backend

```bash
cd esp32_dht11_temperature
python main.py
```

API akan berjalan di `http://localhost:8000`

### 4. Buka Website

Buka file `index.html` di browser atau gunakan live server:

```bash
# Jika menggunakan Python
python -m http.server 8080

# Jika menggunakan Node.js
npx live-server

# Jika menggunakan PHP
php -S localhost:8080
```

Website akan tersedia di `http://localhost:8080`

## 🏗️ Struktur File

```
├── index.html          # Halaman utama website
├── styles.css          # Styling dan animasi
├── script.js           # JavaScript functionality
├── README.md           # Dokumentasi ini
├── db/
│   └── db_sensor.sql  # Database schema
└── esp32_dht11_temperature/
    ├── main.py         # FastAPI backend
    └── esp32_dht11_temperature.ino  # Arduino code
```

## 🎯 Fitur Detail

### Login System

- Modal login dengan animasi slide-in
- Validasi form real-time
- Error handling dan notifications
- Session persistence

### Dashboard Components

- **Stats Cards**: 4 kartu statistik dengan hover effects
- **Chart Section**: Grafik line chart dengan Chart.js
- **Data Table**: Tabel responsive dengan search dan filter
- **Controls**: Time range selector dan refresh button

### Data Management

- **Real-time data fetching** dari API **tanpa limit** ⭐
- **Semua data sensor** diambil dari database
- Mock data fallback jika API offline
- Data filtering dan searching
- Auto-refresh functionality
- **Dashboard stats** dihitung dari data real database

### UI/UX Features

- Loading overlays dengan spinner
- Toast notifications
- Hover effects dan transitions
- Smooth animations
- Glassmorphism design

## 🔧 Konfigurasi

### API Configuration

Edit `script.js` untuk mengubah endpoint API:

```javascript
const API_BASE_URL = "http://localhost:8000"; // Ganti dengan URL API Anda
```

### Database Connection

Edit `main.py` untuk konfigurasi database:

```python
DB_CONFIG = {
    "host": "localhost",
    "database": "sensor_db",
    "user": "postgres",
    "password": "radiohead123",
    "port": "5432"
}
```

### Auto-refresh Interval

Ubah interval refresh di `script.js`:

```javascript
// Refresh data every 30 seconds
refreshInterval = setInterval(() => {
  refreshData();
}, 30000); // 30 detik
```

## 🎨 Customization

### Warna Tema

Edit `styles.css` untuk mengubah skema warna:

```css
:root {
  --primary-color: #00d4ff;
  --secondary-color: #0099cc;
  --background-dark: #0a0a0a;
  --background-medium: #1a1a2e;
  --background-light: #16213e;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
}
```

### Font

Ganti font family di `styles.css`:

```css
body {
  font-family: "Your-Font", sans-serif;
}
```

### Animasi

Sesuaikan durasi animasi:

```css
.animation-duration {
  animation-duration: 0.5s; /* Ganti dengan nilai yang diinginkan */
}
```

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers

## 🔒 Security Features

- Input validation
- XSS protection
- CSRF protection (dalam implementasi production)
- Secure session management

## 🚀 Performance

- Lazy loading untuk data
- Efficient DOM manipulation
- Optimized CSS animations
- Minimal external dependencies

## 🐛 Troubleshooting

### Website tidak bisa diakses

1. Pastikan file `index.html` ada di direktori yang benar
2. Gunakan live server atau web server
3. Periksa console browser untuk error

### API tidak terhubung

1. Pastikan backend FastAPI berjalan
2. Periksa URL API di `script.js`
3. Periksa firewall dan port settings

### Database error

1. Pastikan PostgreSQL berjalan
2. Periksa kredensial database
3. Jalankan script database dengan benar

### Chart tidak muncul

1. Pastikan Chart.js CDN terload
2. Periksa console untuk JavaScript errors
3. Pastikan element canvas ada dengan ID yang benar

## 📈 Roadmap

- [ ] Real-time WebSocket connection
- [ ] Multiple chart types (bar, pie, radar)
- [ ] Export data ke Excel/PDF
- [ ] User management system
- [ ] Alert/notification system
- [ ] Dark/Light theme toggle
- [ ] Multi-language support
- [ ] PWA capabilities

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail

## 📞 Support

Jika ada pertanyaan atau masalah, buat issue di repository atau hubungi developer.

---

**Dibuat dengan ❤️ menggunakan HTML, CSS, dan JavaScript**
# website-monitoring
