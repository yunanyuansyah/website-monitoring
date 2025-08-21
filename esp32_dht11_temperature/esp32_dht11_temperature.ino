#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Konfigurasi WiFi
const char* ssid = "Sarkiyah";
const char* password = "miliran24";

// Konfigurasi pin dan tipe sensor
#define DHTPIN 4      // Pin GPIO4 untuk koneksi DHT11
#define DHTTYPE DHT11 // Tipe sensor DHT11

// URL FastAPI
const char* serverUrl = "http://192.168.1.8:8000/sensor-data";

// Inisialisasi objek DHT
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Inisialisasi Serial Monitor
  Serial.begin(115200);
  Serial.println("ESP32 DHT11 Temperature Sensor");
  
  // Koneksi WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Menghubungkan ke WiFi...");
  }
  Serial.println("WiFi terhubung!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Inisialisasi sensor DHT
  dht.begin();
  
  // Tunggu sensor stabil
  delay(2000);
}

void loop() {
  // Baca suhu dari sensor DHT11
  float temperature = dht.readTemperature();
  
  // Periksa apakah pembacaan berhasil
  if (isnan(temperature)) {
    Serial.println("Gagal membaca sensor DHT11!");
  } else {
    // Tampilkan suhu dalam Celsius
    Serial.print("Suhu: ");
    Serial.print(temperature);
    Serial.println(" °C");
    
    // Kirim data ke FastAPI
    sendToDatabase(temperature);
  }
  
  // Delay 5 detik sebelum pembacaan berikutnya
  delay(5000);
}

void sendToDatabase(float temperature) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Buat JSON payload
    String jsonPayload = "{\"nama_sensor\":\"DHT11_Temperature\",\"nilai\":" + String(temperature) + "}";
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error code: " + String(httpResponseCode));
    }
    
    http.end();
  }
}