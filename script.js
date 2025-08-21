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

// Cooling System Control Variables
let coolingSystemState = {
  isOn: false,
  currentTemp: null,
  tempSource: null,
  status: 'idle',
  thresholds: {
    min: null,           // Minimum temperature from acuan baku
    max: null            // Maximum temperature from acuan baku
  },
  alertState: {
    isActive: false,
    isAcknowledged: false,
    audioInterval: null,
    lastAlertTime: 0
  }
};

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

// Temperature Info Section Elements
const temperatureInfoSection = document.getElementById('temperatureInfoSection');
const initialTempValue = document.getElementById('initialTempValue');
const initialTempSource = document.getElementById('initialTempSource');
const initialStatusIndicator = document.getElementById('initialStatusIndicator');
const initialStatusText = document.getElementById('initialStatusText');
const initialLastUpdate = document.getElementById('initialLastUpdate');

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ Global error caught:', e.error);
    console.error('❌ Error details:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Unhandled promise rejection:', e.reason);
});

// Fallback initialization if DOMContentLoaded doesn't fire
if (document.readyState === 'loading') {
    console.log('📝 Document still loading, waiting for DOMContentLoaded...');
} else {
    console.log('📝 Document already loaded, initializing immediately...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔄 DOMContentLoaded fired after script load');
    });
}

// Hide loading indicator function
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
        console.log('✅ Loading indicator hidden');
    }
}

// Show loading indicator function
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
        console.log('🔄 Loading indicator shown');
    }
}

// DOM Content Loaded handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded successfully');
    
    try {
        // Check if essential elements exist
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const dashboard = document.getElementById('dashboard');
        const temperatureInfoSection = document.getElementById('temperatureInfoSection');
        
        console.log('🔍 Essential elements check:', {
            loginModal: !!loginModal,
            registerModal: !!registerModal,
            dashboard: !!dashboard,
            temperatureInfoSection: !!temperatureInfoSection
        });
        
        if (!loginModal || !registerModal || !dashboard || !temperatureInfoSection) {
            throw new Error('Essential HTML elements not found');
        }
        
        // Hide loading indicator
        hideLoadingIndicator();
        
        // Initialize app
        console.log('🚀 Initializing application...');
        initializeApp();
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        
        // Hide loading indicator
        hideLoadingIndicator();
        
        // Show error message on page
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1a1a2e;
                color: #ff3b30;
                padding: 2rem;
                border-radius: 10px;
                border: 2px solid #ff3b30;
                text-align: center;
                font-family: Arial, sans-serif;
                z-index: 9999;
            ">
                <h2>❌ Error Loading Website</h2>
                <p>${error.message}</p>
                <p>Silakan buka Developer Console (F12) untuk detail error</p>
                <button onclick="location.reload()" style="
                    background: #ff3b30;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 1rem;
                ">Reload Page</button>
            </div>
        `;
    }
});

function initializeApp() {
    console.log('🚀 Initializing application...');
    
    try {
        // Check if essential elements exist
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const dashboard = document.getElementById('dashboard');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const logoutBtn = document.getElementById('logoutBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const timeRange = document.getElementById('timeRange');
        const searchInput = document.getElementById('searchInput');
        const sensorFilter = document.getElementById('sensorFilter');
        
        console.log('🔍 Essential elements check:', {
            loginModal: !!loginModal,
            registerModal: !!registerModal,
            dashboard: !!dashboard,
            loginForm: !!loginForm,
            registerForm: !!registerForm,
            logoutBtn: !!logoutBtn,
            refreshBtn: !!refreshBtn,
            timeRange: !!timeRange,
            searchInput: !!searchInput,
            sensorFilter: !!sensorFilter
        });
        
        // Check critical elements
        if (!loginModal || !registerModal || !dashboard) {
            throw new Error('Critical HTML elements not found');
        }
        
        // Setup enhanced input handling
        console.log('🔧 Setting up input focus handling...');
        setupInputFocusHandling();
        
        // Event listeners with null checks
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            console.log('✅ Login form event listener added');
        } else {
            console.warn('⚠️ Login form not found');
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
            console.log('✅ Register form event listener added');
        } else {
            console.warn('⚠️ Register form not found');
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
            console.log('✅ Logout button event listener added');
        } else {
            console.warn('⚠️ Logout button not found');
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshData);
            console.log('✅ Refresh button event listener added');
        } else {
            console.warn('⚠️ Refresh button not found');
        }
        
        if (timeRange) {
            timeRange.addEventListener('change', handleTimeRangeChange);
            console.log('✅ Time range event listener added');
        } else {
            console.warn('⚠️ Time range not found');
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            console.log('✅ Search input event listener added');
        } else {
            console.warn('⚠️ Search input not found');
        }
        
        if (sensorFilter) {
            sensorFilter.addEventListener('change', handleFilter);
            console.log('✅ Sensor filter event listener added');
        } else {
            console.warn('⚠️ Sensor filter not found');
        }
        
        // Test API connectivity
        console.log('🌐 Testing API connectivity...');
        testAPIConnectivity();
        
        // Initialize chart
        console.log('📊 Initializing chart...');
        initializeChart();
        
        console.log('✅ Application initialization completed');
        
        // Show temperature info section initially
        showTemperatureInfoSection();
        
        // Check if user is already logged in and show appropriate view
        console.log('🔐 Checking user login status...');
        const savedUser = localStorage.getItem('sensorUser');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                // Safety check for user data structure
                if (currentUser && currentUser.name && currentUser.email) {
                    console.log('👤 User found in localStorage:', currentUser.name);
                    showDashboard();
                } else {
                    console.warn('⚠️ Invalid user data in localStorage:', currentUser);
                    localStorage.removeItem('sensorUser');
                    currentUser = null;
                    // Keep showing temperature info section
                }
            } catch (parseError) {
                console.error('❌ Error parsing saved user:', parseError);
                localStorage.removeItem('sensorUser');
                currentUser = null;
                // Keep showing temperature info section
            }
        } else {
            console.log('👤 No user found, showing temperature info section');
            // Keep showing temperature info section
        }
        
        // Start updating temperature info
        startTemperatureInfoUpdates();
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        throw error;
    }
}

// Show temperature info section
function showTemperatureInfoSection() {
    console.log('🌡️ Showing temperature info section...');
    
    // Hide dashboard
    if (dashboard) {
        dashboard.classList.add('hidden');
        console.log('✅ Dashboard hidden');
    }
    
    // Hide login modal
    if (loginModal) {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('show');
        console.log('✅ Login modal hidden');
    }
    
    // Show temperature info section
    if (temperatureInfoSection) {
        temperatureInfoSection.style.display = 'flex';
        console.log('✅ Temperature info section displayed');
    }
    
    // Update temperature info immediately
    updateTemperatureInfo();
    
    console.log('🌡️ Successfully switched to temperature info view');
}

// Start updating temperature info
function startTemperatureInfoUpdates() {
    console.log('🔄 Starting temperature info updates...');
    
    // Update immediately
    updateTemperatureInfo();
    
    // Update every 10 seconds
    setInterval(updateTemperatureInfo, 10000);
}

// Update temperature info display
async function updateTemperatureInfo() {
    try {
        console.log('🌡️ Updating temperature info...');
        
        // Try to fetch latest sensor data
        let latestTemp = null;
        let tempSource = 'Unknown Sensor';
        let status = 'Normal';
        
        try {
            const response = await fetch(`${API_BASE_URL}/sensor-stats`);
            if (response.ok) {
                const stats = await response.json();
                if (stats.latest_data && stats.latest_data.length > 0) {
                    // Find temperature sensor data
                    const tempData = stats.latest_data.find(item => 
                        item.nama_sensor && 
                        (item.nama_sensor.toLowerCase().includes('temp') || 
                         item.nama_sensor.toLowerCase().includes('suhu') ||
                         item.nama_sensor.toLowerCase().includes('dht'))
                    );
                    
                    if (tempData) {
                        latestTemp = tempData.nilai;
                        tempSource = tempData.nama_sensor;
                        
                        // Determine status based on temperature
                        if (latestTemp > 35) {
                            status = 'High';
                        } else if (latestTemp < 20) {
                            status = 'Low';
                        } else {
                            status = 'Normal';
                        }
                        
                        console.log(`✅ Temperature data updated: ${latestTemp}°C from ${tempSource}`);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ API call failed, using mock data:', error);
            // Use mock data if API fails
            latestTemp = Math.random() * 20 + 20; // Random temp between 20-40°C
            tempSource = 'DHT11_Temp (Demo)';
            status = 'Demo';
        }
        
        // Update UI elements
        if (initialTempValue) {
            initialTempValue.textContent = latestTemp ? latestTemp.toFixed(1) : '--';
        }
        
        if (initialTempSource) {
            initialTempSource.textContent = tempSource;
        }
        
        if (initialStatusText) {
            initialStatusText.textContent = status;
        }
        
        if (initialLastUpdate) {
            initialLastUpdate.textContent = `Last update: ${new Date().toLocaleTimeString('id-ID')}`;
        }
        
        // Update status indicator color
        if (initialStatusIndicator) {
            const statusIcon = initialStatusIndicator.querySelector('i');
            if (statusIcon) {
                if (status === 'High') {
                    statusIcon.style.color = '#ff3b30';
                } else if (status === 'Low') {
                    statusIcon.style.color = '#00d4ff';
                } else {
                    statusIcon.style.color = '#34c759';
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error updating temperature info:', error);
    }
}

// Modal management functions
function showLoginModal() {
    console.log('🔐 Showing login modal...');
    
    // Hide temperature info section
    if (temperatureInfoSection) {
        temperatureInfoSection.style.display = 'none';
    }
    
    // Show login modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('hidden');
        loginModal.classList.add('show');
        console.log('✅ Login modal shown');
    }
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('hidden');
    console.log('📝 Register modal shown');
}

function hideAllModals() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('registerModal').classList.add('hidden');
    console.log('🚫 All modals hidden');
}

// Enhanced input focus handling for both modals
function setupInputFocusHandling() {
    console.log('🔧 Setting up input focus handling...');
    
    const inputGroups = document.querySelectorAll('.input-group');
    console.log('📝 Found input groups:', inputGroups.length);
    
    if (inputGroups.length === 0) {
        console.warn('⚠️ No input groups found, skipping focus handling setup');
        return;
    }
    
    inputGroups.forEach((group, index) => {
        const input = group.querySelector('input');
        const select = group.querySelector('select');
        const icon = group.querySelector('i');
        
        // Handle input elements
        if (input) {
            console.log(`📝 Setting up focus handling for input ${index + 1}:`, input.id || input.placeholder);
            
            input.addEventListener('focus', () => {
                group.classList.add('focused');
                group.classList.remove('error', 'success');
            });
            
            input.addEventListener('blur', () => {
                group.classList.remove('focused');
                
                // Validate on blur
                if (input.value.trim()) {
                    if (input.type === 'email') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (emailRegex.test(input.value.trim())) {
                            group.classList.add('success');
                            group.classList.remove('error');
                        } else {
                            group.classList.add('error');
                            group.classList.remove('success');
                        }
                    } else if (input.type === 'password') {
                        if (input.value.length >= 6) {
                            group.classList.add('success');
                            group.classList.remove('error');
                        } else {
                            group.classList.add('error');
                            group.classList.remove('success');
                        }
                    } else {
                        group.classList.add('success');
                        group.classList.remove('error');
                    }
                } else {
                    group.classList.remove('success', 'error');
                }
            });
            
            input.addEventListener('input', () => {
                if (group.classList.contains('error')) {
                    group.classList.remove('error');
                }
            });
        }
        
        // Handle select elements
        if (select) {
            console.log(`📝 Setting up focus handling for select ${index + 1}:`, select.id || 'unnamed');
            
            select.addEventListener('focus', () => {
                group.classList.add('focused');
                group.classList.remove('error', 'success');
            });
            
            select.addEventListener('blur', () => {
                group.classList.remove('focused');
                
                // Validate on blur
                if (select.value.trim()) {
                    group.classList.add('success');
                    group.classList.remove('error');
                } else {
                    group.classList.remove('success', 'error');
                }
            });
            
            select.addEventListener('change', () => {
                if (group.classList.contains('error')) {
                    group.classList.remove('error');
                }
                if (select.value.trim()) {
                    group.classList.add('success');
                }
            });
        }
        
        // Handle icon elements
        if (icon) {
            console.log(`📝 Found icon for input group ${index + 1}`);
        }
    });
    
    console.log('✅ Input focus handling setup completed');
}

// Enhanced login functionality with API integration and demo fallback
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.querySelector('.login-btn');
    
    console.log('🔐 Login attempt for:', email);
    
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
    
    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.innerHTML = '<div class="spinner"></div><span>Memproses...</span>';
    loginBtn.disabled = true;
    
    try {
        // Try API login first
        let response;
        try {
            console.log('📡 Calling login API...');
            response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
        } catch (fetchError) {
            console.warn('⚠️ API login failed, trying demo mode:', fetchError);
            
            // Fallback to demo mode
            if (email === 'admin@sensor.com' && password === 'admin123') {
                currentUser = {
                    name: 'Admin',
                    email: email,
                    status: 'Umum'
                };
                localStorage.setItem('sensorUser', JSON.stringify(currentUser));
                
                showNotification('Login berhasil! (Demo Mode)', 'success');
                
                setTimeout(() => {
                    showDashboard();
                }, 500);
                return;
            }
            
            // Check demo users
            const demoUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
            const demoUser = demoUsers.find(u => u.email === email);
            
            if (demoUser) {
                // For demo users, accept any password (in real app, verify password)
                currentUser = {
                    ...demoUser,
                    password: undefined // Don't store password
                };
                localStorage.setItem('sensorUser', JSON.stringify(currentUser));
                
                showNotification('Login berhasil! (Demo Mode)', 'success');
                
                setTimeout(() => {
                    showDashboard();
                }, 500);
                return;
            }
            
            throw new Error('Email atau password salah');
        }
        
        // Handle API response
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Email atau password salah');
        }
        
        const result = await response.json();
        console.log('✅ API login successful:', result);
        console.log('👤 Result structure:', {
            hasMessage: !!result.message,
            hasOperator: !!result.operator,
            operatorData: result.operator
        });
        
        // Set current user
        currentUser = result.operator;
        console.log('👤 Current user set to:', currentUser);
        localStorage.setItem('sensorUser', JSON.stringify(currentUser));
        
        // Show success notification
        showNotification(result.message || 'Login berhasil!', 'success');
        
        // Switch to dashboard
        setTimeout(() => {
            showDashboard();
        }, 500);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showNotification(error.message, 'error');
    } finally {
        // Reset button state
        loginBtn.classList.remove('loading');
        loginBtn.innerHTML = '<span>Masuk</span><i class="fas fa-arrow-right"></i>';
        loginBtn.disabled = false;
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('sensorUser');
    
    // Hide dashboard
    if (dashboard) {
        dashboard.classList.add('hidden');
    }
    
    // Hide login modal
    if (loginModal) {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('show');
    }
    
    // Show temperature info section
    showTemperatureInfoSection();
    
    showNotification('Logout berhasil!', 'success');
    
    // Clear intervals
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    console.log('🚪 User logged out, returned to temperature info section');
}

function showDashboard() {
    // Safety check for currentUser
    if (!currentUser || !currentUser.name) {
        console.error('❌ currentUser is not properly set:', currentUser);
        showNotification('Error: User data tidak valid', 'error');
        return;
    }
    
    // Hide temperature info section
    if (temperatureInfoSection) {
        temperatureInfoSection.style.display = 'none';
    }
    
    // Hide login modal
    if (loginModal) {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('show');
    }
    
    // Show dashboard
    loginModal.classList.add('hidden');
    dashboard.classList.remove('hidden');
    
    // Update user info
    userName.textContent = currentUser.name;
    
    // Load initial data
    loadDashboardData();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Initialize cooling system control
    initializeCoolingSystem();
    
    // Log admin status after dashboard initialization
    logAdminStatus();
    
    console.log('✅ Dashboard displayed, temperature info section hidden');
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
        console.log('📋 Acuan baku response:', acuanBakuResponse);
        
        sensorData = sensorDataResponse.data || [];
        console.log(`📝 Loaded ${sensorData.length} sensor records`);
        
        // Update acuan baku global variable
        if (acuanBakuResponse && acuanBakuResponse.length > 0) {
            acuanBaku = acuanBakuResponse;
            console.log('📋 Acuan baku loaded:', acuanBaku);
        } else {
            console.warn('⚠️ No acuan baku data received');
        }
        
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
        
        // Force refresh acuan baku lines after chart update
        setTimeout(() => {
            if (acuanBaku && acuanBaku.length > 0) {
                console.log('🔄 Force refreshing acuan baku lines after delay...');
                forceRefreshAcuanBakuLines();
            }
        }, 1000);
        
        // Update last update time
        lastUpdate.textContent = new Date().toLocaleTimeString('id-ID');
        
        // Show notification with data count
        if (sensorData.length > 0) {
            showNotification(`Berhasil memuat ${sensorData.length} data sensor`, 'success');
        }
        
        // Start chart auto-refresh
        startChartAutoRefresh();
        
        // Update cooling system with latest sensor data
        updateCoolingSystemWithSensorData(sensorData);
        
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
    
    // Take only the latest 50 data points for better spacing
    const chartData = sortedData.slice(-50);
    
    // If we have too many data points, sample them for better spacing
    let finalData = chartData;
    if (chartData.length > 20) { // Reduced to 20 for better spacing
        finalData = sampleDataForChart(chartData, 20);
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
    
    // Calculate and expand Y-axis range for better spacing
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;
    
    // If range is too small, expand it for better visualization
    if (range < 1) {
        const midPoint = (minVal + maxVal) / 2;
        const expandedMin = Math.floor(midPoint - 1);
        const expandedMax = Math.ceil(midPoint + 1);
        
        console.log(`📊 Expanding temperature range from ${range.toFixed(2)}°C to ${expandedMax - expandedMin}°C for better Y-axis spacing`);
        console.log(`🌡️ Original range: ${minVal.toFixed(2)}°C - ${maxVal.toFixed(2)}°C`);
        console.log(`🌡️ Expanded range: ${expandedMin}°C - ${expandedMax}°C`);
    }
    
    console.log(`📊 Chart data processed: ${finalData.length} points (from ${chartData.length} original)`);
    console.log(`📈 Value range: ${minVal.toFixed(2)} - ${maxVal.toFixed(2)}`);
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

// Initialize Chart.js with acuan baku lines
function initializeChart() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Nilai Sensor (°C)',
                data: [],
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'line'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#00d4ff',
                    bodyColor: '#ffffff',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Waktu',
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#a0a0a0',
                        maxTicksLimit: 8,
                        maxRotation: 45
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Nilai (°C)',
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#a0a0a0',
                        callback: function(value) {
                            return value + '°C';
                        },
                        // Improve Y-axis spacing
                        maxTicksLimit: 6, // Reduce number of ticks for better spacing
                        stepSize: 0.5, // Force 0.5°C intervals
                        padding: 15, // Add padding between labels
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    beginAtZero: false,
                    // Force better Y-axis range
                    min: function(context) {
                        const values = context.chart.data.datasets[0].data;
                        if (values.length > 0) {
                            const minVal = Math.min(...values);
                            return Math.floor(minVal - 0.5); // Round down and add buffer
                        }
                        return 0;
                    },
                    max: function(context) {
                        const values = context.chart.data.datasets[0].data;
                        if (values.length > 0) {
                            const maxVal = Math.max(...values);
                            return Math.ceil(maxVal + 0.5); // Round up and add buffer
                        }
                        return 100;
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 6,
                    hoverBorderWidth: 3
                },
                line: {
                    borderWidth: 3
                }
            }
        }
    });
    
    // Add acuan baku lines after chart creation
    addAcuanBakuLines();
    updateChartLegend();
}

// Add acuan baku lines to chart
function addAcuanBakuLines() {
    if (!sensorChart) {
        console.warn('❌ Chart not initialized yet');
        return;
    }
    
    if (!acuanBaku || acuanBaku.length === 0) {
        console.warn('❌ No acuan baku data available');
        return;
    }
    
    console.log('📊 Adding acuan baku lines to chart...');
    console.log('📋 Acuan baku data:', acuanBaku);
    
    // Remove existing acuan baku datasets first
    sensorChart.data.datasets = sensorChart.data.datasets.filter(dataset => 
        !dataset.label.includes('Max:') && !dataset.label.includes('Min:')
    );
    
    acuanBaku.forEach((acuan, index) => {
        console.log(`📏 Processing acuan ${index + 1}:`, acuan);
        
        // Add Max line (red dashed)
        const maxDataset = {
            label: `Max: ${acuan.nilai_max}°C`,
            data: [],
            borderColor: '#ff3b30',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            borderWidth: 3,
            borderDash: [8, 4], // Dashed line pattern
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            order: 1 // Ensure acuan lines are drawn on top
        };
        
        // Add Min line (red dashed)
        const minDataset = {
            label: `Min: ${acuan.nilai_min}°C`,
            data: [],
            borderColor: '#ff3b30',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            borderWidth: 3,
            borderDash: [8, 4], // Dashed line pattern
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            order: 1 // Ensure acuan lines are drawn on top
        };
        
        sensorChart.data.datasets.push(maxDataset, minDataset);
        console.log(`✅ Added Max and Min lines for acuan ${index + 1}`);
    });
    
    console.log(`✅ Total datasets after adding acuan baku: ${sensorChart.data.datasets.length}`);
    console.log('📊 Current datasets:', sensorChart.data.datasets.map(d => d.label));
    
    // Force chart update
    sensorChart.update();
}

// Update acuan baku line data
function updateAcuanBakuLineData(labels) {
    if (!sensorChart || !acuanBaku || acuanBaku.length === 0) return;
    
    // Find acuan baku datasets (lines with Max/Min in label)
    const acuanDatasets = sensorChart.data.datasets.filter(dataset => 
        dataset.label.includes('Max:') || dataset.label.includes('Min:')
    );
    
    acuanDatasets.forEach(dataset => {
        // Extract the value from label (e.g., "Max: 20.0°C" -> 20.0)
        const valueMatch = dataset.label.match(/(\d+\.?\d*)°C/);
        if (valueMatch) {
            const value = parseFloat(valueMatch[1]);
            // Create horizontal line by repeating the same value for all time points
            dataset.data = new Array(labels.length).fill(value);
        }
    });
    
    console.log('✅ Updated acuan baku line data');
}

// Force refresh acuan baku lines
function forceRefreshAcuanBakuLines() {
    if (!sensorChart) {
        console.warn('❌ Chart not initialized');
        return;
    }
    
    console.log('🔄 Force refreshing acuan baku lines...');
    
    // Remove all existing acuan baku datasets
    sensorChart.data.datasets = sensorChart.data.datasets.filter(dataset => 
        !dataset.label.includes('Max:') && !dataset.label.includes('Min:')
    );
    
    console.log('✅ Removed existing acuan baku lines');
    console.log('📊 Remaining datasets:', sensorChart.data.datasets.map(d => d.label));
    
    // Re-add acuan baku lines
    if (acuanBaku && acuanBaku.length > 0) {
        addAcuanBakuLines();
        
        // Update line data if we have labels
        if (sensorChart.data.labels.length > 0) {
            updateAcuanBakuLineData(sensorChart.data.labels);
        }
        
        // Force chart update
        sensorChart.update();
        console.log('✅ Acuan baku lines refreshed and chart updated');
    } else {
        console.warn('⚠️ No acuan baku data to add');
        sensorChart.update();
    }
}

// Enhanced refresh acuan baku lines
function refreshAcuanBakuLines() {
    if (!sensorChart) return;
    
    console.log('🔄 Refreshing acuan baku lines...');
    
    // Remove existing acuan baku datasets
    sensorChart.data.datasets = sensorChart.data.datasets.filter(dataset => 
        !dataset.label.includes('Max:') && !dataset.label.includes('Min:')
    );
    
    // Re-add acuan baku lines
    addAcuanBakuLines();
    
    console.log('✅ Refreshed acuan baku lines');
}

// Update chart legend to include acuan baku
function updateChartLegend() {
    if (!sensorChart) return;
    
    // The legend will automatically update based on the datasets
    // We just need to ensure the chart is updated
    sensorChart.update();
    
    console.log('✅ Chart legend updated');
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
        // Also update cooling system with latest data
        if (sensorData && sensorData.length > 0) {
            updateCoolingSystemWithSensorData(sensorData);
        }
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
                // Update cooling system with latest data
                updateCoolingSystemWithSensorData(statsResponse.latest_data);
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

// Update chart with acuan baku lines
function updateChartWithAcuanBaku(data) {
    if (!sensorChart) {
        console.warn('❌ Chart not initialized');
        return;
    }
    
    const chartData = processChartData(data);
    
    if (chartData.labels.length === 0) {
        console.warn('❌ No chart data processed');
        return;
    }
    
    console.log('📊 Updating chart with data:', chartData.labels.length, 'labels');
    
    // Update main sensor data
    sensorChart.data.labels = chartData.labels;
    sensorChart.data.datasets[0].data = chartData.values;
    
    // Force Y-axis range expansion for better spacing
    const minVal = Math.min(...chartData.values);
    const maxVal = Math.max(...chartData.values);
    const range = maxVal - minVal;
    
    if (range < 1) {
        // Expand Y-axis range artificially
        const midPoint = (minVal + maxVal) / 2;
        const expandedMin = Math.floor(midPoint - 1);
        const expandedMax = Math.ceil(midPoint + 1);
        
        // Force Y-axis min and max
        sensorChart.options.scales.y.min = expandedMin;
        sensorChart.options.scales.y.max = expandedMax;
        
        console.log(`🔄 Forcing Y-axis range: ${expandedMin}°C - ${expandedMax}°C`);
    }
    
    // Ensure acuan baku lines exist
    if (acuanBaku && acuanBaku.length > 0) {
        console.log('📋 Acuan baku available, updating lines...');
        
        // Check if acuan baku lines exist, if not add them
        const hasAcuanLines = sensorChart.data.datasets.some(dataset => 
            dataset.label.includes('Max:') || dataset.label.includes('Min:')
        );
        
        if (!hasAcuanLines) {
            console.log('📏 No acuan baku lines found, adding them...');
            addAcuanBakuLines();
        } else {
            console.log('📏 Acuan baku lines found, updating data...');
            updateAcuanBakuLineData(chartData.labels);
        }
    } else {
        console.warn('⚠️ No acuan baku data available for chart');
    }
    
    // Update chart with animation
    sensorChart.update('active');
    
    console.log(`✅ Chart updated with ${chartData.labels.length} data points`);
    console.log('📊 Current datasets:', sensorChart.data.datasets.map(d => d.label));
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength < 3) {
        return { level: 'weak', text: 'Password terlalu lemah' };
    } else if (strength < 4) {
        return { level: 'medium', text: 'Password cukup kuat' };
    } else {
        return { level: 'strong', text: 'Password sangat kuat' };
    }
}

// Registration functionality with API integration and demo fallback
async function handleRegister(e) {
    e.preventDefault();
    console.log('🚀 Registration started...');
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const telp = document.getElementById('regTelp').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    console.log('📝 Form data:', { name, email, telp, password: '***', confirmPassword: '***' });
    
    // Basic validation
    if (!name || !email || !telp || !password || !confirmPassword) {
        console.log('❌ Validation failed: Empty fields');
        showNotification('Semua field harus diisi', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('❌ Email validation failed');
        showNotification('Format email tidak valid', 'error');
        return;
    }
    
    // Phone validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(telp)) {
        console.log('❌ Phone validation failed');
        showNotification('Format nomor telepon tidak valid', 'error');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        console.log('❌ Password too short');
        showNotification('Password minimal 6 karakter', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        console.log('❌ Password confirmation mismatch');
        showNotification('Konfirmasi password tidak cocok', 'error');
        return;
    }
    
    // Check password strength
    const strength = checkPasswordStrength(password);
    if (strength.level === 'weak') {
        console.log('⚠️ Weak password detected');
        showNotification('Password terlalu lemah. Gunakan kombinasi huruf besar, kecil, angka, dan simbol', 'warning');
    }
    
    console.log('✅ All validations passed, proceeding to API call...');
    
    // Show loading state
    const registerBtn = document.querySelector('#registerForm .login-btn');
    registerBtn.classList.add('loading');
    registerBtn.innerHTML = '<div class="spinner"></div><span>Memproses...</span>';
    registerBtn.disabled = true;
    
    try {
        console.log('📡 Calling registration API...');
        console.log('🌐 API URL:', `${API_BASE_URL}/register-operator`);
        
        // Try to call registration API
        let response;
        try {
            response = await fetch(`${API_BASE_URL}/register-operator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    telp,
                    password
                })
            });
        } catch (fetchError) {
            console.warn('⚠️ API call failed, using demo mode:', fetchError);
            
            // Fallback to demo mode
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
            
            // Check if email already exists in demo mode
            const existingUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
            if (existingUsers.find(u => u.email === email)) {
                throw new Error('Email sudah terdaftar');
            }
            
            // Create demo user with default status 'Umum'
            const demoUser = {
                id: existingUsers.length + 1,
                name,
                email,
                telp,
                status: 'Umum'  // Default status
            };
            
            existingUsers.push(demoUser);
            localStorage.setItem('demoUsers', JSON.stringify(existingUsers));
            
            console.log('✅ Demo registration successful:', demoUser);
            
            // Show success notification
            showNotification('Registrasi berhasil! (Demo Mode) Status default: Umum. Silakan login dengan akun baru Anda.', 'success');
            
            // Switch to login modal
            setTimeout(() => {
                console.log('🔄 Switching to login modal...');
                showLoginModal();
                // Pre-fill email field
                document.getElementById('email').value = email;
            }, 1500);
            
            return;
        }
        
        console.log('📊 API Response status:', response.status);
        console.log('📊 API Response headers:', response.headers);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.detail || 'Gagal melakukan registrasi');
        }
        
        const result = await response.json();
        console.log('✅ Registration successful:', result);
        
        // Show success notification
        showNotification(result.message || 'Registrasi berhasil! Status default: Umum. Silakan login dengan akun baru Anda.', 'success');
        
        // Switch to login modal
        setTimeout(() => {
            console.log('🔄 Switching to login modal...');
            showLoginModal();
            // Pre-fill email field
            document.getElementById('email').value = email;
        }, 1500);
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        showNotification('Gagal melakukan registrasi: ' + error.message, 'error');
    } finally {
        console.log('🔄 Resetting button state...');
        // Reset button state
        registerBtn.classList.remove('loading');
        registerBtn.innerHTML = '<span>Daftar</span><i class="fas fa-user-plus"></i>';
        registerBtn.disabled = false;
    }
}

// Test registration function for debugging
function testRegistration() {
    console.log('🧪 Testing registration process...');
    
    // Test form elements
    const nameInput = document.getElementById('regName');
    const emailInput = document.getElementById('regEmail');
    const telpInput = document.getElementById('regTelp');
    const passwordInput = document.getElementById('regPassword');
    const confirmPasswordInput = document.getElementById('regConfirmPassword');
    
    console.log('📝 Form elements found:', {
        name: !!nameInput,
        email: !!emailInput,
        telp: !!telpInput,
        password: !!passwordInput,
        confirmPassword: !!confirmPasswordInput
    });
    
    // Test form submission
    const registerForm = document.getElementById('registerForm');
    console.log('📋 Register form found:', !!registerForm);
    
    // Test event listener
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    console.log('🎯 Simulating form submit...');
    
    // Fill form with test data
    if (nameInput) nameInput.value = 'Test Operator';
    if (emailInput) emailInput.value = 'test@example.com';
    if (telpInput) telpInput.value = '+628123456789';
    if (passwordInput) passwordInput.value = 'test123';
    if (confirmPasswordInput) confirmPasswordInput.value = 'test123';
    
    console.log('✅ Test data filled, triggering submit...');
    
    // Trigger form submission
    if (registerForm) {
        registerForm.dispatchEvent(submitEvent);
    } else {
        console.error('❌ Register form not found!');
    }
}

// Test API connectivity
async function testAPIConnectivity() {
    console.log('🌐 Testing API connectivity...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        console.log('✅ API root response:', response.status);
        
        if (response.ok) {
            const data = await response.text();
            console.log('📊 API root data:', data);
        }
    } catch (error) {
        console.error('❌ API connectivity test failed:', error);
        console.log('💡 This means the backend is not running or not accessible');
    }
}

// ===== COOLING SYSTEM CONTROL FUNCTIONS =====

/**
 * Check if current user has admin privileges
 * @returns {boolean} True if user is admin, false otherwise
 */
function isUserAdmin() {
    if (!currentUser || !currentUser.status) {
        console.log('⚠️ No user logged in or missing status');
        return false;
    }
    
    const isAdmin = currentUser.status.toLowerCase() === 'admin';
    console.log(`👤 User status: ${currentUser.status}, Admin privileges: ${isAdmin}`);
    return isAdmin;
}

/**
 * Show admin access denied notification
 */
function showAdminAccessDenied() {
    const userName = currentUser ? currentUser.name : 'Unknown User';
    const userStatus = currentUser ? currentUser.status : 'Unknown';
    
    showNotification(`❌ Akses ditolak! User "${userName}" (${userStatus}) tidak memiliki hak akses Admin untuk mengontrol sistem pendingin`, 'error');
    console.log(`🚫 Admin access denied for cooling system control. User: ${userName}, Status: ${userStatus}`);
    
    // Show additional info in console
    console.log('💡 Admin privileges required for:');
    console.log('   - Manual cooling system control');
    console.log('   - System settings modification');
    console.log('💡 Non-admin users can still:');
    console.log('   - View system status');
    console.log('   - Monitor temperature readings');
    console.log('   - See system alerts');
}

/**
 * Toggle the cooling system on/off
 * @param {HTMLInputElement} toggle - The toggle switch element
 */
function toggleCoolingSystem(toggle) {
    // Check admin privileges
    if (!isUserAdmin()) {
        showAdminAccessDenied();
        // Reset toggle to previous state
        toggle.checked = !toggle.checked;
        return;
    }
    
    const isOn = toggle.checked;
    coolingSystemState.isOn = isOn;
    
    // Update UI
    updateCoolingSystemUI();
    
    // Update status
    const statusElement = document.getElementById('coolingSystemStatus');
    if (statusElement) {
        if (isOn) {
            statusElement.textContent = 'COOLING';
            statusElement.className = 'status-badge status-cooling';
        } else {
            statusElement.textContent = 'OFF';
            statusElement.className = 'status-badge status-idle';
        }
    }
    
    // Update toggle label
    const labelElement = document.getElementById('coolingStatus');
    if (labelElement) {
        labelElement.textContent = isOn ? 'ON' : 'OFF';
    }
    
    // Log the action
    console.log(`❄️ Cooling system ${isOn ? 'turned ON' : 'turned OFF'} by Admin: ${currentUser.name}`);
    
    // Show notification
    showNotification(`Cooling system ${isOn ? 'activated' : 'deactivated'} by Admin`, 'success');
    
    // If cooling system is turned ON, stop temperature alert
    if (isOn && coolingSystemState.alertState.isActive) {
        console.log('🔇 Cooling system activated - stopping temperature alert');
        stopTemperatureAlert();
        showNotification('🔇 Alert suhu kritis dihentikan - sistem pendingin aktif', 'success');
    }
    

}



/**
 * Automatic cooling system control based on temperature thresholds
 */
function automaticCoolingControl() {
    if (!coolingSystemState.autoMode) {
        return;
    }
    
    const currentTemp = coolingSystemState.currentTemp;
    if (currentTemp === null) {
        console.log('🌡️ No temperature data available for automatic control');
        return;
    }
    
    const { min, max } = coolingSystemState.thresholds;
    let shouldCool = false;
    let newStatus = 'idle';
    
    // Determine if cooling is needed
    if (currentTemp > max) {
        shouldCool = true;
        newStatus = 'cooling';
        console.log(`🌡️ Temperature ${currentTemp}°C exceeds maximum threshold ${max}°C - Activating cooling`);
    } else if (currentTemp < min) {
        shouldCool = false;
        newStatus = 'idle';
        console.log(`🌡️ Temperature ${currentTemp}°C below minimum threshold ${min}°C - Deactivating cooling`);
    } else {
        shouldCool = false;
        newStatus = 'idle';
        console.log(`🌡️ Temperature ${currentTemp}°C within normal range ${min}-${max}°C - Maintaining idle state`);
    }
    
    // Update cooling system state
    coolingSystemState.isOn = shouldCool;
    coolingSystemState.status = newStatus;
    
    // Update UI
    updateCoolingSystemUI();
    
    // Update status display
    const statusElement = document.getElementById('coolingSystemStatus');
    if (statusElement) {
        statusElement.textContent = newStatus.toUpperCase();
        statusElement.className = `status-badge status-${newStatus}`;
    }
    
    // Update cooling toggle (if not disabled)
    const coolingToggle = document.getElementById('coolingToggle');
    if (coolingToggle && !coolingToggle.disabled) {
        coolingToggle.checked = shouldCool;
    }
    
    // Update cooling status label
    const labelElement = document.getElementById('coolingStatus');
    if (labelElement) {
        labelElement.textContent = shouldCool ? 'ON' : 'OFF';
    }
    
    // Show notification for significant changes
    if (shouldCool && coolingSystemState.status !== 'cooling') {
        showNotification(`🌡️ High temperature detected (${currentTemp}°C) - Cooling system activated`, 'warning');
    } else if (!shouldCool && coolingSystemState.status === 'cooling') {
        showNotification(`🌡️ Temperature normalized (${currentTemp}°C) - Cooling system deactivated`, 'success');
    }
}

/**
 * Update cooling system UI elements
 */
function updateCoolingSystemUI() {
    // Check admin privileges
    const isAdmin = isUserAdmin();
    
    // Update current temperature display
    const tempElement = document.getElementById('currentTemp');
    if (tempElement && coolingSystemState.currentTemp !== null) {
        tempElement.textContent = `${coolingSystemState.currentTemp}°C`;
    }
    
    // Update temperature source
    const sourceElement = document.getElementById('tempSource');
    if (sourceElement && coolingSystemState.tempSource) {
        sourceElement.textContent = coolingSystemState.tempSource;
    }
    
    // Update cooling toggle state
    const coolingToggle = document.getElementById('coolingToggle');
    if (coolingToggle) {
        coolingToggle.checked = coolingSystemState.isOn;
        // Disable if user is not admin
        coolingToggle.disabled = !isAdmin;
        
        // Add visual indication for non-admin users
        if (!isAdmin) {
            coolingToggle.title = '❌ Hanya Admin yang dapat mengontrol sistem pendingin';
        } else {
            coolingToggle.title = '🎛️ Kontrol manual sistem pendingin';
        }
    }
    
    // Update status display
    const statusElement = document.getElementById('coolingSystemStatus');
    if (statusElement) {
        statusElement.textContent = coolingSystemState.status.toUpperCase();
        
        // Set appropriate status class
        let statusClass = 'status-badge status-normal';
        if (coolingSystemState.status === 'critical') {
            statusClass = 'status-badge status-error temperature-critical';
        } else if (coolingSystemState.status === 'cooling') {
            statusClass = 'status-badge status-cooling';
        } else if (coolingSystemState.status === 'idle') {
            statusClass = 'status-badge status-idle';
        }
        
        statusElement.className = statusClass;
    }
    
    // Update admin status indicator
    updateAdminStatusIndicator();
}

/**
 * Update admin status indicator in the UI
 */
function updateAdminStatusIndicator() {
    const isAdmin = isUserAdmin();
    
    // Add admin status to the control header
    const controlHeader = document.querySelector('.control-header p');
    if (controlHeader) {
        if (isAdmin) {
            controlHeader.innerHTML = 'Control the cooling system based on sensor readings <span style="color: #00d4ff; font-weight: bold;">👑 Admin Access</span>';
        } else {
            controlHeader.innerHTML = 'Control the cooling system based on sensor readings <span style="color: #ffc107; font-weight: bold;">👁️ View Only</span>';
        }
    }
    
    // Add admin badge to user info in header
    const userInfo = document.querySelector('.user-info');
    if (userInfo && currentUser) {
        const existingBadge = userInfo.querySelector('.admin-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        if (isAdmin) {
            const adminBadge = document.createElement('span');
            adminBadge.className = 'admin-badge';
            adminBadge.innerHTML = '👑 Admin';
            adminBadge.style.cssText = `
                background: rgba(0, 212, 255, 0.2);
                color: #00d4ff;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
                margin-left: 0.5rem;
            `;
            userInfo.appendChild(adminBadge);
        }
    }
    
    // Log admin status
    console.log(`🔐 Admin status check: ${isAdmin ? 'Admin access granted' : 'Limited access - view only'}`);
}

/**
 * Log detailed admin status information
 */
function logAdminStatus() {
    if (!currentUser) {
        console.log('⚠️ No user logged in');
        return;
    }
    
    const isAdmin = isUserAdmin();
    console.log('🔐 ===== ADMIN STATUS CHECK =====');
    console.log(`👤 User: ${currentUser.name}`);
    console.log(`📧 Email: ${currentUser.email}`);
    console.log(`🏷️ Status: ${currentUser.status}`);
    console.log(`🔑 Admin Access: ${isAdmin ? '✅ GRANTED' : '❌ DENIED'}`);
    
    if (isAdmin) {
        console.log('🎯 Admin privileges include:');
        console.log('   - Manual cooling system control');
        console.log('   - System settings modification');
        console.log('   - Full system access');
    } else {
        console.log('👁️ Limited access - view only:');
        console.log('   - Monitor system status');
        console.log('   - View temperature readings');
        console.log('   - See system alerts');
        console.log('   - No control capabilities');
    }
    console.log('================================');
}

/**
 * Update cooling system with latest sensor data
 * @param {Array} sensorData - Array of sensor data
 */
function updateCoolingSystemWithSensorData(sensorData) {
    if (!sensorData || sensorData.length === 0) {
        return;
    }
    
    // Find the most recent temperature reading
    const latestData = sensorData[0]; // Assuming data is sorted by time (newest first)
    
    if (latestData && latestData.nilai !== undefined) {
        coolingSystemState.currentTemp = latestData.nilai;
        coolingSystemState.tempSource = latestData.nama_sensor || 'Unknown Sensor';
        
        // Update UI
        updateCoolingSystemUI();
        

        
        console.log(`🌡️ Updated cooling system with temperature: ${latestData.nilai}°C from ${latestData.nama_sensor}`);
    }
}

/**
 * Load temperature thresholds from acuan baku
 */
async function loadTemperatureThresholds() {
    try {
        console.log('🌡️ Loading temperature thresholds from acuan baku...');
        
        const response = await fetch(`${API_BASE_URL}/acuan-baku`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const acuanData = await response.json();
        
        if (acuanData && acuanData.length > 0) {
            // Find temperature-related acuan baku
            const tempAcuan = acuanData.find(item => 
                item.nama_acuan && 
                (item.nama_acuan.toLowerCase().includes('suhu') || 
                 item.nama_acuan.toLowerCase().includes('temperature') ||
                 item.nama_acuan.toLowerCase().includes('temp'))
            );
            
            if (tempAcuan) {
                // Extract min and max values from acuan baku
                const minValue = parseFloat(tempAcuan.nilai_min) || null;
                const maxValue = parseFloat(tempAcuan.nilai_max) || null;
                
                coolingSystemState.thresholds.min = minValue;
                coolingSystemState.thresholds.max = maxValue;
                
                console.log(`✅ Temperature thresholds loaded from acuan baku: Min=${minValue}°C, Max=${maxValue}°C`);
                console.log(`📋 Acuan baku source: ${tempAcuan.nama_acuan}`);
                
                // Update UI to show current thresholds
                updateThresholdDisplay();
                
            } else {
                console.log('⚠️ No temperature-related acuan baku found, using default thresholds');
                // Set default thresholds if none found
                coolingSystemState.thresholds.min = 20;
                coolingSystemState.thresholds.max = 35;
            }
        } else {
            console.log('⚠️ No acuan baku data available, using default thresholds');
            // Set default thresholds if no data
            coolingSystemState.thresholds.min = 20;
            coolingSystemState.thresholds.max = 35;
        }
        
    } catch (error) {
        console.error('❌ Error loading temperature thresholds:', error);
        console.log('⚠️ Using default thresholds due to error');
        // Set default thresholds on error
        coolingSystemState.thresholds.min = 20;
        coolingSystemState.thresholds.max = 35;
    }
}

/**
 * Update threshold display in UI
 */
function updateThresholdDisplay() {
    const { min, max } = coolingSystemState.thresholds;
    
    // Update threshold info in the control section
    const thresholdInfo = document.querySelector('.threshold-info');
    if (thresholdInfo) {
        thresholdInfo.innerHTML = `
            <div class="threshold-item">
                <span class="threshold-label">Min:</span>
                <span class="threshold-value">${min !== null ? min + '°C' : 'N/A'}</span>
            </div>
            <div class="threshold-item">
                <span class="threshold-label">Max:</span>
                <span class="threshold-value">${max !== null ? max + '°C' : 'N/A'}</span>
            </div>
        `;
    }
    
    // Log threshold update
    console.log(`📊 Threshold display updated: Min=${min}°C, Max=${max}°C`);
}

/**
 * Check temperature thresholds and trigger alerts
 */
function checkTemperatureThresholds() {
    const currentTemp = coolingSystemState.currentTemp;
    if (currentTemp === null) return;
    
    const { min, max } = coolingSystemState.thresholds;
    
    // Check if thresholds are loaded
    if (max === null) {
        console.log('⚠️ Temperature thresholds not loaded yet, skipping check');
        return;
    }
    
    // Check if temperature exceeds critical threshold
    if (currentTemp > max) {
        if (!coolingSystemState.alertState.isActive) {
            console.log(`🚨 CRITICAL TEMPERATURE ALERT: ${currentTemp}°C exceeds maximum threshold ${max}°C`);
            startTemperatureAlert();
        }
        
        // Update status to critical
        coolingSystemState.status = 'critical';
        
        // Show notification
        showNotification(`🚨 SUHU KRITIS! ${currentTemp}°C melewati batas maksimum acuan baku ${max}°C`, 'error');
        
    } else if (min !== null && currentTemp < min) {
        // Temperature is below minimum - safe zone
        if (coolingSystemState.alertState.isActive) {
            console.log(`✅ Temperature normalized: ${currentTemp}°C below minimum threshold ${min}°C`);
            stopTemperatureAlert();
        }
        
        coolingSystemState.status = 'idle';
        
    } else {
        // Temperature within normal range
        if (coolingSystemState.alertState.isActive) {
            console.log(`✅ Temperature normalized: ${currentTemp}°C within normal range (${min || 'N/A'}-${max}°C)`);
            stopTemperatureAlert();
        }
        
        coolingSystemState.status = 'normal';
    }
    
    // Update UI
    updateCoolingSystemUI();
}

/**
 * Start temperature alert with repeating audio
 */
function startTemperatureAlert() {
    if (coolingSystemState.alertState.isActive) return;
    
    console.log('🔊 Starting temperature alert system...');
    
    // Set alert state
    coolingSystemState.alertState.isActive = true;
    coolingSystemState.alertState.isAcknowledged = false;
    
    // Show alert banner
    const alertBanner = document.getElementById('temperatureAlertBanner');
    if (alertBanner) {
        alertBanner.classList.remove('hidden');
    }
    
    // Start repeating audio alert
    const audioElement = document.getElementById('temperatureAlert');
    if (audioElement) {
        // Play audio immediately
        audioElement.play().catch(e => console.log('Audio play failed:', e));
        
        // Set up repeating audio every 3 seconds
        coolingSystemState.alertState.audioInterval = setInterval(() => {
            if (coolingSystemState.alertState.isActive && !coolingSystemState.alertState.isAcknowledged) {
                audioElement.currentTime = 0; // Reset audio to start
                audioElement.play().catch(e => console.log('Audio repeat failed:', e));
                console.log('🔊 Playing temperature alert audio...');
            }
        }, 3000);
    }
    
    // Add event listener for acknowledge button
    const acknowledgeBtn = document.getElementById('acknowledgeAlert');
    if (acknowledgeBtn) {
        acknowledgeBtn.onclick = acknowledgeTemperatureAlert;
    }
    
    // Update last alert time
    coolingSystemState.alertState.lastAlertTime = Date.now();
}

/**
 * Stop temperature alert
 */
function stopTemperatureAlert() {
    if (!coolingSystemState.alertState.isActive) return;
    
    console.log('🔇 Stopping temperature alert system...');
    
    // Clear audio interval
    if (coolingSystemState.alertState.audioInterval) {
        clearInterval(coolingSystemState.alertState.audioInterval);
        coolingSystemState.alertState.audioInterval = null;
    }
    
    // Stop audio
    const audioElement = document.getElementById('temperatureAlert');
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
    }
    
    // Hide alert banner
    const alertBanner = document.getElementById('temperatureAlertBanner');
    if (alertBanner) {
        alertBanner.classList.add('hidden');
    }
    
    // Reset alert state
    coolingSystemState.alertState.isActive = false;
    coolingSystemState.alertState.isAcknowledged = false;
}

/**
 * Acknowledge temperature alert (user clicked acknowledge button)
 */
function acknowledgeTemperatureAlert() {
    console.log('✅ Temperature alert acknowledged by user');
    
    // Mark as acknowledged
    coolingSystemState.alertState.isAcknowledged = true;
    
    // Stop audio but keep banner visible
    const audioElement = document.getElementById('temperatureAlert');
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
    }
    
    // Clear audio interval
    if (coolingSystemState.alertState.audioInterval) {
        clearInterval(coolingSystemState.alertState.audioInterval);
        coolingSystemState.alertState.audioInterval = null;
    }
    
    // Update banner text
    const alertText = document.querySelector('.alert-text');
    if (alertText) {
        alertText.textContent = '⚠️ SUHU KRITIS! Sistem pendingin perlu diaktifkan (Alert diakui)';
    }
    
    // Change acknowledge button to reset button
    const acknowledgeBtn = document.getElementById('acknowledgeAlert');
    if (acknowledgeBtn) {
        acknowledgeBtn.innerHTML = '<i class="fas fa-redo"></i> Reset Alert';
        acknowledgeBtn.onclick = resetTemperatureAlert;
    }
    
    // Show notification
    showNotification('✅ Alert suhu kritis diakui. Audio dihentikan.', 'success');
}

/**
 * Reset temperature alert (restart audio)
 */
function resetTemperatureAlert() {
    console.log('🔄 Resetting temperature alert...');
    
    // Reset acknowledge state
    coolingSystemState.alertState.isAcknowledged = false;
    
    // Restart audio alert
    startTemperatureAlert();
    
    // Show notification
    showNotification('🔊 Alert suhu kritis diaktifkan kembali', 'warning');
}

/**
 * Initialize cooling system control
 */
function initializeCoolingSystem() {
    console.log('❄️ Initializing cooling system control...');
    
    // Set initial state
    coolingSystemState.isOn = false;
    coolingSystemState.status = 'idle';
    
    // Initialize alert system
    coolingSystemState.alertState.isActive = false;
    coolingSystemState.alertState.isAcknowledged = false;
    coolingSystemState.alertState.audioInterval = null;
    
    // Hide alert banner initially
    const alertBanner = document.getElementById('temperatureAlertBanner');
    if (alertBanner) {
        alertBanner.classList.add('hidden');
    }
    
    // Load temperature thresholds from acuan baku
    loadTemperatureThresholds();
    
    // Update UI
    updateCoolingSystemUI();
    
    console.log('✅ Cooling system control initialized with temperature alert system');
}
