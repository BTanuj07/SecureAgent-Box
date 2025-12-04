// SecureAgentbox - Base JavaScript

// Constants
const CONFIG = {
    notificationDuration: 5000,
    fadeDelay: 300,
    modalFocusDelay: 100,
    sidebar: {
        storageKey: 'litterbox_sidebar_collapsed',
        animationDuration: 300
    }
};

// Sidebar Manager - Clean and Simple Approach
class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('app-sidebar');
        this.content = document.getElementById('app-content');
        this.topbar = document.getElementById('app-topbar');
        this.toggleBtn = document.getElementById('sidebar-toggle');
        
        this.isCollapsed = this.getStoredState();
        
        this.init();
    }
    
    init() {
        if (!this.sidebar || !this.toggleBtn) {
            console.warn('Sidebar elements not found');
            return;
        }
        
        // Apply initial state without animation
        this.applyState(false);
        
        // Add event listeners
        this.toggleBtn.addEventListener('click', () => this.toggle());
        
        // Keyboard shortcut (Ctrl/Cmd + B)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggle();
            }
        });
        
        console.log('Sidebar initialized, collapsed:', this.isCollapsed);
    }
    
    toggle() {
        this.isCollapsed = !this.isCollapsed;
        this.applyState(true);
        this.saveState();
        console.log('Sidebar toggled, collapsed:', this.isCollapsed);
    }
    
    applyState(withAnimation = true) {
        if (!withAnimation) {
            // Temporarily disable transitions
            this.sidebar.style.transition = 'none';
            this.content.style.transition = 'none';
            this.topbar.style.transition = 'none';
        }
        
        if (this.isCollapsed) {
            this.sidebar.classList.add('collapsed');
            this.content.classList.add('sidebar-collapsed');
            this.topbar.classList.add('sidebar-collapsed');
            this.toggleBtn.title = 'Expand Sidebar';
        } else {
            this.sidebar.classList.remove('collapsed');
            this.content.classList.remove('sidebar-collapsed');
            this.topbar.classList.remove('sidebar-collapsed');
            this.toggleBtn.title = 'Collapse Sidebar';
        }
        
        if (!withAnimation) {
            // Re-enable transitions after next frame
            requestAnimationFrame(() => {
                this.sidebar.style.transition = '';
                this.content.style.transition = '';
                this.topbar.style.transition = '';
            });
        }
    }
    
    getStoredState() {
        const stored = localStorage.getItem(CONFIG.sidebar.storageKey);
        return stored === 'true';
    }
    
    saveState() {
        localStorage.setItem(CONFIG.sidebar.storageKey, this.isCollapsed.toString());
    }
    
    expand() {
        if (this.isCollapsed) {
            this.toggle();
        }
    }
    
    collapse() {
        if (!this.isCollapsed) {
            this.toggle();
        }
    }
}

// Status Manager Class
class StatusManager {
    constructor() {
        if (window._statusManagerInstance) {
            return window._statusManagerInstance;
        }

        window._statusManagerInstance = this;
        this.isOnline = false;
        this.checkInterval = null;

        this.elements = {
            indicator: document.getElementById('status-indicator'),
            text: document.getElementById('status-text'),
            container: document.querySelector('.status-badge')
        };
        
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    init() {
        this.checkStatus();
        // Check status every 10 seconds
        this.checkInterval = setInterval(() => this.checkStatus(), 10000);
        document.addEventListener('click', this.handleClickOutside);
    }

    async checkStatus() {
        try {
            const response = await fetch('/health', { 
                method: 'GET',
                cache: 'no-cache'
            });
            const data = await response.json();

            if (data.status === 'ok') {
                this.setOnlineState();
            } else {
                this.setDegradedState();
            }
        } catch (error) {
            this.setOfflineState();
        }
    }

    setOnlineState() {
        const { indicator, text } = this.elements;
        
        if (indicator && text) {
            indicator.className = 'status-dot online';
            text.textContent = 'Online';
            text.style.color = '#10b981';
        }
        
        this.isOnline = true;
        this.enableAllFunctionality();
    }

    setDegradedState() {
        const { indicator, text } = this.elements;
        
        if (indicator && text) {
            indicator.className = 'status-dot degraded';
            text.textContent = 'Degraded';
            text.style.color = '#f59e0b';
        }
        
        this.isOnline = true;
        this.enableAllFunctionality();
    }

    setOfflineState() {
        const { indicator, text } = this.elements;
        
        if (indicator && text) {
            indicator.className = 'status-dot offline';
            text.textContent = 'Offline';
            text.style.color = '#ef4444';
        }
        
        this.isOnline = false;
        this.disableAllFunctionality();
    }

    enableAllFunctionality() {
        // Enable all navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.style.pointerEvents = 'auto';
            link.style.opacity = '1';
            link.removeAttribute('title');
        });

        // Enable action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });

        // Enable file upload if on upload page
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.style.pointerEvents = 'auto';
            dropZone.style.opacity = '1';
        }

        // Enable all buttons
        document.querySelectorAll('button:not(.status-badge button)').forEach(btn => {
            if (!btn.classList.contains('keep-disabled')) {
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });
    }

    disableAllFunctionality() {
        // Disable all navigation links except home
        document.querySelectorAll('.nav-link').forEach(link => {
            if (!link.getAttribute('href')?.includes('/')) {
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.5';
                link.setAttribute('title', 'System is offline');
            }
        });

        // Disable action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.setAttribute('title', 'System is offline');
        });

        // Disable file upload if on upload page
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.style.pointerEvents = 'none';
            dropZone.style.opacity = '0.5';
        }

        // Disable all buttons except status-related
        document.querySelectorAll('button:not(.status-badge button)').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.setAttribute('title', 'System is offline');
        });

        // Show offline notification
        if (!document.querySelector('.offline-banner')) {
            this.showOfflineBanner();
        }
    }

    showOfflineBanner() {
        const banner = document.createElement('div');
        banner.className = 'offline-banner fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50';
        banner.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>System Offline - All functionality is disabled</span>
            </div>
        `;
        document.body.prepend(banner);
    }

    handleClickOutside(event) {
        // Placeholder for future use
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        document.removeEventListener('click', this.handleClickOutside);
    }
}

// Navigation Functions
function showSummary() {
    window.location.href = '/summary';
}

function openDoppelganger() {
    window.location.href = '/doppelganger';
}

// Notification System
const NotificationSystem = {
    show(message, type = 'info', duration = CONFIG.notificationDuration) {
        const notification = document.createElement('div');
        const bgColor = this.getBackgroundColor(type);
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white shadow-lg z-50 transition-opacity duration-300`;
        notification.style.maxWidth = '400px';
        notification.style.background = bgColor;
        notification.style.border = `1px solid ${this.getBorderColor(type)}`;
        
        const container = this.createContainer(message);
        notification.appendChild(container);
        document.body.appendChild(notification);
        
        this.setupAutoDismiss(notification, duration);
    },
    
    getBackgroundColor(type) {
        const colors = {
            'success': 'var(--success)',
            'error': 'var(--danger)',
            'warning': 'var(--warning)',
            'info': 'var(--info)',
            'bg-green-500': 'var(--success)',
            'bg-red-500': 'var(--danger)',
            'bg-yellow-500': 'var(--warning)'
        };
        return colors[type] || 'var(--info)';
    },
    
    getBorderColor(type) {
        const colors = {
            'success': 'rgba(0, 255, 136, 0.5)',
            'error': 'rgba(255, 0, 85, 0.5)',
            'warning': 'rgba(255, 170, 0, 0.5)',
            'info': 'rgba(0, 136, 255, 0.5)',
            'bg-green-500': 'rgba(0, 255, 136, 0.5)',
            'bg-red-500': 'rgba(255, 0, 85, 0.5)',
            'bg-yellow-500': 'rgba(255, 170, 0, 0.5)'
        };
        return colors[type] || 'rgba(0, 136, 255, 0.5)';
    },

    createContainer(message) {
        const container = document.createElement('div');
        container.className = 'flex justify-between items-start gap-2';
        
        const messageDiv = document.createElement('div');
        messageDiv.style.whiteSpace = 'pre-line';
        messageDiv.textContent = message;
        
        const closeButton = this.createCloseButton();
        
        container.appendChild(messageDiv);
        container.appendChild(closeButton);
        
        return container;
    },

    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.className = 'text-white hover:text-gray-200 font-bold text-xl leading-none';
        closeButton.onclick = (e) => {
            const notification = e.target.closest('div.fixed');
            this.dismiss(notification);
        };
        return closeButton;
    },

    dismiss(notification) {
        notification.classList.add('opacity-0');
        setTimeout(() => notification.remove(), CONFIG.fadeDelay);
    },

    setupAutoDismiss(notification, duration) {
        setTimeout(() => {
            if (document.body.contains(notification)) {
                this.dismiss(notification);
            }
        }, duration);
    }
};

// Modal Management
const ModalManager = {
    showProcessWarning() {
        const modal = document.getElementById('processWarningModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.focusPIDInput();
        }
    },

    hideProcessWarning() {
        const modal = document.getElementById('processWarningModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    showCleanupWarning() {
        const modal = document.getElementById('cleanupWarningModal');
        modal?.classList.remove('hidden');
    },

    hideCleanupWarning() {
        const modal = document.getElementById('cleanupWarningModal');
        modal?.classList.add('hidden');
    },

    focusPIDInput() {
        setTimeout(() => {
            const pidInput = document.getElementById('processId');
            pidInput?.focus();
        }, CONFIG.modalFocusDelay);
    }
};

// Process Manager
const ProcessManager = {
    validatePID(pid) {
        if (!pid) {
            return { isValid: false, error: 'Please enter a process ID' };
        }
        
        if (!/^\d+$/.test(pid)) {
            return { isValid: false, error: 'PID must be a positive number' };
        }
        
        if (parseInt(pid) <= 0) {
            return { isValid: false, error: 'PID must be greater than 0' };
        }
        
        return { isValid: true };
    },

    async startAnalysis() {
        const pid = document.getElementById('processId')?.value;
        const validation = this.validatePID(pid);
        
        if (!validation.isValid) {
            NotificationSystem.show(validation.error, 'bg-red-500');
            return;
        }
        
        const submitButton = this.updateButtonState('Validating...');
        
        try {
            const validationResponse = await fetch(`/validate/${pid}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!validationResponse.ok) {
                const data = await validationResponse.json();
                throw new Error(this.getErrorMessage(validationResponse.status, pid, data));
            }
            
            ModalManager.hideProcessWarning();
            NotificationSystem.show(`Starting analysis of process ${pid}...`, 'bg-green-500');
            
            window.location.href = `/analyze/dynamic/${pid}`;
            
        } catch (error) {
            console.error('Process analysis error:', error);
            NotificationSystem.show(`${error.message}`, 'bg-red-500');
        } finally {
            this.resetButtonState(submitButton);
        }
    },

    getErrorMessage(status, pid, data) {
        switch (status) {
            case 404: return `Process ID ${pid} not found. Please verify the PID and try again.`;
            case 403: return `Access denied to process ${pid}. Please check permissions.`;
            default: return data.error || 'Unknown error occurred';
        }
    },

    updateButtonState(text) {
        const button = document.querySelector('[onclick="startProcessAnalysis()"]');
        if (button) {
            button.disabled = true;
            button.textContent = text;
        }
        return button;
    },

    resetButtonState(button) {
        if (button) {
            button.disabled = false;
            button.textContent = 'Start Analysis';
        }
    }
};

// Updated Cleanup System
const CleanupSystem = {
    async execute() {
        ModalManager.hideCleanupWarning();
        try {
            const response = await fetch('/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            const { message, className } = this.formatResponse(data);
            NotificationSystem.show(message, className);
            
        } catch (error) {
            NotificationSystem.show(`Error during cleanup: ${error.message}`, 'bg-red-500');
        }
    },
    formatResponse(data) {
        if (data.status === 'success') {
            return {
                message: `Cleanup successful:\n- ${data.details.uploads_cleaned} uploaded files removed\n- ${data.details.analysis_cleaned} analysis results cleaned (PE-Sieve, HolyGrail)\n- ${data.details.result_cleaned} result folders cleaned\n- Doppelganger database cleaned`,
                className: 'bg-green-500'
            };
        } else if (data.status === 'warning') {
            return {
                message: `Cleanup completed with warnings:\n- ${data.details.uploads_cleaned} uploaded files removed\n- ${data.details.analysis_cleaned} analysis results cleaned (PE-Sieve, HolyGrail)\n- ${data.details.result_cleaned} result folders cleaned\n- Doppelganger database cleaned\n\nErrors:\n${data.details.errors.join('\n')}`,
                className: 'bg-yellow-500'
            };
        } else {
            return {
                message: `Cleanup failed: ${data.message || data.error}`,
                className: 'bg-red-500'
            };
        }
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing SecureAgentbox UI...');
    
    // Initialize Sidebar Manager
    const sidebarManager = new SidebarManager();
    window.sidebarManager = sidebarManager; // For debugging
    
    // Initialize Status Manager
    const statusManager = new StatusManager();
    statusManager.init();

    // Setup Modal Event Listeners
    const processModal = document.getElementById('processWarningModal');
    if (processModal) {
        processModal.addEventListener('click', (e) => {
            if (e.target === processModal) ModalManager.hideProcessWarning();
        });
    }

    const cleanupModal = document.getElementById('cleanupWarningModal');
    if (cleanupModal) {
        cleanupModal.addEventListener('click', (e) => {
            if (e.target === cleanupModal) ModalManager.hideCleanupWarning();
        });
    }

    // Global ESC key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ModalManager.hideProcessWarning();
            ModalManager.hideCleanupWarning();
        }
    });
    
    console.log('SecureAgentbox UI initialized successfully');
});

// Export functions for global access
window.showProcessWarning = ModalManager.showProcessWarning.bind(ModalManager);
window.hideProcessWarning = ModalManager.hideProcessWarning.bind(ModalManager);
window.startProcessAnalysis = ProcessManager.startAnalysis.bind(ProcessManager);
window.showCleanupWarning = ModalManager.showCleanupWarning.bind(ModalManager);
window.hideCleanupWarning = ModalManager.hideCleanupWarning.bind(ModalManager);
window.executeCleanup = CleanupSystem.execute.bind(CleanupSystem);
window.cleanupSystem = ModalManager.showCleanupWarning.bind(ModalManager);
window.showNotification = NotificationSystem.show.bind(NotificationSystem);

// Export sidebar controls
window.toggleSidebar = () => window.sidebarManager?.toggle();
window.collapseSidebar = () => window.sidebarManager?.collapse();
window.expandSidebar = () => window.sidebarManager?.expand();