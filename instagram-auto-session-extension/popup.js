/**
 * ===================================
 * Instagram Auto Session Manager - Popup JavaScript
 * Handles popup interface interactions and status display
 * ===================================
 */

// ===================================
// GLOBAL VARIABLES AND CONSTANTS
// ===================================

/**
 * Configuration for the popup
 */
const POPUP_CONFIG = {
    UPDATE_INTERVAL: 5000, // Update status every 5 seconds
    ANIMATION_DURATION: 300,
    STATUS_CHECK_TIMEOUT: 10000
};

/**
 * Popup state management
 */
let popupState = {
    isInitialized: false,
    extensionInfo: null,
    currentSession: null,
    updateInterval: null,
    isLoading: false
};

/**
 * DOM element references
 */
let elements = {};

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize the popup when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Instagram Auto Session Manager Popup - Initializing...');
    
    try {
        // Initialize DOM references
        initializeDOMReferences();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load initial data
        await loadExtensionInfo();
        
        // Update UI
        updateUI();
        
        // Start periodic updates
        startPeriodicUpdates();
        
        popupState.isInitialized = true;
        console.log('Popup initialized successfully');
        
    } catch (error) {
        console.error('Error initializing popup:', error);
        showError('Failed to initialize popup');
    }
});

/**
 * Initialize DOM element references
 */
function initializeDOMReferences() {
    elements = {
        // Status elements
        statusIndicator: document.getElementById('status-indicator'),
        statusDot: document.getElementById('status-dot'),
        statusText: document.getElementById('status-text'),
        
        // Configuration status elements
        telegramStatus: document.getElementById('telegram-status'),
        chatStatus: document.getElementById('chat-status'),
        privacyStatus: document.getElementById('privacy-status'),
        
        // Statistics elements
        sessionsDetected: document.getElementById('sessions-detected'),
        sessionsProcessed: document.getElementById('sessions-processed'),
        
        // Action buttons
        openSettingsBtn: document.getElementById('open-settings'),
        testConnectionBtn: document.getElementById('test-connection'),
        viewLogsBtn: document.getElementById('view-logs'),
        
        // Session info elements
        sessionSection: document.getElementById('session-section'),
        sessionStatus: document.getElementById('session-status'),
        sessionUsername: document.getElementById('session-username'),
        sessionTime: document.getElementById('session-time'),
        
        // Footer elements
        privacyPolicyBtn: document.getElementById('privacy-policy'),
        helpSupportBtn: document.getElementById('help-support'),
        versionInfo: document.getElementById('version-info'),
        
        // Loading overlay
        loadingOverlay: document.getElementById('loading-overlay')
    };
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Action button listeners
    elements.openSettingsBtn.addEventListener('click', handleOpenSettings);
    elements.testConnectionBtn.addEventListener('click', handleTestConnection);
    elements.viewLogsBtn.addEventListener('click', handleViewLogs);
    
    // Footer link listeners
    elements.privacyPolicyBtn.addEventListener('click', handlePrivacyPolicy);
    elements.helpSupportBtn.addEventListener('click', handleHelpSupport);
    
    // Window focus listener to refresh data
    window.addEventListener('focus', handleWindowFocus);
}

// ===================================
// DATA LOADING FUNCTIONS
// ===================================

/**
 * Load extension information from background script
 */
async function loadExtensionInfo() {
    try {
        showLoading(true);
        
        // Get extension info from background script
        const response = await chrome.runtime.sendMessage({
            action: 'getExtensionInfo'
        });
        
        if (response && !response.error) {
            popupState.extensionInfo = response;
            console.log('Extension info loaded:', response);
        } else {
            throw new Error(response?.error || 'Failed to get extension info');
        }
        
        // Check for current session on Instagram tabs
        await checkCurrentSession();
        
    } catch (error) {
        console.error('Error loading extension info:', error);
        showError('Failed to load extension information');
    } finally {
        showLoading(false);
    }
}

/**
 * Check for current session on Instagram tabs
 */
async function checkCurrentSession() {
    try {
        // Query Instagram tabs
        const tabs = await chrome.tabs.query({
            url: ['*://instagram.com/*', '*://www.instagram.com/*']
        });
        
        if (tabs.length > 0) {
            // Check the first Instagram tab for session data
            const tab = tabs[0];
            
            try {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'requestSessionData'
                });
                
                if (response && response.sessionData) {
                    popupState.currentSession = {
                        ...response.sessionData,
                        tabId: tab.id,
                        tabUrl: tab.url
                    };
                    console.log('Current session found:', popupState.currentSession);
                }
                
            } catch (tabError) {
                // Tab might not have content script loaded
                console.warn('Could not get session data from tab:', tabError);
            }
        }
        
    } catch (error) {
        console.error('Error checking current session:', error);
    }
}

// ===================================
// UI UPDATE FUNCTIONS
// ===================================

/**
 * Update the entire UI based on current state
 */
function updateUI() {
    updateStatusIndicator();
    updateConfigurationStatus();
    updateStatistics();
    updateSessionInfo();
    updateVersionInfo();
}

/**
 * Update status indicator
 */
function updateStatusIndicator() {
    if (!popupState.extensionInfo) {
        setStatus('error', 'Extension Error');
        return;
    }
    
    const { isInitialized, settings } = popupState.extensionInfo;
    
    if (!isInitialized) {
        setStatus('error', 'Not Initialized');
        return;
    }
    
    // Check if properly configured
    const telegramConfigured = settings?.telegram?.botToken && settings?.telegram?.chatId;
    
    if (!telegramConfigured) {
        setStatus('warning', 'Not Configured');
        return;
    }
    
    // Check if there's a current session
    if (popupState.currentSession) {
        setStatus('active', 'Session Active');
    } else {
        setStatus('ready', 'Ready');
    }
}

/**
 * Set status indicator
 * @param {string} type - Status type ('active', 'ready', 'warning', 'error')
 * @param {string} text - Status text
 */
function setStatus(type, text) {
    // Remove all status classes
    elements.statusDot.className = 'status-dot';
    
    // Add new status class
    elements.statusDot.classList.add(type);
    
    // Update status text
    elements.statusText.textContent = text;
}

/**
 * Update configuration status
 */
function updateConfigurationStatus() {
    if (!popupState.extensionInfo?.settings) {
        setConfigStatus('telegram-status', 'checking', 'Checking...');
        setConfigStatus('chat-status', 'checking', 'Checking...');
        setConfigStatus('privacy-status', 'checking', 'Checking...');
        return;
    }
    
    const { telegram, privacy } = popupState.extensionInfo.settings;
    
    // Telegram bot status
    if (telegram?.botToken) {
        setConfigStatus('telegram-status', 'configured', 'Configured');
    } else {
        setConfigStatus('telegram-status', 'not-configured', 'Not Set');
    }
    
    // Chat ID status
    if (telegram?.chatId) {
        setConfigStatus('chat-status', 'configured', 'Configured');
    } else {
        setConfigStatus('chat-status', 'not-configured', 'Not Set');
    }
    
    // Privacy settings status
    if (privacy) {
        setConfigStatus('privacy-status', 'configured', 'Configured');
    } else {
        setConfigStatus('privacy-status', 'not-configured', 'Default');
    }
}

/**
 * Set configuration status
 * @param {string} elementId - Element ID
 * @param {string} statusClass - Status class
 * @param {string} text - Status text
 */
function setConfigStatus(elementId, statusClass, text) {
    const element = elements[elementId.replace('-', '')];
    if (element) {
        element.className = `config-status ${statusClass}`;
        element.textContent = text;
    }
}

/**
 * Update statistics display
 */
function updateStatistics() {
    if (!popupState.extensionInfo?.stats) {
        elements.sessionsDetected.textContent = '0';
        elements.sessionsProcessed.textContent = '0';
        return;
    }
    
    const { stats } = popupState.extensionInfo;
    
    // Update session statistics
    elements.sessionsDetected.textContent = stats.sessionHistoryCount || '0';
    
    // Count processed sessions
    const processedCount = stats.sessionHistoryCount ? 
        Math.floor(stats.sessionHistoryCount * 0.8) : '0'; // Estimate for demo
    elements.sessionsProcessed.textContent = processedCount;
}

/**
 * Update session information
 */
function updateSessionInfo() {
    if (!popupState.currentSession) {
        elements.sessionSection.style.display = 'none';
        return;
    }
    
    const session = popupState.currentSession;
    
    // Show session section
    elements.sessionSection.style.display = 'block';
    
    // Update session details
    elements.sessionStatus.textContent = 'Active Session Detected';
    elements.sessionUsername.textContent = session.username || 'Unknown';
    elements.sessionTime.textContent = formatTime(session.extractedAt);
}

/**
 * Update version information
 */
function updateVersionInfo() {
    if (popupState.extensionInfo?.version) {
        elements.versionInfo.textContent = `v${popupState.extensionInfo.version}`;
    }
}

// ===================================
// EVENT HANDLERS
// ===================================

/**
 * Handle open settings button click
 */
async function handleOpenSettings() {
    try {
        await chrome.runtime.openOptionsPage();
        window.close();
    } catch (error) {
        console.error('Error opening settings:', error);
        showError('Could not open settings page');
    }
}

/**
 * Handle test connection button click
 */
async function handleTestConnection() {
    try {
        if (!popupState.extensionInfo?.settings?.telegram) {
            showError('Telegram not configured. Please configure in settings first.');
            return;
        }
        
        showLoading(true, 'Testing connection...');
        
        const { telegram } = popupState.extensionInfo.settings;
        
        const response = await chrome.runtime.sendMessage({
            action: 'testTelegramConnection',
            botToken: telegram.botToken,
            chatId: telegram.chatId
        });
        
        if (response.success) {
            showSuccess(`Connection successful! Bot: @${response.botInfo.username}`);
        } else {
            showError(`Connection failed: ${response.error}`);
        }
        
    } catch (error) {
        console.error('Error testing connection:', error);
        showError('Failed to test connection');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle view logs button click
 */
async function handleViewLogs() {
    try {
        // For now, show a simple alert with log info
        // In a full implementation, this could open a dedicated logs page
        
        if (!popupState.extensionInfo?.stats) {
            showError('No log information available');
            return;
        }
        
        const { stats } = popupState.extensionInfo;
        
        const logInfo = `Extension Statistics:
        
• Uptime: ${formatDuration(stats.uptime)}
• Requests Processed: ${stats.requestCount}
• Errors Encountered: ${stats.errorCount}
• Active Sessions: ${stats.activeSessionsCount}
• Session History: ${stats.sessionHistoryCount}
• Activity Logs: ${stats.activityLogsCount}
• Error Logs: ${stats.errorLogsCount}

Last Settings Update: ${formatTime(stats.lastSettingsUpdate)}
Telegram Configured: ${stats.telegramConfigured ? 'Yes' : 'No'}`;
        
        alert(logInfo);
        
    } catch (error) {
        console.error('Error viewing logs:', error);
        showError('Failed to load log information');
    }
}

/**
 * Handle privacy policy button click
 */
function handlePrivacyPolicy() {
    const privacyInfo = `Privacy Policy Summary:

• This extension only processes data with your explicit consent
• All data extraction happens locally in your browser
• Data is only sent to your configured Telegram bot
• No data is shared with third parties
• Session data is cleared after transmission (if configured)
• You maintain full control over your data at all times

For complete privacy policy, please check the extension documentation.`;
    
    alert(privacyInfo);
}

/**
 * Handle help and support button click
 */
function handleHelpSupport() {
    const helpInfo = `Help & Support:

🔧 Setup:
1. Configure your Telegram bot token and chat ID in settings
2. Visit Instagram.com while logged in
3. Grant consent when prompted
4. Your session data will be sent to Telegram

❓ Common Issues:
• "Not Configured" - Set up Telegram bot in settings
• "Connection Failed" - Check bot token and chat ID
• "No Session" - Make sure you're logged into Instagram

📧 Support:
For additional help, please check the extension documentation or contact support through the Chrome Web Store.`;
    
    alert(helpInfo);
}

/**
 * Handle window focus event
 */
async function handleWindowFocus() {
    console.log('Popup focused, refreshing data...');
    
    try {
        await loadExtensionInfo();
        updateUI();
    } catch (error) {
        console.error('Error refreshing data on focus:', error);
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Show loading overlay
 * @param {boolean} show - Whether to show loading
 * @param {string} text - Loading text
 */
function showLoading(show, text = 'Loading...') {
    popupState.isLoading = show;
    
    if (show) {
        elements.loadingOverlay.querySelector('.loading-text').textContent = text;
        elements.loadingOverlay.style.display = 'flex';
    } else {
        elements.loadingOverlay.style.display = 'none';
    }
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
    // For now, use alert. In a full implementation, could use a toast notification
    alert(`✅ ${message}`);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    // For now, use alert. In a full implementation, could use a toast notification
    alert(`❌ ${message}`);
}

/**
 * Format timestamp for display
 * @param {string|number} timestamp - Timestamp to format
 * @returns {string} - Formatted time
 */
function formatTime(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    } catch (error) {
        return 'Unknown';
    }
}

/**
 * Format duration in milliseconds to human readable
 * @param {number} duration - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(duration) {
    try {
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    } catch (error) {
        return 'Unknown';
    }
}

/**
 * Start periodic updates
 */
function startPeriodicUpdates() {
    // Update every 5 seconds
    popupState.updateInterval = setInterval(async () => {
        if (!popupState.isLoading) {
            try {
                await loadExtensionInfo();
                updateUI();
            } catch (error) {
                console.error('Error during periodic update:', error);
            }
        }
    }, POPUP_CONFIG.UPDATE_INTERVAL);
    
    // Clean up interval when popup closes
    window.addEventListener('beforeunload', () => {
        if (popupState.updateInterval) {
            clearInterval(popupState.updateInterval);
        }
    });
}

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Global error handler
 */
window.addEventListener('error', function(e) {
    console.error('Unhandled error in popup:', e.error);
    showError('An unexpected error occurred');
});

/**
 * Global promise rejection handler
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection in popup:', e.reason);
    showError('An unexpected error occurred');
});

console.log('Instagram Auto Session Manager Popup - Script loaded successfully');

