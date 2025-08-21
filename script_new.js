// Global variables
let currentUser = null;
let sensorChart = null;
let sensorData = [];
let refreshInterval = null;

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
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
    
    try {
        const [sensorDataResponse, statsResponse] = await Promise.all([
            fetchSensorData(), // Tanpa limit - ambil semua data
            fetchStats()
        ]);
        
        sensorData = sensorDataResponse.data || [];
        
        updateDashboardStats(statsResponse);
        updateSensorTable(sensorData);
        
        // Gunakan data dari stats untuk grafik (lebih akurat)
        if (statsResponse.latest_data && statsResponse.latest_data.length > 0) {
            updateChart(statsResponse.latest_data);
        } else {
            updateChart(sensorData);
        }
        
        // Update last update time
        lastUpdate.textContent = new Date().toLocaleTimeString('id-ID');
        
        // Show notification with data count
        if (sensorData.length > 0) {
            showNotification(`Berhasil memuat ${sensorData.length} data sensor`, 'success');
        }
        
    } catch (error) {
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
        const response = await fetch(`${API_BASE_URL}/sensor-stats`);
        if (!response.ok) {
            throw new Error('Gagal mengambil statistik');
        }
        const stats = await response.json();
        return {
            totalSensors: stats.total_sensors,
            todayData: stats.today_data,
            totalData: stats.total_data,
            systemStatus: stats.system_status,
            latest_data: stats.latest_data || []
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback stats jika API offline
        return {
            totalSensors: sensorData.length > 0 ? [...new Set(sensorData.map(item => item.nama_sensor))].length : 0,
            todayData: sensorData.filter(item => {
                const today = new Date().toISOString().split('T')[0];
                return item.tanggal === today;
            }).length,
            totalData: sensorData.length,
            systemStatus: 'Normal',
            latest_data: []
        };
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

function updateDashboardStats(stats) {
    totalSensors.textContent = stats.totalSensors;
    todayData.textContent = stats.todayData;
    totalData.textContent = stats.totalData || 0;
    systemStatus.textContent = stats.systemStatus;
    
    // Update status color based on system status
    const statusElement = systemStatus;
    statusElement.className = '';
    
    switch (stats.systemStatus.toLowerCase()) {
        case 'normal':
            statusElement.style.color = '#00d4ff';
            break;
        case 'waspada':
            statusElement.style.color = '#ff9500';
            break;
        case 'bahaya':
            statusElement.style.color = '#ff3b30';
            break;
        default:
            statusElement.style.color = '#ffffff';
    }
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
            return 'status-normal';
        case 'dingin':
        case 'kering':
        case 'rendah':
            return 'status-warning';
        case 'panas':
        case 'lembab':
        case 'tinggi':
            return 'status-danger';
        default:
            return 'status-normal';
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
    if (!sensorChart) return;
    
    if (!data || data.length === 0) {
        console.warn('No data available for chart');
        return;
    }
    
    const chartData = processChartData(data);
    
    sensorChart.data.labels = chartData.labels;
    sensorChart.data.datasets[0].data = chartData.values;
    sensorChart.data.datasets[0].label = 'Nilai Sensor';
    
    // Update chart dengan animasi
    sensorChart.update('active');
    
    console.log(`Chart updated with ${data.length} data points`);
}

function processChartData(data) {
    // Process data for chart display
    if (!data || data.length === 0) {
        return { labels: [], values: [] };
    }
    
    // Sort data berdasarkan waktu (terbaru di kanan)
    const sortedData = data.sort((a, b) => new Date(a.waktu) - new Date(a.waktu));
    
    // Ambil maksimal 50 data point untuk chart yang smooth
    const chartData = sortedData.slice(-50);
    
    const labels = chartData.map(item => {
        const date = new Date(item.waktu);
        return date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    });
    
    const values = chartData.map(item => parseFloat(item.nilai));
    
    console.log(`Processed ${chartData.length} data points for chart`);
    console.log('Sample data:', {
        first: { time: labels[0], value: values[0] },
        last: { time: labels[labels.length - 1], value: values[labels.length - 1] }
    });
    
    return { labels, values };
}

function initializeChart() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Nilai Sensor',
                data: [],
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
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
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0, 255, 0, 0.9)' : type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 212, 255, 0.9)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 3000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
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
