// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.apiBase = '/api';
        this.charts = {};
        this.currentSection = 'dashboard';
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    checkAuth() {
        if (!this.token) {
            window.location.href = '/index.html';
            return;
        }

        // Verify token with server
        fetch(`${this.apiBase}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Invalid token');
            }
            return response.json();
        })
        .then(data => {
            console.log('Admin authenticated successfully');
        })
        .catch(error => {
            console.error('Auth error:', error);
            this.logout();
        });
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.switchSection(section);
            });
        });

        // Forms
        const addApiKeyForm = document.getElementById('add-api-key-form');
        if (addApiKeyForm) {
            addApiKeyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addApiKey();
            });
        }

        // Search
        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.searchUsers(e.target.value);
            });
        }

        // Period selector
        const analyticsPeriod = document.getElementById('analytics-period');
        if (analyticsPeriod) {
            analyticsPeriod.addEventListener('change', (e) => {
                this.updateAnalytics(e.target.value);
            });
        }

        // Log filters
        const logLevel = document.getElementById('log-level');
        if (logLevel) {
            logLevel.addEventListener('change', (e) => {
                this.filterLogs(e.target.value);
            });
        }
    }

    async loadInitialData() {
        await this.loadDashboardData();
        await this.loadApiKeys();
        await this.loadUsers();
        await this.loadAgents();
        await this.loadVirtualComputers();
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Update header
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'System overview and statistics' },
            'api-keys': { title: 'API Keys Management', subtitle: 'Manage AI model API keys' },
            users: { title: 'User Management', subtitle: 'View and manage user accounts' },
            agents: { title: 'Agent Management', subtitle: 'Monitor AI agents performance' },
            'virtual-computers': { title: 'Virtual Computers', subtitle: 'Manage user virtual machines' },
            analytics: { title: 'System Analytics', subtitle: 'View usage statistics and trends' },
            logs: { title: 'System Logs', subtitle: 'Monitor system activity and errors' },
            settings: { title: 'System Settings', subtitle: 'Configure system parameters' }
        };

        const titleInfo = titles[sectionName];
        document.getElementById('section-title').textContent = titleInfo.title;
        document.getElementById('section-subtitle').textContent = titleInfo.subtitle;

        this.currentSection = sectionName;

        // Load section-specific data
        switch(sectionName) {
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`${this.apiBase}/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load dashboard data');

            const data = await response.json();
            this.updateDashboardStats(data.stats);
            this.updateRecentUsers(data.recentUsers);
            this.updateAgentStatus(data.agentStatus);
        } catch (error) {
            console.error('Dashboard data error:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('total-users').textContent = stats.users || 0;
        document.getElementById('active-vms').textContent = stats.activeUsers || 0;
        document.getElementById('total-requests').textContent = stats.totalRequests?.[0]?.total || 0;
        document.getElementById('active-agents').textContent = stats.activeAgents || 0;
    }

    updateRecentUsers(users) {
        const container = document.getElementById('recent-users');
        if (!container) return;

        container.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <h4>${user.username}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
                <div class="user-status">${user.role}</div>
            </div>
        `).join('');
    }

    updateAgentStatus(agents) {
        const container = document.getElementById('agent-status');
        if (!container) return;

        container.innerHTML = agents.map(agent => `
            <div class="agent-item">
                <div class="agent-info">
                    <h4>${agent.name}</h4>
                    <p>${agent.type} • ${agent.model}</p>
                </div>
                <div class="agent-status">
                    <span class="status-dot ${agent.status}"></span>
                    <span>${agent.status}</span>
                </div>
            </div>
        `).join('');
    }

    async loadApiKeys() {
        try {
            const response = await fetch(`${this.apiBase}/admin/api-keys`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load API keys');

            const apiKeys = await response.json();
            this.updateApiKeysTable(apiKeys);
        } catch (error) {
            console.error('API keys error:', error);
            this.showError('Failed to load API keys');
        }
    }

    updateApiKeysTable(apiKeys) {
        const tbody = document.getElementById('api-keys-table');
        if (!tbody) return;

        tbody.innerHTML = apiKeys.map(key => `
            <tr>
                <td>${key.name}</td>
                <td>${key.provider}</td>
                <td>${key.model}</td>
                <td><span class="category-tag">${key.category}</span></td>
                <td><span class="status-badge ${key.active ? 'active' : 'inactive'}">${key.active ? 'Active' : 'Inactive'}</span></td>
                <td>${key.usage.requests} requests</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="adminDashboard.editApiKey('${key._id}')">Edit</button>
                        <button class="action-btn delete-btn" onclick="adminDashboard.deleteApiKey('${key._id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadUsers() {
        try {
            const response = await fetch(`${this.apiBase}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load users');

            const users = await response.json();
            this.updateUsersTable(users);
        } catch (error) {
            console.error('Users error:', error);
            this.showError('Failed to load users');
        }
    }

    updateUsersTable(users) {
        const tbody = document.getElementById('users-table');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="role-badge">${user.role}</span></td>
                <td><code style="font-size: 0.75rem;">${user.apiKey ? user.apiKey.substring(0, 8) + '...' : 'N/A'}</code></td>
                <td>${user.usage?.requests || 0} requests</td>
                <td><span class="vm-status ${user.virtualComputer?.active ? 'active' : 'inactive'}">${user.virtualComputer?.active ? 'Active' : 'Inactive'}</span></td>
                <td>${new Date(user.lastActive).toLocaleString()}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn view-btn" onclick="adminDashboard.viewUser('${user._id}')">View</button>
                        <button class="action-btn delete-btn" onclick="adminDashboard.deleteUser('${user._id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadAgents() {
        try {
            const response = await fetch(`${this.apiBase}/agents`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load agents');

            const agents = await response.json();
            this.updateAgentsGrid(agents);
        } catch (error) {
            console.error('Agents error:', error);
            this.showError('Failed to load agents');
        }
    }

    updateAgentsGrid(agents) {
        const container = document.querySelector('#agents-section .agents-grid');
        if (!container) return;

        container.innerHTML = agents.map(agent => `
            <div class="agent-card">
                <h4>${agent.name}</h4>
                <span class="agent-type">${agent.type}</span>
                <p><strong>Model:</strong> ${agent.model}</p>
                <div class="agent-capabilities">
                    ${agent.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
                </div>
                <div class="agent-performance">
                    <div class="performance-metric">
                        <h5>${agent.performance.tasksCompleted}</h5>
                        <p>Tasks</p>
                    </div>
                    <div class="performance-metric">
                        <h5>${agent.performance.averageResponseTime}ms</h5>
                        <p>Avg Time</p>
                    </div>
                    <div class="performance-metric">
                        <h5>${agent.performance.successRate}%</h5>
                        <p>Success</p>
                    </div>
                </div>
                <div class="agent-status">
                    <span class="status-dot ${agent.status}"></span>
                    <span>${agent.status}</span>
                </div>
            </div>
        `).join('');
    }

    async loadVirtualComputers() {
        try {
            const response = await fetch(`${this.apiBase}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load VMs');

            const users = await response.json();
            const activeVMs = users.filter(user => user.virtualComputer?.active);
            this.updateVMsGrid(activeVMs);
        } catch (error) {
            console.error('VMs error:', error);
            this.showError('Failed to load virtual computers');
        }
    }

    updateVMsGrid(vms) {
        const container = document.querySelector('#virtual-computers-section .vm-grid');
        if (!container) return;

        if (vms.length === 0) {
            container.innerHTML = '<p>No active virtual computers found.</p>';
            return;
        }

        container.innerHTML = vms.map(vm => `
            <div class="vm-card">
                <div class="vm-header">
                    <span class="vm-id">${vm.virtualComputer.vmId}</span>
                    <span class="vm-status active">Active</span>
                </div>
                <h4>${vm.username}</h4>
                <div class="vm-specs">
                    <div class="spec-item">
                        <h5>${vm.virtualComputer.specs.cpu}</h5>
                        <p>CPU Cores</p>
                    </div>
                    <div class="spec-item">
                        <h5>${vm.virtualComputer.specs.ram}GB</h5>
                        <p>RAM</p>
                    </div>
                    <div class="spec-item">
                        <h5>${vm.virtualComputer.specs.storage}GB</h5>
                        <p>Storage</p>
                    </div>
                </div>
                <div class="vm-actions">
                    <button class="action-btn view-btn" onclick="adminDashboard.accessVM('${vm._id}')">Access</button>
                    <button class="action-btn delete-btn" onclick="adminDashboard.stopVM('${vm._id}')">Stop</button>
                </div>
            </div>
        `).join('');
    }

    // API Key Management
    showAddApiKeyModal() {
        document.getElementById('add-api-key-modal').classList.add('show');
    }

    async addApiKey() {
        const formData = {
            name: document.getElementById('key-name').value,
            provider: document.getElementById('key-provider').value,
            model: document.getElementById('key-model').value,
            category: document.getElementById('key-category').value,
            key: document.getElementById('key-value').value
        };

        try {
            const response = await fetch(`${this.apiBase}/admin/api-keys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to add API key');

            this.closeModal('add-api-key-modal');
            this.showSuccess('API key added successfully');
            await this.loadApiKeys();
        } catch (error) {
            console.error('Add API key error:', error);
            this.showError('Failed to add API key');
        }
    }

    async editApiKey(keyId) {
        // Implementation for editing API key
        console.log('Edit API key:', keyId);
    }

    async deleteApiKey(keyId) {
        if (!confirm('Are you sure you want to delete this API key?')) return;

        try {
            const response = await fetch(`${this.apiBase}/admin/api-keys/${keyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete API key');

            this.showSuccess('API key deleted successfully');
            await this.loadApiKeys();
        } catch (error) {
            console.error('Delete API key error:', error);
            this.showError('Failed to delete API key');
        }
    }

    // Analytics
    async loadAnalytics() {
        try {
            // Initialize charts
            this.initCharts();
            
            // Load data based on selected period
            const period = document.getElementById('analytics-period').value;
            await this.updateAnalytics(period);
        } catch (error) {
            console.error('Analytics error:', error);
            this.showError('Failed to load analytics');
        }
    }

    initCharts() {
        // Request Volume Chart
        const requestCtx = document.getElementById('request-chart');
        if (requestCtx && !this.charts.requests) {
            this.charts.requests = new Chart(requestCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Requests',
                        data: [],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Agent Performance Chart
        const agentCtx = document.getElementById('agent-chart');
        if (agentCtx && !this.charts.agents) {
            this.charts.agents = new Chart(agentCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Tasks Completed',
                        data: [],
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // User Activity Chart
        const activityCtx = document.getElementById('activity-chart');
        if (activityCtx && !this.charts.activity) {
            this.charts.activity = new Chart(activityCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Active', 'Inactive'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#10b981', '#64748b']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Resource Usage Chart
        const resourceCtx = document.getElementById('resource-chart');
        if (resourceCtx && !this.charts.resources) {
            this.charts.resources = new Chart(resourceCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'CPU %',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Memory %',
                        data: [],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    async updateAnalytics(period) {
        // Simulate data loading - replace with actual API calls
        const mockData = this.generateMockAnalyticsData(period);
        
        // Update charts
        if (this.charts.requests) {
            this.charts.requests.data.labels = mockData.requests.labels;
            this.charts.requests.data.datasets[0].data = mockData.requests.data;
            this.charts.requests.update();
        }

        if (this.charts.agents) {
            this.charts.agents.data.labels = mockData.agents.labels;
            this.charts.agents.data.datasets[0].data = mockData.agents.data;
            this.charts.agents.update();
        }

        if (this.charts.activity) {
            this.charts.activity.data.datasets[0].data = mockData.activity.data;
            this.charts.activity.update();
        }

        if (this.charts.resources) {
            this.charts.resources.data.labels = mockData.resources.labels;
            this.charts.resources.data.datasets[0].data = mockData.resources.cpu;
            this.charts.resources.data.datasets[1].data = mockData.resources.memory;
            this.charts.resources.update();
        }
    }

    generateMockAnalyticsData(period) {
        const periods = {
            '24h': { points: 24, label: 'Hour' },
            '7d': { points: 7, label: 'Day' },
            '30d': { points: 30, label: 'Day' }
        };

        const config = periods[period] || periods['24h'];
        
        return {
            requests: {
                labels: Array.from({length: config.points}, (_, i) => `${i + 1} ${config.label}`),
                data: Array.from({length: config.points}, () => Math.floor(Math.random() * 100) + 50)
            },
            agents: {
                labels: ['Turbo', 'Apex', 'Reasoning 2.0'],
                data: [150, 89, 67]
            },
            activity: {
                data: [23, 8]
            },
            resources: {
                labels: Array.from({length: config.points}, (_, i) => `${i + 1} ${config.label}`),
                cpu: Array.from({length: config.points}, () => Math.floor(Math.random() * 60) + 20),
                memory: Array.from({length: config.points}, () => Math.floor(Math.random() * 40) + 30)
            }
        };
    }

    // Logs
    async loadLogs() {
        try {
            // Simulate log loading
            const logs = this.generateMockLogs();
            this.updateLogsList(logs);
        } catch (error) {
            console.error('Logs error:', error);
            this.showError('Failed to load logs');
        }
    }

    generateMockLogs() {
        const levels = ['info', 'warn', 'error'];
        const messages = [
            'User authentication successful',
            'API key validated',
            'Virtual computer started',
            'Agent task completed',
            'Database connection established',
            'File uploaded successfully',
            'Agent execution failed',
            'Rate limit exceeded',
            'Invalid API key provided',
            'System maintenance completed'
        ];

        return Array.from({length: 50}, (_, i) => ({
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            level: levels[Math.floor(Math.random() * levels.length)],
            message: messages[Math.floor(Math.random() * messages.length)]
        }));
    }

    updateLogsList(logs) {
        const container = document.getElementById('logs-list');
        if (!container) return;

        container.innerHTML = logs.map(log => `
            <div class="log-entry">
                <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                <span class="log-level ${log.level}">${log.level}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
    }

    filterLogs(level) {
        // Implementation for filtering logs
        console.log('Filter logs by level:', level);
    }

    // Utility Functions
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        const colors = {
            info: '#2563eb',
            success: '#10b981',
            error: '#ef4444'
        };

        notification.style.background = colors[type] || colors.info;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async refreshData() {
        this.showNotification('Refreshing data...', 'info');
        await this.loadDashboardData();
        await this.loadApiKeys();
        await this.loadUsers();
        await this.loadAgents();
        await this.loadVirtualComputers();
        this.showNotification('Data refreshed successfully', 'success');
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000); // Refresh every 30 seconds
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = '/index.html';
    }
}

// Global functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function showAddApiKeyModal() {
    adminDashboard.showAddApiKeyModal();
}

function refreshData() {
    adminDashboard.refreshData();
}

function logout() {
    adminDashboard.logout();
}

// Initialize dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .category-tag {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        background: var(--background-color);
        color: var(--text-secondary);
    }
    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    .status-badge.active {
        background: var(--success-color);
        color: white;
    }
    .status-badge.inactive {
        background: var(--secondary-color);
        color: white;
    }
    .role-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        background: var(--primary-color);
        color: white;
    }
`;
document.head.appendChild(style);