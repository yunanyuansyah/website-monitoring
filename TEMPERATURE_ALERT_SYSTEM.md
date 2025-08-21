# 🌡️ Temperature Alert System dengan Threshold Dinamis

## Overview

Sistem peringatan suhu yang cerdas dengan threshold yang diambil secara dinamis dari acuan baku. Sistem ini akan memberikan peringatan audio dan visual ketika suhu melewati batas maksimum yang telah ditentukan dalam standar acuan baku.

## 🎯 Fitur Utama

### 1. **Threshold Dinamis dari Acuan Baku**

- Threshold suhu diambil dari database acuan baku, bukan nilai hardcoded
- Otomatis mendeteksi acuan baku yang berkaitan dengan suhu/temperature
- Mendukung nilai minimum dan maksimum yang fleksibel

### 2. **Audio Alert Berulang**

- Suara peringatan berulang setiap 3 detik saat suhu kritis
- Audio otomatis berhenti saat suhu kembali normal
- User dapat menghentikan audio sementara dengan tombol Acknowledge

### 3. **Visual Alert yang Menarik**

- Banner merah dengan animasi pulsing dan ikon peringatan
- Status suhu yang berubah warna sesuai kondisi
- Indikator threshold yang real-time

### 4. **Smart Detection System**

- Mendeteksi perubahan suhu secara real-time
- Otomatis mengaktifkan/menonaktifkan alert
- Logging komprehensif untuk monitoring

## 🔧 Implementasi Teknis

### State Management

```javascript
let coolingSystemState = {
  isOn: false,
  currentTemp: null,
  tempSource: null,
  status: "idle",
  thresholds: {
    min: null, // Minimum temperature from acuan baku
    max: null, // Maximum temperature from acuan baku
  },
  alertState: {
    isActive: false,
    isAcknowledged: false,
    audioInterval: null,
    lastAlertTime: 0,
  },
};
```

### Loading Threshold dari Acuan Baku

```javascript
async function loadTemperatureThresholds() {
  try {
    const response = await fetch(`${API_BASE_URL}/acuan-baku`);
    const acuanData = await response.json();

    // Find temperature-related acuan baku
    const tempAcuan = acuanData.find(
      (item) =>
        item.nama_acuan &&
        (item.nama_acuan.toLowerCase().includes("suhu") ||
          item.nama_acuan.toLowerCase().includes("temperature") ||
          item.nama_acuan.toLowerCase().includes("temp"))
    );

    if (tempAcuan) {
      const minValue = parseFloat(tempAcuan.nilai_min) || null;
      const maxValue = parseFloat(tempAcuan.nilai_max) || null;

      coolingSystemState.thresholds.min = minValue;
      coolingSystemState.thresholds.max = maxValue;
    }
  } catch (error) {
    // Fallback to default thresholds
    coolingSystemState.thresholds.min = 20;
    coolingSystemState.thresholds.max = 35;
  }
}
```

### Temperature Threshold Checking

```javascript
function checkTemperatureThresholds() {
  const currentTemp = coolingSystemState.currentTemp;
  const { min, max } = coolingSystemState.thresholds;

  // Check if thresholds are loaded
  if (max === null) {
    console.log("⚠️ Temperature thresholds not loaded yet, skipping check");
    return;
  }

  // Check if temperature exceeds critical threshold
  if (currentTemp > max) {
    if (!coolingSystemState.alertState.isActive) {
      startTemperatureAlert();
    }
    coolingSystemState.status = "critical";
  }
}
```

## 🎨 UI Components

### Alert Banner

```html
<div id="temperatureAlertBanner" class="alert-banner hidden">
  <div class="alert-content">
    <i class="fas fa-exclamation-triangle"></i>
    <span class="alert-text"
      >⚠️ SUHU KRITIS! Aktifkan sistem pendingin sekarang!</span
    >
    <button id="acknowledgeAlert" class="acknowledge-btn">
      <i class="fas fa-check"></i> Acknowledge
    </button>
  </div>
</div>
```

### Threshold Display

```html
<div class="threshold-info">
  <div class="threshold-item">
    <span class="threshold-label">Min:</span>
    <span class="threshold-value">20°C</span>
  </div>
  <div class="threshold-item">
    <span class="threshold-label">Max:</span>
    <span class="threshold-value">35°C</span>
  </div>
</div>
```

### Audio Element

```html
<audio id="temperatureAlert" preload="auto">
  <source src="data:audio/wav;base64,..." type="audio/wav" />
</audio>
```

## 🎵 Audio Alert System

### Start Alert

```javascript
function startTemperatureAlert() {
  if (coolingSystemState.alertState.isActive) return;

  // Set alert state
  coolingSystemState.alertState.isActive = true;
  coolingSystemState.alertState.isAcknowledged = false;

  // Show alert banner
  const alertBanner = document.getElementById("temperatureAlertBanner");
  if (alertBanner) {
    alertBanner.classList.remove("hidden");
  }

  // Start repeating audio alert every 3 seconds
  const audioElement = document.getElementById("temperatureAlert");
  if (audioElement) {
    audioElement.play().catch((e) => console.log("Audio play failed:", e));

    coolingSystemState.alertState.audioInterval = setInterval(() => {
      if (
        coolingSystemState.alertState.isActive &&
        !coolingSystemState.alertState.isAcknowledged
      ) {
        audioElement.currentTime = 0;
        audioElement
          .play()
          .catch((e) => console.log("Audio repeat failed:", e));
      }
    }, 3000);
  }
}
```

### Stop Alert

```javascript
function stopTemperatureAlert() {
  if (!coolingSystemState.alertState.isActive) return;

  // Clear audio interval
  if (coolingSystemState.alertState.audioInterval) {
    clearInterval(coolingSystemState.alertState.audioInterval);
    coolingSystemState.alertState.audioInterval = null;
  }

  // Stop audio
  const audioElement = document.getElementById("temperatureAlert");
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  // Hide alert banner
  const alertBanner = document.getElementById("temperatureAlertBanner");
  if (alertBanner) {
    alertBanner.classList.add("hidden");
  }

  // Reset alert state
  coolingSystemState.alertState.isActive = false;
  coolingSystemState.alertState.isAcknowledged = false;
}
```

## 🔄 Workflow Sistem

### 1. **Inisialisasi**

- Load threshold dari acuan baku saat startup
- Set default threshold jika acuan baku tidak tersedia
- Initialize alert system

### 2. **Monitoring Suhu**

- Update suhu dari sensor data setiap refresh
- Check threshold setiap kali ada perubahan suhu
- Trigger alert jika suhu melewati batas maksimum

### 3. **Alert Activation**

- Tampilkan banner peringatan merah
- Mulai audio alert berulang setiap 3 detik
- Update status sistem menjadi 'critical'

### 4. **User Interaction**

- User dapat acknowledge alert (hentikan audio)
- User dapat reset alert (aktifkan kembali audio)
- User dapat mengaktifkan sistem pendingin

### 5. **Auto-Recovery**

- Alert otomatis berhenti saat suhu kembali normal
- Status sistem kembali ke 'normal' atau 'idle'
- Audio dan banner otomatis hilang

## 🎨 Styling dan Animasi

### Alert Banner Animation

```css
.alert-banner {
  background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%);
  border: 2px solid #ff3b30;
  border-radius: 12px;
  animation: alertPulse 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(255, 59, 48, 0.5);
}

@keyframes alertPulse {
  0% {
    box-shadow: 0 0 20px rgba(255, 59, 48, 0.5);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 59, 48, 0.8);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 20px rgba(255, 59, 48, 0.5);
    transform: scale(1);
  }
}
```

### Critical Temperature Flash

```css
.temperature-critical {
  animation: criticalFlash 0.5s ease-in-out infinite alternate;
}

@keyframes criticalFlash {
  from {
    background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%);
    border-color: #ff3b30;
  }
  to {
    background: linear-gradient(135deg, #ff0000 0%, #ff3b30 100%);
    border-color: #ff0000;
  }
}
```

## 📊 Threshold Management

### Acuan Baku Integration

Sistem mencari acuan baku yang berkaitan dengan suhu berdasarkan:

1. **Nama Acuan**: Mencari kata kunci 'suhu', 'temperature', 'temp'
2. **Nilai Min/Max**: Mengambil nilai minimum dan maksimum dari acuan baku
3. **Fallback**: Menggunakan threshold default jika acuan baku tidak tersedia

### Default Thresholds

```javascript
// Default values if acuan baku not available
coolingSystemState.thresholds.min = 20; // 20°C
coolingSystemState.thresholds.max = 35; // 35°C
```

### Dynamic Update

Threshold otomatis diupdate saat:

- Aplikasi startup
- Acuan baku berubah
- Refresh data

## 🧪 Testing

### Test Page

File: `test_temperature_alert.html`

Fitur testing:

- Simulator suhu dengan berbagai kondisi
- Monitor status alert system
- Console log untuk debugging
- Penjelasan fitur dan cara testing

### Test Scenarios

1. **Normal Temperature**: 25°C (tidak ada alert)
2. **High Temperature**: 32°C (monitoring, tidak ada alert)
3. **Critical Temperature**: 38°C (alert aktif)
4. **Extreme Temperature**: 45°C (alert aktif)
5. **Low Temperature**: 15°C (status aman)

### Integration Testing

1. Login sebagai Admin
2. Pastikan sistem pendingin OFF
3. Simulasikan suhu tinggi melewati threshold
4. Verifikasi alert banner dan audio
5. Test tombol Acknowledge dan Reset
6. Aktifkan sistem pendingin

## 🔒 Security & Access Control

### Admin-Only Control

- Hanya user dengan status "Admin" yang dapat mengontrol sistem pendingin
- Non-admin dapat melihat status tetapi tidak dapat mengontrol
- Alert tetap berfungsi untuk semua user

### Alert Acknowledgment

- User dapat acknowledge alert untuk menghentikan audio sementara
- Alert banner tetap terlihat sampai suhu normal
- Reset alert untuk mengaktifkan kembali audio

## 📝 Logging & Monitoring

### Console Logs

```
🌡️ Loading temperature thresholds from acuan baku...
✅ Temperature thresholds loaded from acuan baku: Min=20°C, Max=35°C
📋 Acuan baku source: Standar Suhu Ruangan
🚨 CRITICAL TEMPERATURE ALERT: 38°C exceeds maximum threshold 35°C
🔊 Starting temperature alert system...
✅ Temperature normalized: 25°C within normal range (20-35°C)
🔇 Stopping temperature alert system...
```

### Alert State Tracking

- Alert active status
- Acknowledgment status
- Audio status
- Last alert time
- Threshold values

## 🚀 Future Enhancements

### Potential Improvements

1. **Multiple Threshold Levels**: Warning, Critical, Emergency
2. **Custom Thresholds**: User-defined thresholds
3. **Threshold History**: Track threshold changes over time
4. **Advanced Audio**: Different sounds for different alert levels
5. **Mobile Notifications**: Push notifications for critical alerts
6. **Threshold Validation**: Server-side threshold validation
7. **Multi-language Support**: Localized alert messages

### API Enhancements

1. **Threshold Endpoints**: Dedicated API for threshold management
2. **Real-time Updates**: WebSocket for instant threshold changes
3. **Threshold Analytics**: Usage statistics and trends
4. **Threshold Templates**: Predefined threshold sets

## 📋 Checklist Implementasi

### ✅ Completed Features

- [x] Dynamic threshold loading from acuan baku
- [x] Audio alert system with repeating sound
- [x] Visual alert banner with animations
- [x] Smart temperature detection
- [x] User acknowledgment system
- [x] Auto-recovery when temperature normalizes
- [x] Admin access control integration
- [x] Comprehensive logging system
- [x] Fallback to default thresholds
- [x] Test page and documentation

### 🔄 In Progress

- [ ] Server-side threshold validation
- [ ] Threshold change notifications
- [ ] Advanced audio customization

### 📋 Planned Features

- [ ] Multiple alert levels
- [ ] Custom threshold management
- [ ] Mobile push notifications
- [ ] Threshold analytics dashboard

## 🎉 Summary

Sistem Temperature Alert dengan Threshold Dinamis telah berhasil diimplementasikan dengan:

- **🎯 Threshold Dinamis**: Mengambil nilai dari acuan baku secara otomatis
- **🔊 Audio Alert**: Suara peringatan berulang setiap 3 detik
- **🚨 Visual Alert**: Banner merah dengan animasi yang menarik
- **🔄 Smart Detection**: Otomatis mendeteksi dan merespon perubahan suhu
- **👥 User Control**: Acknowledge dan reset alert
- **📊 Real-time Monitoring**: Update threshold dan status secara real-time
- **🛡️ Fallback System**: Threshold default jika acuan baku tidak tersedia
- **🧪 Testing**: Halaman test yang komprehensif

Sistem sekarang dapat memberikan peringatan yang akurat berdasarkan standar acuan baku yang berlaku, sambil tetap mempertahankan fungsionalitas yang user-friendly dan aman.
