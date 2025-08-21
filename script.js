// Global variables
let currentUser = null;
let sensorChart = null;
let sensorData = [];
let refreshInterval = null;

// Auto-refresh chart data
let chartRefreshInterval;

// Global variables for acuan baku
let acuanBaku = [];
let alertNotifications = [];

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const loginModal = document.getElementById('loginModal');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const userName = document.getElementById('userName');
const totalSensors = document.getElementById('totalSensors');
const todayData = document.getElementById('todayData');
const totalData = document.getElementById('totalData');
const systemStatus = document.getElementById('systemStatus');
const lastUpdate = document.getElementById('lastUpdate');
const refreshBtn = document.getElementById('refreshBtn');
const timeRange = document.getElementById('timeRange');
const searchInput = document.getElementById('searchInput');
const sensorFilter = document.getElementById('sensorFilter');
const sensorTableBody = document.getElementById('sensorTableBody');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('sensorUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        // Show login modal by default if not logged in
        showLoginModal();
    }
    
    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    refreshBtn.addEventListener('click', refreshData);
    timeRange.addEventListener('change', handleTimeRangeChange);
    searchInput.addEventListener('input', handleSearch);
    sensorFilter.addEventListener('change', handleFilter);
    
    // Initialize chart
    initializeChart();
}

// Login functionality
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Basic validation
    if (!email || !password) {
        showNotification('Email dan password harus diisi', 'error');
        return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Format email tidak valid', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // For demo purposes, we'll use hardcoded credentials
        // In production, this should call your authentication API
        if (email === 'admin@sensor.com' && password === 'admin123') {
            currentUser = {
                name: 'Admin',
                email: email,
                status: 'Umum'
            };
            
            localStorage.setItem('sensorUser', JSON.stringify(currentUser));
            showDashboard();
            showNotification('Login berhasil!', 'success');
        } else {
            throw new Error('Email atau password salah');
        }
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('sensorUser');
    showLoginModal();
    showNotification('Logout berhasil!', 'success');
    
    // Clear intervals
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function showLoginModal() {
    loginModal.classList.remove('hidden');
    dashboard.classList.add('hidden');
}

function showDashboard() {
    loginModal.classList.add('hidden');
    dashboard.classList.remove('hidden');
    
    // Update user info
    userName.textContent = currentUser.name;
    
    // Load initial data
    loadDashboardData();
    
    // Start auto-refresh
    startAutoRefresh();
}

// Dashboard functionality
async function loadDashboardData() {
    showLoading();
    console.log('🔄 Loading dashboard data...');
    
    try {
        console.log('📡 Fetching sensor data, stats, and acuan baku...');
        const [sensorDataResponse, statsResponse, acuanBakuResponse] = await Promise.all([
            fetchSensorData(), // Tanpa limit - ambil semua data
            fetchStats(),
            fetchAcuanBaku() // Load acuan baku
        ]);
        
        console.log('📊 Sensor data response:', sensorDataResponse);
        console.log('📈 Stats response:', statsResponse);
        
        sensorData = sensorDataResponse.data || [];
        console.log(`📝 Loaded ${sensorData.length} sensor records`);
        
        updateDashboardStats(statsResponse);
        updateSensorTable(sensorData);
        
        // Gunakan data dari stats untuk grafik (lebih akurat)
        if (statsResponse.latest_data && statsResponse.latest_data.length > 0) {
            console.log(`📊 Using latest_data for chart: ${statsResponse.latest_data.length} records`);
            updateChartWithAcuanBaku(statsResponse.latest_data);
        } else {
            console.log(`📊 Using sensorData for chart: ${sensorData.length} records`);
            updateChartWithAcuanBaku(sensorData);
        }
        
        // Update last update time
        lastUpdate.textContent = new Date().toLocaleTimeString('id-ID');
        
        // Show notification with data count
        if (sensorData.length > 0) {
            showNotification(`Berhasil memuat ${sensorData.length} data sensor`, 'success');
        }
        
        // Start chart auto-refresh
        startChartAutoRefresh();
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showNotification('Gagal memuat data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function fetchSensorData(limit = null) {
    try {
        // Jika tidak ada limit, ambil semua data
        const url = limit ? `${API_BASE_URL}/sensor-data?limit=${limit}` : `${API_BASE_URL}/sensor-data`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Gagal mengambil data sensor');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        // Return mock data for demo purposes
        return {
            data: generateMockData(20)
        };
    }
}

async function fetchStats() {
    try {
        console.log('📡 Fetching stats from:', `${API_BASE_URL}/sensor-stats`);
        const response = await fetch(`${API_BASE_URL}/sensor-stats`);
        
        console.log('📊 Stats response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const stats = await response.json();
        console.log('📈 Raw stats data:', stats);
        
        const processedStats = {
            totalSensors: stats.total_sensors,
            todayData: stats.today_data,
            totalData: stats.total_data,
            systemStatus: stats.system_status,
            latest_data: stats.latest_data || [],
            acuan_baku: stats.acuan_baku || [] // Assuming acuan_baku is part of stats
        };
        
        console.log('📊 Processed stats:', processedStats);
        return processedStats;
        
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        console.log('🔄 Using fallback stats...');
        
        // Fallback stats jika API offline
        const fallbackStats = {
            totalSensors: sensorData.length > 0 ? [...new Set(sensorData.map(item => item.nama_sensor))].length : 0,
            todayData: sensorData.filter(item => {
                const today = new Date().toISOString().split('T')[0];
                return item.tanggal === today;
            }).length,
            totalData: sensorData.length,
            systemStatus: 'Normal',
            latest_data: [],
            acuan_baku: []
        };
        
        console.log('📊 Fallback stats:', fallbackStats);
        return fallbackStats;
    }
}

function generateMockData(count) {
    const sensors = ['DHT11_Temp', 'DHT11_Humidity', 'LM35_Temp', 'MQ2_Gas', 'PIR_Motion'];
    const data = [];
    
    for (let i = 0; i < count; i++) {
        const sensor = sensors[Math.floor(Math.random() * sensors.length)];
        const value = Math.random() * 100;
        const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        
        data.push({
            id: i + 1,
            nama_sensor: sensor,
            tanggal: date.toISOString().split('T')[0],
            nilai: parseFloat(value.toFixed(2)),
            waktu: date.toISOString()
        });
    }
    
    return data.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
}

// Fetch acuan baku data
async function fetchAcuanBaku() {
    try {
        console.log('📋 Fetching acuan baku...');
        const response = await fetch(`${API_BASE_URL}/acuan-baku`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        acuanBaku = data.acuan_baku || [];
        
        console.log('✅ Acuan baku loaded:', acuanBaku);
        return acuanBaku;
        
    } catch (error) {
        console.error('❌ Error fetching acuan baku:', error);
        // Use default values if API fails
        acuanBaku = [
            { min: 20.0, max: 35.0, status: 'Normal' },
            { min: 15.0, max: 40.0, status: 'Waspada' },
            { min: 10.0, max: 45.0, status: 'Bahaya' }
        ];
        return acuanBaku;
    }
}

// Check sensor value against acuan baku
function checkSensorStatus(sensorName, value) {
    if (!acuanBaku || acuanBaku.length === 0) {
        return { status: 'Normal', alert_level: 'info', message: 'Acuan baku tidak tersedia' };
    }
    
    let status = 'Normal';
    let alert_level = 'success';
    let message = 'Nilai dalam batas normal';
    
    // Check against acuan baku (from most restrictive to least)
    for (let i = acuanBaku.length - 1; i >= 0; i--) {
        const acuan = acuanBaku[i];
        const min_val = acuan.min;
        const max_val = acuan.max;
        
        if (value < min_val) {
            status = 'BAHAYA';
            alert_level = 'danger';
            message = `Nilai terlalu rendah! (${value}°C < ${min_val}°C)`;
            break;
        } else if (value > max_val) {
            status = 'BAHAYA';
            alert_level = 'danger';
            message = `Nilai terlalu tinggi! (${value}°C > ${max_val}°C)`;
            break;
        } else if (min_val <= value && value <= max_val) {
            if (i === acuanBaku.length - 1) {
                status = 'Normal';
                alert_level = 'success';
                message = 'Nilai dalam batas optimal';
            } else {
                status = 'Waspada';
                alert_level = 'warning';
                message = 'Nilai dalam batas aman';
            }
            break;
        }
    }
    
    return { status, alert_level, message };
}

// Show alert notification based on sensor status
function showSensorAlert(sensorName, value, statusInfo) {
    if (statusInfo.alert_level === 'danger') {
        // Check if we already showed this alert recently
        const alertKey = `${sensorName}_${statusInfo.status}`;
        if (alertNotifications.includes(alertKey)) {
            return; // Already showed this alert
        }
        
        // Add to shown alerts
        alertNotifications.push(alertKey);
        
        // Show critical alert
        showNotification(`🚨 ${sensorName}: ${statusInfo.message}`, 'error');
        
        // Add visual alert to dashboard
        addVisualAlert(sensorName, statusInfo);
        
        // Play alert sound (if browser supports it)
        playAlertSound();
        
        console.log(`🚨 CRITICAL ALERT: ${sensorName} - ${statusInfo.message}`);
    } else if (statusInfo.alert_level === 'warning') {
        showNotification(`⚠️ ${sensorName}: ${statusInfo.message}`, 'warning');
    }
}

// Add visual alert to dashboard
function addVisualAlert(sensorName, statusInfo) {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert-item alert-${statusInfo.alert_level}`;
    alertElement.innerHTML = `
        <div class="alert-header">
            <i class="fas fa-exclamation-triangle"></i>
            <span class="alert-title">${sensorName}</span>
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="alert-message">${statusInfo.message}</div>
        <div class="alert-time">${new Date().toLocaleTimeString('id-ID')}</div>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.remove();
        }
    }, 30000);
}

// Create alert container if it doesn't exist
function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.className = 'alert-container';
    
    // Insert after stats section
    const statsSection = document.querySelector('.stats-grid');
    if (statsSection && statsSection.parentNode) {
        statsSection.parentNode.insertBefore(container, statsSection.nextSibling);
    }
    
    return container;
}

// Play alert sound
function playAlertSound() {
    try {
        // Create audio context for beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Audio alert not supported');
    }
}

// Update dashboard stats with acuan baku information
function updateDashboardStats(statsResponse) {
    try {
        // Update existing stats
        if (statsResponse.totalSensors !== undefined) {
            totalSensors.textContent = statsResponse.totalSensors;
        }
        if (statsResponse.todayData !== undefined) {
            todayData.textContent = statsResponse.todayData;
        }
        if (statsResponse.totalData !== undefined) {
            totalData.textContent = statsResponse.totalData;
        }
        
        // Update system status with acuan baku info
        if (statsResponse.systemStatus) {
            const statusElement = document.getElementById('systemStatus');
            if (statusElement) {
                statusElement.textContent = statsResponse.systemStatus;
                
                // Update status color based on system status
                statusElement.className = `status-badge status-${getStatusClass(statsResponse.systemStatus)}`;
            }
        }
        
        // Update acuan baku if available
        if (statsResponse.acuan_baku) {
            acuanBaku = statsResponse.acuan_baku;
            console.log('📋 Acuan baku updated from stats:', acuanBaku);
        }
        
        // Check for alerts in latest data
        if (statsResponse.latest_data && statsResponse.latest_data.length > 0) {
            checkLatestDataForAlerts(statsResponse.latest_data);
        }
        
    } catch (error) {
        console.error('❌ Error updating dashboard stats:', error);
    }
}

// Check latest data for alerts
function checkLatestDataForAlerts(latestData) {
    if (!latestData || latestData.length === 0) return;
    
    // Group by sensor and check latest value
    const sensorGroups = {};
    latestData.forEach(item => {
        if (!sensorGroups[item.nama_sensor]) {
            sensorGroups[item.nama_sensor] = [];
        }
        sensorGroups[item.nama_sensor].push(item);
    });
    
    // Check each sensor's latest value
    Object.keys(sensorGroups).forEach(sensorName => {
        const sensorData = sensorGroups[sensorName];
        if (sensorData.length > 0) {
            const latestValue = sensorData[0].nilai;
            const statusInfo = checkSensorStatus(sensorName, latestValue);
            
            // Show alert if needed
            showSensorAlert(sensorName, latestValue, statusInfo);
        }
    });
}

function updateSensorTable(data) {
    const tbody = sensorTableBody;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #a0a0a0;">Tidak ada data</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        
        const status = getStatusFromValue(item.nilai, item.nama_sensor);
        const statusClass = getStatusClass(status);
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nama_sensor}</td>
            <td>${formatDate(item.tanggal)}</td>
            <td>${item.nilai}</td>
            <td>${formatTime(item.waktu)}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update sensor filter options
    updateSensorFilter(data);
}

function getStatusFromValue(value, sensorName) {
    // Mock status logic - in production this should use your acuan_baku table
    if (sensorName.includes('Temp')) {
        if (value < 20) return 'Dingin';
        if (value > 35) return 'Panas';
        return 'Normal';
    } else if (sensorName.includes('Humidity')) {
        if (value < 30) return 'Kering';
        if (value > 70) return 'Lembab';
        return 'Normal';
    } else {
        if (value < 50) return 'Rendah';
        if (value > 80) return 'Tinggi';
        return 'Normal';
    }
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'normal':
            return 'normal';
        case 'waspada':
            return 'waspada';
        case 'bahaya':
            return 'bahaya';
        case 'dingin':
        case 'kering':
        case 'rendah':
            return 'waspada';
        case 'panas':
        case 'lembab':
        case 'tinggi':
            return 'bahaya';
        default:
            return 'normal';
    }
}

function updateSensorFilter(data) {
    const sensors = [...new Set(data.map(item => item.nama_sensor))];
    const filter = sensorFilter;
    
    // Keep the "Semua Sensor" option
    filter.innerHTML = '<option value="">Semua Sensor</option>';
    
    sensors.forEach(sensor => {
        const option = document.createElement('option');
        option.value = sensor;
        option.textContent = sensor;
        filter.appendChild(option);
    });
}

function updateChart(data) {
    if (!sensorChart) {
        console.warn('Chart not initialized');
        return;
    }
    
    if (!data || data.length === 0) {
        console.warn('No data available for chart');
        return;
    }
    
    try {
        const chartData = processChartData(data);
        
        if (chartData.labels.length === 0) {
            console.warn('No chart data processed');
            return;
        }
        
        // Update chart data
        sensorChart.data.labels = chartData.labels;
        sensorChart.data.datasets[0].data = chartData.values;
        sensorChart.data.datasets[0].label = 'Nilai Sensor (°C)';
        
        // Update acuan baku lines with proper data points
        updateAcuanBakuLineData(chartData.labels);
        
        // Resize chart to fit container
        sensorChart.resize();
        
        // Update chart dengan animasi smooth
        sensorChart.update('active');
        
        console.log(`✅ Chart updated successfully with ${chartData.labels.length} data points and acuan baku lines`);
        
        // Add visual feedback
        const chartContainer = document.getElementById('sensorChart').parentElement;
        chartContainer.style.border = '2px solid #00d4ff';
        setTimeout(() => {
            chartContainer.style.border = '2px solid rgba(0, 212, 255, 0.3)';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error updating chart:', error);
        showNotification('Gagal memperbarui grafik: ' + error.message, 'error');
    }
}

// Add chart resize function
function resizeChart() {
    if (sensorChart) {
        sensorChart.resize();
        console.log('📏 Chart resized');
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    resizeChart();
});

function processChartData(data) {
    // Process data for chart display
    if (!data || data.length === 0) {
        console.warn('No data to process for chart');
        return { labels: [], values: [] };
    }
    
    // Sort data by time
    const sortedData = data.sort((a, b) => new Date(a.waktu) - new Date(a.waktu));
    
    // Take only the latest 100 data points for smooth chart rendering
    const chartData = sortedData.slice(-100);
    
    // If we have too many data points, sample them for smoother chart
    let finalData = chartData;
    if (chartData.length > 30) { // Reduced from 50 to 30 for better performance
        finalData = sampleDataForChart(chartData, 30);
    }
    
    // Create smooth labels with better formatting
    const labels = finalData.map((item, index) => {
        const date = new Date(item.waktu);
        // Show time with seconds for more detail
        return date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    });
    
    const values = finalData.map(item => parseFloat(item.nilai));
    
    console.log(`📊 Chart data processed: ${finalData.length} points (from ${chartData.length} original)`);
    console.log(`📈 Value range: ${Math.min(...values).toFixed(2)} - ${Math.max(...values).toFixed(2)}`);
    console.log(`🕐 Time range: ${labels[0]} - ${labels[labels.length - 1]}`);
    
    return { labels, values };
}

function sampleDataForChart(data, targetCount) {
    if (data.length <= targetCount) return data;
    
    const step = Math.ceil(data.length / targetCount);
    const sampled = [];
    
    for (let i = 0; i < data.length; i += step) {
        sampled.push(data[i]);
    }
    
    // Always include the last data point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
    }
    
    return sampled;
}

function initializeChart() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Nilai Sensor',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.15)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3, // Smooth curve
                    pointBackgroundColor: '#00d4ff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4, // Smaller points for dense data
                    pointHoverRadius: 6,
                    pointHitRadius: 10
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Important: let us control the size
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#00d4ff',
                    bodyColor: '#ffffff',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 11
                        },
                        maxTicksLimit: 8, // Reduce x-axis labels
                        maxRotation: 45
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Waktu',
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    beginAtZero: false, // Don't start from 0
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value.toFixed(1) + '°C';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Nilai Sensor (°C)',
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            },
            elements: {
                line: {
                    borderJoinStyle: 'round'
                }
            }
        }
    });
    
    // Add acuan baku lines after chart is created
    addAcuanBakuLines();
    
    // Update legend
    updateChartLegend();
}

// Add acuan baku lines to the chart
function addAcuanBakuLines() {
    if (!sensorChart || !acuanBaku || acuanBaku.length === 0) {
        return;
    }

    // Remove existing acuan baku datasets
    sensorChart.data.datasets = sensorChart.data.datasets.filter(dataset => 
        !dataset.label.includes('°C') || dataset.label === 'Nilai Sensor'
    );

    // Add new lines for acuan baku
    acuanBaku.forEach((acuan, index) => {
        // Create horizontal line for min value
        const minLine = {
            type: 'line',
            label: `Min: ${acuan.min}°C`,
            data: [],
            borderColor: getAcuanLineColor(index, 'min'),
            borderDash: [8, 4], // Dashed line
            borderWidth: 2,
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0
        };

        // Create horizontal line for max value
        const maxLine = {
            type: 'line',
            label: `Max: ${acuan.max}°C`,
            data: [],
            borderColor: getAcuanLineColor(index, 'max'),
            borderDash: [8, 4], // Dashed line
            borderWidth: 2,
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0
        };

        // Add to datasets
        sensorChart.data.datasets.push(minLine, maxLine);
    });

    console.log(`📏 Added ${acuanBaku.length * 2} acuan baku lines to chart`);
}

// Get color for acuan baku lines based on priority
function getAcuanLineColor(index, type) {
    const colors = [
        { min: 'rgba(52, 199, 89, 0.6)', max: 'rgba(52, 199, 89, 0.6)' }, // Green - Normal
        { min: 'rgba(255, 149, 0, 0.6)', max: 'rgba(255, 149, 0, 0.6)' }, // Orange - Waspada
        { min: 'rgba(255, 59, 48, 0.6)', max: 'rgba(255, 59, 48, 0.6)' }  // Red - Bahaya
    ];
    
    return colors[index] ? colors[index][type] : 'rgba(255, 255, 255, 0.4)';
}

// Update chart with acuan baku lines
function updateChartWithAcuanBaku(data) {
    if (!sensorChart) return;
    
    const chartData = processChartData(data);
    
    if (chartData.labels.length === 0) {
        console.warn('No chart data processed');
        return;
    }
    
    // Update main sensor data
    sensorChart.data.labels = chartData.labels;
    sensorChart.data.datasets[0].data = chartData.values;
    sensorChart.data.datasets[0].label = 'Nilai Sensor (°C)';
    
    // Update acuan baku lines with proper data points
    updateAcuanBakuLineData(chartData.labels);
    
    // Update chart
    sensorChart.update('active');
    
    console.log(`✅ Chart updated with ${chartData.labels.length} data points and acuan baku lines`);
}

// Update acuan baku line data to span across all time labels
function updateAcuanBakuLineData(labels) {
    if (!acuanBaku || acuanBaku.length === 0) return;
    
    // Find acuan baku datasets (lines with °C in label)
    const acuanDatasets = sensorChart.data.datasets.filter(dataset => 
        dataset.label.includes('°C') && dataset.label !== 'Nilai Sensor (°C)'
    );
    
    acuanDatasets.forEach(dataset => {
        // Extract the value from label (e.g., "Min: 20.0°C" -> 20.0)
        const valueMatch = dataset.label.match(/(\d+\.?\d*)°C/);
        if (valueMatch) {
            const value = parseFloat(valueMatch[1]);
            // Create horizontal line by repeating the same value for all time points
            dataset.data = new Array(labels.length).fill(value);
        }
    });
}

// Refresh acuan baku lines on chart
function refreshAcuanBakuLines() {
    if (!sensorChart) return;
    
    // Remove existing acuan baku lines
    sensorChart.data.datasets = sensorChart.data.datasets.filter(dataset => 
        !dataset.label.includes('°C') || dataset.label === 'Nilai Sensor'
    );
    
    // Add new lines
    addAcuanBakuLines();
    
    // Update chart
    if (sensorChart.data.labels.length > 0) {
        updateAcuanBakuLineData(sensorChart.data.labels);
        sensorChart.update('active');
    }
    
    console.log('🔄 Acuan baku lines refreshed');
}

// Update chart legend with acuan baku information
function updateChartLegend() {
    const legendContainer = document.getElementById('chartLegend');
    if (!legendContainer || !acuanBaku || acuanBaku.length === 0) return;
    
    // Keep the sensor data legend
    const sensorLegend = legendContainer.querySelector('.legend-item');
    legendContainer.innerHTML = '';
    legendContainer.appendChild(sensorLegend);
    
    // Add acuan baku legend items
    acuanBaku.forEach((acuan, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorClass = index === 0 ? 'acuan-normal' : 
                          index === 1 ? 'acuan-waspada' : 'acuan-bahaya';
        
        legendItem.innerHTML = `
            <div class="legend-color ${colorClass}"></div>
            <span>${acuan.min}°C - ${acuan.max}°C (${acuan.status || 'Range'})</span>
        `;
        
        legendContainer.appendChild(legendItem);
    });
    
    console.log('📋 Chart legend updated with acuan baku');
}

// Update acuan baku and refresh chart
async function updateAcuanBakuAndChart() {
    try {
        // Fetch latest acuan baku
        await fetchAcuanBaku();
        
        // Refresh lines on chart
        refreshAcuanBakuLines();
        
        // Update legend
        updateChartLegend();
        
        console.log('✅ Acuan baku updated and chart refreshed');
        
    } catch (error) {
        console.error('❌ Error updating acuan baku and chart:', error);
    }
}

// Event handlers
function handleTimeRangeChange() {
    const range = timeRange.value;
    // In production, this should filter data based on time range
    console.log('Time range changed to:', range);
    refreshData();
}

function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredData = sensorData.filter(item => 
        item.nama_sensor.toLowerCase().includes(searchTerm) ||
        item.nilai.toString().includes(searchTerm)
    );
    updateSensorTable(filteredData);
}

function handleFilter() {
    const selectedSensor = sensorFilter.value;
    let filteredData = sensorData;
    
    if (selectedSensor) {
        filteredData = sensorData.filter(item => item.nama_sensor === selectedSensor);
    }
    
    updateSensorTable(filteredData);
}

function refreshData() {
    loadDashboardData();
}

function startAutoRefresh() {
    // Refresh data every 30 seconds
    refreshInterval = setInterval(() => {
        refreshData();
    }, 30000);
}

// Auto-refresh chart data
function startChartAutoRefresh() {
    // Stop existing interval if any
    if (chartRefreshInterval) {
        clearInterval(chartRefreshInterval);
    }
    
    // Refresh chart every 10 seconds
    chartRefreshInterval = setInterval(async () => {
        try {
            console.log('🔄 Auto-refreshing chart data...');
            const statsResponse = await fetchStats();
            
            if (statsResponse.latest_data && statsResponse.latest_data.length > 0) {
                updateChartWithAcuanBaku(statsResponse.latest_data);
                console.log('✅ Chart auto-refreshed');
            }
        } catch (error) {
            console.warn('⚠️ Auto-refresh failed:', error.message);
        }
    }, 10000); // 10 seconds
    
    console.log('🔄 Chart auto-refresh started (every 10s)');
}

function stopChartAutoRefresh() {
    if (chartRefreshInterval) {
        clearInterval(chartRefreshInterval);
        chartRefreshInterval = null;
        console.log('⏹️ Chart auto-refresh stopped');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add status badge styles
const statusStyles = document.createElement('style');
statusStyles.textContent = `
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-normal {
        background: rgba(0, 212, 255, 0.2);
        color: #00d4ff;
        border: 1px solid rgba(0, 212, 255, 0.3);
    }
    
    .status-warning {
        background: rgba(255, 149, 0, 0.2);
        color: #ff9500;
        border: 1px solid rgba(255, 149, 0, 0.3);
    }
    
    .status-danger {
        background: rgba(255, 59, 48, 0.2);
        color: #ff3b30;
        border: 1px solid rgba(255, 59, 48, 0.3);
    }
`;

document.head.appendChild(statusStyles);

// Error handling for API calls
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('Terjadi kesalahan sistem', 'error');
});

// Handle offline/online status
window.addEventListener('online', function() {
    showNotification('Koneksi internet tersambung', 'success');
    refreshData();
});

window.addEventListener('offline', function() {
    showNotification('Koneksi internet terputus', 'error');
});

// Cleanup intervals on page unload
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    if (chartRefreshInterval) {
        clearInterval(chartRefreshInterval);
    }
    console.log('🧹 Cleanup completed');
});

// Acuan Baku Modal Management
function openAcuanBakuModal() {
    const modal = document.getElementById('acuanBakuModal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    // Load acuan baku data
    loadAcuanBakuList();
}

function closeAcuanBakuModal() {
    const modal = document.getElementById('acuanBakuModal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
    
    // Reset form
    resetAcuanForm();
}

// Load and display acuan baku list
async function loadAcuanBakuList() {
    try {
        const acuanData = await fetchAcuanBaku();
        displayAcuanBakuList(acuanData);
    } catch (error) {
        console.error('Error loading acuan baku list:', error);
        showNotification('Gagal memuat daftar acuan baku', 'error');
    }
}

// Display acuan baku list
function displayAcuanBakuList(acuanData) {
    const listContainer = document.getElementById('acuanBakuList');
    
    if (!acuanData || acuanData.length === 0) {
        listContainer.innerHTML = `
            <div class="acuan-item">
                <div class="acuan-info">
                    <div class="acuan-range">Belum ada acuan baku</div>
                    <div class="acuan-status">Klik "Tambah Baru" untuk membuat acuan baku pertama</div>
                </div>
            </div>
        `;
        return;
    }
    
    const listHTML = acuanData.map(acuan => `
        <div class="acuan-item" data-id="${acuan.id}">
            <div class="acuan-info">
                <div class="acuan-range">${acuan.min}°C - ${acuan.max}°C</div>
                <div class="acuan-status">${acuan.status || 'Range ' + acuan.min + '-' + acuan.max}</div>
            </div>
            <div class="acuan-actions">
                <button class="btn-edit" onclick="editAcuanBaku(${acuan.id}, ${acuan.min}, ${acuan.max}, '${acuan.status || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteAcuanBaku(${acuan.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    listContainer.innerHTML = listHTML;
}

// Show add acuan form
function showAddAcuanForm() {
    const form = document.getElementById('acuanForm');
    const formTitle = document.getElementById('formTitle');
    const acuanId = document.getElementById('acuanId');
    
    formTitle.textContent = 'Tambah Acuan Baku Baru';
    acuanId.value = '';
    
    // Reset form fields
    document.getElementById('acuanMin').value = '';
    document.getElementById('acuanMax').value = '';
    document.getElementById('acuanStatus').value = '';
    
    form.classList.remove('hidden');
}

// Show edit acuan form
function editAcuanBaku(id, min, max, status) {
    const form = document.getElementById('acuanForm');
    const formTitle = document.getElementById('formTitle');
    const acuanId = document.getElementById('acuanId');
    
    formTitle.textContent = 'Edit Acuan Baku';
    acuanId.value = id;
    
    // Fill form fields
    document.getElementById('acuanMin').value = min;
    document.getElementById('acuanMax').value = max;
    document.getElementById('acuanStatus').value = status;
    
    form.classList.remove('hidden');
}

// Cancel acuan form
function cancelAcuanForm() {
    const form = document.getElementById('acuanForm');
    form.classList.add('hidden');
    resetAcuanForm();
}

// Reset acuan form
function resetAcuanForm() {
    document.getElementById('acuanBakuForm').reset();
    document.getElementById('acuanId').value = '';
}

// Handle acuan baku form submission
async function handleAcuanBakuSubmit(event) {
    event.preventDefault();
    
    const acuanId = document.getElementById('acuanId').value;
    const min = parseFloat(document.getElementById('acuanMin').value);
    const max = parseFloat(document.getElementById('acuanMax').value);
    const status = document.getElementById('acuanStatus').value;
    
    // Validation
    if (min >= max) {
        showNotification('Nilai minimum harus lebih kecil dari maksimum', 'error');
        return;
    }
    
    try {
        let response;
        
        if (acuanId) {
            // Update existing
            response = await updateAcuanBaku(parseInt(acuanId), { min, max, status });
            showNotification('Acuan baku berhasil diupdate', 'success');
        } else {
            // Create new
            response = await createAcuanBaku({ min, max, status });
            showNotification('Acuan baku berhasil dibuat', 'success');
        }
        
        // Reload list and refresh dashboard
        await loadAcuanBakuList();
        await updateAcuanBakuAndChart();
        await refreshData();
        
        // Hide form
        cancelAcuanForm();
        
    } catch (error) {
        console.error('Error saving acuan baku:', error);
        showNotification('Gagal menyimpan acuan baku: ' + error.message, 'error');
    }
}

// Create new acuan baku
async function createAcuanBaku(acuanData) {
    const response = await fetch(`${API_BASE_URL}/acuan-baku`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(acuanData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Gagal membuat acuan baku');
    }
    
    return await response.json();
}

// Update existing acuan baku
async function updateAcuanBaku(acuanId, acuanData) {
    const response = await fetch(`${API_BASE_URL}/acuan-baku/${acuanId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(acuanData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Gagal mengupdate acuan baku');
    }
    
    return await response.json();
}

// Delete acuan baku
async function deleteAcuanBaku(acuanId) {
    if (!confirm('Apakah Anda yakin ingin menghapus acuan baku ini?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/acuan-baku/${acuanId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Gagal menghapus acuan baku');
        }
        
        showNotification('Acuan baku berhasil dihapus', 'success');
        
        // Reload list and refresh dashboard
        await loadAcuanBakuList();
        await updateAcuanBakuAndChart();
        await refreshData();
        
    } catch (error) {
        console.error('Error deleting acuan baku:', error);
        showNotification('Gagal menghapus acuan baku: ' + error.message, 'error');
    }
}
