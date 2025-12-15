// SuperNinja AI - Frontend JavaScript with Complete Backend Integration

class SuperNinjaAI {
    constructor() {
        this.apiBaseUrl = 'https://3001-cee8a820-8eb4-4a7a-950e-7519a8b312f5.sandbox-service.public.prod.myninja.ai';
        this.currentUser = null;
        this.currentAgent = 'turbo';
        this.currentModel = 'gpt-4o';
        this.virtualComputer = null;
        this.githubConnected = false;
        this.vsCodeConnected = false;
        this.availableAgents = [];
        this.availableModels = [];
        this.tasks = [];
        this.socket = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadUserSession();
        await this.loadAvailableModels();
        await this.loadAvailableAgents();
        this.initWebSocket();
        this.setupRealTimeUpdates();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Auth forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));

        // SuperAgent controls
        document.getElementById('agentSelect')?.addEventListener('change', (e) => {
            this.currentAgent = e.target.value;
            this.updateAgentInterface();
        });

        document.getElementById('modelSelect')?.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
        });

        document.getElementById('sendMessage')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Virtual Computer
        document.getElementById('startVM')?.addEventListener('click', () => this.startVirtualComputer());
        document.getElementById('stopVM')?.addEventListener('click', () => this.stopVirtualComputer());
        document.getElementById('executeCommand')?.addEventListener('click', () => this.executeVMCommand());

        // GitHub Integration
        document.getElementById('connectGitHub')?.addEventListener('click', () => this.connectGitHub());
        document.getElementById('analyzeRepo')?.addEventListener('click', () => this.analyzeRepository());

        // VS Code Integration
        document.getElementById('connectVSCode')?.addEventListener('click', () => this.connectVSCode());

        // File Upload
        document.getElementById('fileUpload')?.addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('uploadFiles')?.addEventListener('click', () => this.uploadFiles());

        // Image Generation
        document.getElementById('generateImage')?.addEventListener('click', () => this.generateImage());

        // Scheduling
        document.getElementById('scheduleMeeting')?.addEventListener('click', () => this.scheduleMeeting());

        // Multi-Agent Coordination
        document.getElementById('coordinateAgents')?.addEventListener('click', () => this.coordinateAgents());

        // Deep Research
        document.getElementById('startDeepResearch')?.addEventListener('click', () => this.startDeepResearch());

        // Deep Coding
        document.getElementById('startDeepCoding')?.addEventListener('click', () => this.startDeepCoding());

        // Data Analysis
        document.getElementById('startDataAnalysis')?.addEventListener('click', () => this.startDataAnalysis());
    }

    async loadUserSession() {
        const token = localStorage.getItem('superninja_token');
        if (token) {
            try {
                const response = await fetch('https://3001-cee8a820-8eb4-4a7a-950e-7519a8b312f5.sandbox-service.public.prod.myninja.ai/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.updateUIForAuthenticatedUser();
                } else {
                    localStorage.removeItem('superninja_token');
                }
            } catch (error) {
                console.error('Session verification failed:', error);
                localStorage.removeItem('superninja_token');
            }
        }
    }

    async loadAvailableModels() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/models`);
            if (response.ok) {
                this.availableModels = await response.json();
                this.populateModelSelect();
            }
        } catch (error) {
            console.error('Failed to load models:', error);
        }
    }

    async loadAvailableAgents() {
        try {
            const token = localStorage.getItem('superninja_token');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/api/agents`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                this.availableAgents = await response.json();
                this.populateAgentSelect();
            }
        } catch (error) {
            console.error('Failed to load agents:', error);
        }
    }

    populateModelSelect() {
        const modelSelect = document.getElementById('modelSelect');
        if (!modelSelect) return;

        modelSelect.innerHTML = '<option value="">Select Model</option>';
        
        const groupedModels = {};
        this.availableModels.forEach(model => {
            if (!groupedModels[model.provider]) {
                groupedModels[model.provider] = [];
            }
            groupedModels[model.provider].push(model);
        });

        Object.keys(groupedModels).forEach(provider => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = provider;
            
            groupedModels[provider].forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = `${model.name} (${model.category})`;
                optgroup.appendChild(option);
            });
            
            modelSelect.appendChild(optgroup);
        });
    }

    populateAgentSelect() {
        const agentSelect = document.getElementById('agentSelect');
        if (!agentSelect) return;

        agentSelect.innerHTML = '<option value="">Select Agent</option>';
        
        this.availableAgents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent.type;
            option.textContent = `${agent.name} - ${agent.capabilities.join(', ')}`;
            agentSelect.appendChild(option);
        });
    }

    updateAgentInterface() {
        const agent = this.availableAgents.find(a => a.type === this.currentAgent);
        if (!agent) return;

        const capabilitiesDiv = document.getElementById('agentCapabilities');
        if (capabilitiesDiv) {
            capabilitiesDiv.innerHTML = `
                <h4>${agent.name} Capabilities:</h4>
                <div class="capabilities-list">
                    ${agent.capabilities.map(cap => `<span class="capability-badge">${cap}</span>`).join('')}
                </div>
            `;
        }

        // Update model based on agent
        if (agent.model) {
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect) {
                modelSelect.value = agent.model;
                this.currentModel = agent.model;
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('superninja_token', data.token);
                this.currentUser = data.user;
                this.updateUIForAuthenticatedUser();
                
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            this.showError('Network error during login');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const registerData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            subscription: formData.get('subscription') || 'ninja'
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('superninja_token', data.token);
                this.currentUser = data.user;
                this.updateUIForAuthenticatedUser();
            } else {
                this.showError(data.error || 'Registration failed');
            }
        } catch (error) {
            this.showError('Network error during registration');
        }
    }

    updateUIForAuthenticatedUser() {
        // Hide auth forms, show main interface
        document.getElementById('authSection')?.classList.add('hidden');
        document.getElementById('mainInterface')?.classList.remove('hidden');
        
        // Update user info
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `Welcome, ${this.currentUser.username} (${this.currentUser.subscription})`;
        }

        // Load user-specific data
        this.loadUserTasks();
        this.loadVirtualComputerStatus();
        this.loadGitHubStatus();
        this.loadVSCodeStatus();
    }

    async loadUserTasks() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/tasks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                }
            });
            
            if (response.ok) {
                this.tasks = await response.json();
                this.updateTasksList();
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;

        const chatMessages = document.getElementById('chatMessages');
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.textContent = message;
        chatMessages.appendChild(userMessage);

        messageInput.value = '';

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message agent-message typing';
        typingIndicator.textContent = 'SuperAgent is thinking...';
        chatMessages.appendChild(typingIndicator);

        try {
            const response = await fetch(`/api/agents/${this.currentAgent}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({
                    message,
                    mode: document.getElementById('modeSelect')?.value || 'standard',
                    files: this.getCurrentFiles(),
                    githubRepo: this.getCurrentGitHubRepo()
                })
            });

            const data = await response.json();
            
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);

            if (response.ok) {
                const agentMessage = document.createElement('div');
                agentMessage.className = 'message agent-message';
                agentMessage.innerHTML = `
                    <div class="agent-header">${data.result.agent} (${data.result.model})</div>
                    <div class="agent-content">${this.formatMessage(data.result.content)}</div>
                    <div class="agent-meta">
                        <span>Confidence: ${(data.result.confidence * 100).toFixed(1)}%</span>
                        <span>Execution time: ${data.executionTime}ms</span>
                    </div>
                `;
                chatMessages.appendChild(agentMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Add to tasks
                this.tasks.unshift({
                    id: data.taskId,
                    type: this.currentAgent,
                    description: message,
                    status: 'completed',
                    result: data.result,
                    timestamp: new Date()
                });
                this.updateTasksList();
            } else {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'message error-message';
                errorMessage.textContent = data.error || 'Request failed';
                chatMessages.appendChild(errorMessage);
            }
        } catch (error) {
            chatMessages.removeChild(typingIndicator);
            this.showError('Failed to send message');
        }
    }

    async startVirtualComputer() {
        try {
            const specs = document.getElementById('vmSpecs')?.value || 'standard';
            
            const response = await fetch(`${this.apiBaseUrl}/api/virtual-computer/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({ specs })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.virtualComputer = data;
                this.updateVirtualComputerUI();
                this.showSuccess('Virtual computer started successfully');
            } else {
                this.showError(data.error || 'Failed to start virtual computer');
            }
        } catch (error) {
            this.showError('Network error starting virtual computer');
        }
    }

    async stopVirtualComputer() {
        if (!this.virtualComputer) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/virtual-computer/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({ vmId: this.virtualComputer.vmId })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.virtualComputer = null;
                this.updateVirtualComputerUI();
                this.showSuccess('Virtual computer stopped');
            } else {
                this.showError(data.error || 'Failed to stop virtual computer');
            }
        } catch (error) {
            this.showError('Network error stopping virtual computer');
        }
    }

    async executeVMCommand() {
        if (!this.virtualComputer) {
            this.showError('No virtual computer running');
            return;
        }

        const commandInput = document.getElementById('vmCommand');
        const command = commandInput.value.trim();
        
        if (!command) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/virtual-computer/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({
                    vmId: this.virtualComputer.vmId,
                    command
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                const terminal = document.getElementById('vmTerminal');
                const output = document.createElement('div');
                output.className = 'terminal-output';
                output.innerHTML = `
                    <div class="terminal-command">$ ${command}</div>
                    <div class="terminal-result">${data.output}</div>
                `;
                terminal.appendChild(output);
                terminal.scrollTop = terminal.scrollHeight;
                
                commandInput.value = '';
            } else {
                this.showError(data.error || 'Command execution failed');
            }
        } catch (error) {
            this.showError('Network error executing command');
        }
    }

    async connectGitHub() {
        const username = prompt('Enter your GitHub username:');
        const token = prompt('Enter your GitHub personal access token:');
        
        if (!username || !token) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/github/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({ username, token })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.githubConnected = true;
                this.updateGitHubUI();
                this.showSuccess('GitHub connected successfully');
                
                // Show repositories
                const reposDiv = document.getElementById('githubRepos');
                if (reposDiv) {
                    reposDiv.innerHTML = `
                        <h4>Your Repositories:</h4>
                        ${data.repositories.map(repo => `
                            <div class="repo-item">
                                <strong>${repo.name}</strong>
                                <p>${repo.description || 'No description'}</p>
                                <small>Language: ${repo.language || 'Unknown'}</small>
                                <button onclick="superNinja.analyzeRepository('${repo.name}')" class="analyze-btn">Analyze</button>
                            </div>
                        `).join('')}
                    `;
                }
            } else {
                this.showError(data.error || 'GitHub connection failed');
            }
        } catch (error) {
            this.showError('Network error connecting to GitHub');
        }
    }

    async analyzeRepository(repoName) {
        try {
            const [owner, repo] = repoName.split('/');
            
            const response = await fetch(`/api/github/repo/${owner}/${repo}/analyze`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                const analysisDiv = document.getElementById('repoAnalysis');
                if (analysisDiv) {
                    analysisDiv.innerHTML = `
                        <h4>Repository Analysis</h4>
                        <div class="analysis-content">
                            <pre>${data.analysis}</pre>
                        </div>
                    `;
                }
            } else {
                this.showError(data.error || 'Repository analysis failed');
            }
        } catch (error) {
            this.showError('Network error analyzing repository');
        }
    }

    async connectVSCode() {
        const workspacePath = prompt('Enter your VS Code workspace path:');
        const port = prompt('Enter VS Code server port (default: 3001):') || '3001';
        
        if (!workspacePath) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/vscode/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({ workspacePath, port: parseInt(port) })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.vsCodeConnected = true;
                this.updateVSCodeUI();
                this.showSuccess('VS Code connected successfully');
            } else {
                this.showError(data.error || 'VS Code connection failed');
            }
        } catch (error) {
            this.showError('Network error connecting to VS Code');
        }
    }

    async handleFileUpload(e) {
        const files = Array.from(e.target.files);
        const preview = document.getElementById('filePreview');
        
        if (!preview) return;

        preview.innerHTML = '<h4>Selected Files:</h4>';
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <strong>${file.name}</strong>
                    <small>Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    <small>Type: ${file.type}</small>
                </div>
                <div class="file-preview">
                    ${file.type.startsWith('image/') ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}" />` : ''}
                </div>
            `;
            preview.appendChild(fileItem);
        });
    }

    async uploadFiles() {
        const fileInput = document.getElementById('fileUpload');
        const files = fileInput.files;
        
        if (files.length === 0) {
            this.showError('No files selected');
            return;
        }

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess(`${files.length} files uploaded successfully`);
                
                // Show file analysis if available
                if (data.files && data.files.length > 0) {
                    const analysisDiv = document.getElementById('fileAnalysis');
                    if (analysisDiv) {
                        analysisDiv.innerHTML = `
                            <h4>File Analysis:</h4>
                            ${data.files.map(file => `
                                <div class="file-analysis">
                                    <strong>${file.originalName}</strong>
                                    ${file.analysis ? `<p>${file.analysis.description || 'Analysis complete'}</p>` : ''}
                                </div>
                            `).join('')}
                        `;
                    }
                }
                
                fileInput.value = '';
                document.getElementById('filePreview').innerHTML = '';
            } else {
                this.showError(data.error || 'File upload failed');
            }
        } catch (error) {
            this.showError('Network error uploading files');
        }
    }

    async generateImage() {
        const prompt = document.getElementById('imagePrompt')?.value.trim();
        const model = document.getElementById('imageModel')?.value || 'dall-e-3';
        
        if (!prompt) {
            this.showError('Please enter an image description');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/images/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({ prompt, model })
            });

            const data = await response.json();
            
            if (response.ok) {
                const imageGallery = document.getElementById('imageGallery');
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.innerHTML = `
                    <img src="${data.imageUrl}" alt="${prompt}" />
                    <div class="image-info">
                        <p><strong>Prompt:</strong> ${prompt}</p>
                        <p><strong>Model:</strong> ${data.model}</p>
                    </div>
                `;
                imageGallery.appendChild(imageItem);
                
                document.getElementById('imagePrompt').value = '';
                this.showSuccess('Image generated successfully');
            } else {
                this.showError(data.error || 'Image generation failed');
            }
        } catch (error) {
            this.showError('Network error generating image');
        }
    }

    async scheduleMeeting() {
        const meetingData = {
            title: document.getElementById('meetingTitle')?.value,
            description: document.getElementById('meetingDescription')?.value,
            startTime: document.getElementById('meetingStart')?.value,
            endTime: document.getElementById('meetingEnd')?.value,
            participants: document.getElementById('meetingParticipants')?.value.split(',').map(p => p.trim()),
            location: document.getElementById('meetingLocation')?.value,
            isVirtual: document.getElementById('meetingVirtual')?.checked
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/schedule/meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify(meetingData)
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('Meeting scheduled successfully');
                this.loadMeetings();
                
                // Clear form
                document.getElementById('meetingTitle').value = '';
                document.getElementById('meetingDescription').value = '';
                document.getElementById('meetingStart').value = '';
                document.getElementById('meetingEnd').value = '';
                document.getElementById('meetingParticipants').value = '';
                document.getElementById('meetingLocation').value = '';
                document.getElementById('meetingVirtual').checked = false;
            } else {
                this.showError(data.error || 'Meeting scheduling failed');
            }
        } catch (error) {
            this.showError('Network error scheduling meeting');
        }
    }

    async coordinateAgents() {
        const task = document.getElementById('coordinationTask')?.value.trim();
        const selectedAgents = Array.from(document.querySelectorAll('.agent-checkbox:checked')).map(cb => cb.value);
        
        if (!task || selectedAgents.length === 0) {
            this.showError('Please provide a task and select at least one agent');
            return;
        }

        const workflow = selectedAgents.map((agentType, index) => ({
            name: `step-${index + 1}`,
            agent: agentType,
            task: task,
            passResults: index < selectedAgents.length - 1
        }));

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/multi-agent/coordinate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({
                    task,
                    agents: selectedAgents,
                    workflow
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('Multi-agent coordination started');
                this.displayCoordinationResults(data.results);
            } else {
                this.showError(data.error || 'Multi-agent coordination failed');
            }
        } catch (error) {
            this.showError('Network error coordinating agents');
        }
    }

    async startDeepResearch() {
        const query = document.getElementById('researchQuery')?.value.trim();
        const sources = document.getElementById('researchSources')?.value.trim();
        
        if (!query) {
            this.showError('Please enter a research query');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/agents/researcher/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({
                    message: `Deep research query: ${query}\nSources to focus on: ${sources}`,
                    mode: 'complex'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.displayResearchResults(data.result);
            } else {
                this.showError(data.error || 'Deep research failed');
            }
        } catch (error) {
            this.showError('Network error starting deep research');
        }
    }

    async startDeepCoding() {
        const projectDescription = document.getElementById('projectDescription')?.value.trim();
        const techStack = document.getElementById('techStack')?.value.trim();
        const githubRepo = document.getElementById('codingGitHubRepo')?.value.trim();
        
        if (!projectDescription) {
            this.showError('Please enter a project description');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/agents/deep-coder/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({
                    message: `Build a complete application: ${projectDescription}\nTech stack: ${techStack}`,
                    mode: 'complex',
                    githubRepo
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.displayCodingResults(data.result);
            } else {
                this.showError(data.error || 'Deep coding failed');
            }
        } catch (error) {
            this.showError('Network error starting deep coding');
        }
    }

    async startDataAnalysis() {
        const analysisQuery = document.getElementById('analysisQuery')?.value.trim();
        
        if (!analysisQuery) {
            this.showError('Please enter an analysis query');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/agents/data-analyst/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('superninja_token')}`
                },
                body: JSON.stringify({
                    message: analysisQuery,
                    mode: 'standard',
                    files: this.getCurrentFiles()
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.displayAnalysisResults(data.result);
            } else {
                this.showError(data.error || 'Data analysis failed');
            }
        } catch (error) {
            this.showError('Network error starting data analysis');
        }
    }

    initWebSocket() {
        // This would connect to the WebSocket server for real-time updates
        // For now, we'll simulate it
        this.socket = {
            emit: (event, data) => {
                console.log(`WebSocket emit: ${event}`, data);
            },
            on: (event, callback) => {
                console.log(`WebSocket listen: ${event}`);
            }
        };
    }

    setupRealTimeUpdates() {
        // Listen for real-time updates
        if (this.socket) {
            this.socket.on('taskUpdate', (data) => {
                this.updateTaskStatus(data);
            });

            this.socket.on('vmStatus', (data) => {
                this.updateVMStatus(data);
            });
        }
    }

    updateTasksList() {
        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;

        tasksList.innerHTML = this.tasks.map(task => `
            <div class="task-item ${task.status}">
                <div class="task-header">
                    <strong>${task.type.toUpperCase()}</strong>
                    <span class="task-status">${task.status}</span>
                </div>
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <small>${new Date(task.timestamp).toLocaleString()}</small>
                </div>
            </div>
        `).join('');
    }

    updateVirtualComputerUI() {
        const vmStatus = document.getElementById('vmStatus');
        const vmControls = document.getElementById('vmControls');
        
        if (this.virtualComputer) {
            if (vmStatus) {
                vmStatus.innerHTML = `
                    <div class="vm-info">
                        <p><strong>VM ID:</strong> ${this.virtualComputer.vmId}</p>
                        <p><strong>Status:</strong> ${this.virtualComputer.status}</p>
                        <p><strong>Specs:</strong> ${this.virtualComputer.specs?.cpu}CPU, ${this.virtualComputer.specs?.ram}GB RAM, ${this.virtualComputer.specs?.storage}GB Storage</p>
                    </div>
                `;
            }
            
            if (vmControls) {
                vmControls.innerHTML = `
                    <button id="stopVM" class="btn btn-danger">Stop VM</button>
                    <div class="terminal-section">
                        <input type="text" id="vmCommand" placeholder="Enter command..." />
                        <button id="executeCommand" class="btn btn-primary">Execute</button>
                    </div>
                    <div id="vmTerminal" class="terminal"></div>
                `;
            }
        } else {
            if (vmStatus) {
                vmStatus.innerHTML = '<p>No virtual computer running</p>';
            }
            
            if (vmControls) {
                vmControls.innerHTML = `
                    <select id="vmSpecs">
                        <option value="standard">Standard (8CPU, 32GB RAM, 500GB)</option>
                        <option value="premium">Premium (16CPU, 64GB RAM, 1TB)</option>
                        <option value="enterprise">Enterprise (32CPU, 128GB RAM, 2TB)</option>
                    </select>
                    <button id="startVM" class="btn btn-success">Start Virtual Computer</button>
                `;
            }
        }
    }

    updateGitHubUI() {
        const githubStatus = document.getElementById('githubStatus');
        if (githubStatus) {
            githubStatus.innerHTML = this.githubConnected ? 
                '<span class="status-connected">✓ GitHub Connected</span>' : 
                '<span class="status-disconnected">✗ GitHub Not Connected</span>';
        }
    }

    updateVSCodeUI() {
        const vsCodeStatus = document.getElementById('vsCodeStatus');
        if (vsCodeStatus) {
            vsCodeStatus.innerHTML = this.vsCodeConnected ? 
                '<span class="status-connected">✓ VS Code Connected</span>' : 
                '<span class="status-disconnected">✗ VS Code Not Connected</span>';
        }
    }

    getCurrentFiles() {
        // Return currently uploaded files
        return this.uploadedFiles || [];
    }

    getCurrentGitHubRepo() {
        // Return current GitHub repository if selected
        return this.currentGitHubRepo || '';
    }

    formatMessage(content) {
        // Format markdown-like content
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    displayCoordinationResults(results) {
        const resultsDiv = document.getElementById('coordinationResults');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Multi-Agent Coordination Results</h3>
            ${Object.keys(results).map(step => `
                <div class="coordination-step">
                    <h4>${step}</h4>
                    <div class="step-content">${this.formatMessage(results[step].content)}</div>
                </div>
            `).join('')}
        `;
    }

    displayResearchResults(result) {
        const resultsDiv = document.getElementById('researchResults');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Deep Research Results</h3>
            <div class="research-content">
                <div class="agent-info">Agent: ${result.agent} | Model: ${result.model}</div>
                <div class="research-content">${this.formatMessage(result.content)}</div>
            </div>
        `;
    }

    displayCodingResults(result) {
        const resultsDiv = document.getElementById('codingResults');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Deep Coding Results</h3>
            <div class="coding-content">
                <div class="agent-info">Agent: ${result.agent} | Model: ${result.model}</div>
                <pre><code>${result.content}</code></pre>
            </div>
        `;
    }

    displayAnalysisResults(result) {
        const resultsDiv = document.getElementById('analysisResults');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Data Analysis Results</h3>
            <div class="analysis-content">
                <div class="agent-info">Agent: ${result.agent} | Model: ${result.model}</div>
                <div class="analysis-text">${this.formatMessage(result.content)}</div>
                ${result.visualizations ? `
                    <div class="visualizations">
                        <h4>Generated Visualizations</h4>
                        ${result.visualizations.map(viz => `
                            <div class="visualization">
                                <p><strong>${viz.filename}</strong></p>
                                <p>${viz.suggestions}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    handleNavigation(e) {
        e.preventDefault();
        const target = e.target.getAttribute('data-section');
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(target);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Update nav active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        e.target.classList.add('active');
    }
}

// Initialize the application
const superNinja = new SuperNinjaAI();

// Export for global access
window.superNinja = superNinja;