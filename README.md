# Instagram Auto Session Manager v2.0.0
A comprehensive Chrome extension that transparently detects Instagram sessions and sends session data to your Telegram bot with explicit user consent. Built with privacy-first design and full transparency.
by [r00t:~#]
## 🎯 Overview
Instagram Auto Session Manager is a Chrome extension designed for educational and personal use that:
- **Detects Instagram sessions** when you visit instagram.com
- **Asks for explicit consent** before any data processing
- **Extracts session data** (session ID, user ID, username) locally in your browser
- **Sends data to your Telegram bot** only after your approval
- **Maintains full transparency** with comprehensive logging and user control

## ✨ Key Features

### 🔒 Privacy & Security First
- **Explicit consent required** for every action
- **Local data processing** - no third-party servers
- **Transparent operations** with detailed logging
- **User-controlled data management**
- **Automatic data cleanup** options

### 🤖 Telegram Integration
- **Secure bot configuration** with validation
- **Customizable message templates**
- **Connection testing** before use
- **Error handling and retry logic**

### 🎨 Modern User Interface
- **Instagram-themed design** with gradient styling
- **Responsive layout** for all screen sizes
- **Animated interactions** and smooth transitions
- **Accessibility support** with keyboard navigation
- **Dark mode compatibility**

### 📊 Comprehensive Monitoring
- **Real-time status indicators**
- **Session detection statistics**
- **Activity logging** (optional)
- **Error tracking and reporting**
- **Performance monitoring**

## 🚀 Quick Start

### Prerequisites
1. **Google Chrome** browser (version 88 or higher)
2. **Telegram bot** with bot token
3. **Telegram chat ID** where you want to receive messages

### Installation Steps

1. **Download the Extension**
   - Download the `instagram-auto-session-extension.zip` file
   - Extract it to a folder on your computer

2. **Install in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the extracted folder
   - The extension icon should appear in your toolbar

3. **Configure Telegram Bot**
   - Click the extension icon and select "Extension Settings"
   - Enter your Telegram bot token and chat ID
   - Test the connection to ensure it works
   - Save your settings

4. **Start Using**
   - Visit `instagram.com` while logged in
   - The extension will detect your session and ask for consent
   - Review the consent page and approve if you agree
   - Your session data will be sent to your Telegram bot

## 📋 Detailed Setup Guide

### Creating a Telegram Bot

1. **Start a chat with @BotFather** on Telegram
2. **Send `/newbot`** and follow the instructions
3. **Choose a name** for your bot (e.g., "My Instagram Session Bot")
4. **Choose a username** (must end with 'bot', e.g., "myinstagrambot")
5. **Copy the bot token** provided by BotFather
6. **Start a chat with your new bot** and send any message

### Finding Your Chat ID

1. **Send a message to your bot** on Telegram
2. **Visit this URL** in your browser (replace YOUR_BOT_TOKEN):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. **Look for the "chat" object** in the response
4. **Copy the "id" value** (this is your chat ID)

### Extension Configuration

1. **Open Extension Settings**
   - Click the extension icon in Chrome toolbar
   - Select "Extension Settings" or right-click → "Options"

2. **Configure Telegram**
   - Paste your bot token in the "Bot Token" field
   - Paste your chat ID in the "Chat ID" field
   - Customize the message template if desired
   - Click "Test Connection" to verify setup
   - Save your settings

3. **Configure Privacy Settings**
   - Choose whether to auto-clear data after sending
   - Enable/disable notifications
   - Set consent reminder preferences
   - Configure activity logging (optional)

## 🔧 Usage Instructions

### Basic Usage

1. **Visit Instagram**
   - Go to `instagram.com` and log in to your account
   - The extension will automatically detect your session

2. **Consent Process**
   - A consent page will open asking for your permission
   - Review what data will be extracted and sent
   - Check the required consent boxes
   - Click "Give Consent & Proceed" to continue

3. **Data Transmission**
   - Your session data will be extracted locally
   - It will be formatted using your message template
   - The data will be sent to your Telegram bot
   - You'll receive a success confirmation

### Advanced Features

#### Data Preview
- Check "Show me the data before sending" in the consent page
- Review the exact data that will be sent
- Proceed only if you're comfortable with the information

#### Remember Choice
- Check "Remember my choice for this session"
- The extension won't ask again during the same browser session
- Resets when you close and reopen Chrome

#### Custom Message Templates
- Modify the message template in settings
- Use variables like `{sessionId}`, `{userId}`, `{username}`, `{timestamp}`, `{url}`
- Preview how your messages will look

## 🛡️ Privacy & Security

### Data Handling
- **Local Processing**: All data extraction happens in your browser
- **No Third Parties**: Data is only sent to your configured Telegram bot
- **Explicit Consent**: No action is taken without your approval
- **Temporary Storage**: Data is cleared after transmission (configurable)
- **Secure Transmission**: Uses HTTPS for all API communications

### What Data is Collected
- **Session ID**: Your Instagram session identifier from cookies
- **User ID**: Your Instagram user ID (if available)
- **Username**: Your Instagram username (if available)
- **Timestamp**: When the data was extracted
- **URL**: The Instagram page you were visiting

### What Data is NOT Collected
- **Passwords**: Never accessed or transmitted
- **Personal Messages**: Not accessed
- **Photos or Media**: Not accessed
- **Browsing History**: Only current Instagram page
- **Other Cookies**: Only Instagram session cookie

### Security Measures
- **Input Validation**: All data is validated before processing
- **Error Handling**: Comprehensive error handling prevents data leaks
- **Rate Limiting**: Built-in protections against abuse
- **Secure Storage**: Settings encrypted in Chrome's secure storage

## 🔍 Troubleshooting

### Common Issues

#### "Extension Not Working"
- **Check Chrome Version**: Requires Chrome 88+
- **Reload Extension**: Go to `chrome://extensions/` and reload
- **Check Console**: Press F12 and look for error messages
- **Reinstall**: Remove and reinstall the extension

#### "Telegram Not Configured"
- **Verify Bot Token**: Ensure it's correct and active
- **Check Chat ID**: Must be the exact chat ID from getUpdates
- **Test Connection**: Use the built-in connection test
- **Bot Permissions**: Ensure bot can send messages

#### "No Session Detected"
- **Log into Instagram**: Must be logged in for detection
- **Clear Cache**: Clear browser cache and cookies
- **Disable Other Extensions**: Check for conflicts
- **Check URL**: Must be on instagram.com domain

#### "Consent Page Not Opening"
- **Popup Blocker**: Disable popup blockers for Instagram
- **Browser Permissions**: Ensure extension has necessary permissions
- **Incognito Mode**: Extension may not work in incognito
- **Multiple Tabs**: Close other Instagram tabs

### Error Messages

#### "Invalid bot token format"
- Bot token should look like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
- Get a new token from @BotFather if needed

#### "Failed to send test message"
- Check if bot is blocked or deleted
- Verify chat ID is correct
- Ensure you've sent at least one message to the bot

#### "Could not extract session data"
- Instagram may have changed their structure
- Try logging out and back in
- Clear cookies and try again

### Getting Help

1. **Check Documentation**: Review this README thoroughly
2. **Extension Popup**: Click extension icon for status information
3. **Browser Console**: Press F12 to see detailed error messages
4. **Activity Logs**: Enable logging in settings for debugging
5. **Contact Support**: Report issues through Chrome Web Store

## 🔧 Technical Details

### Architecture

The extension consists of several components:

#### Manifest v3 Structure
- **Background Service Worker**: Handles core logic and API calls
- **Content Script**: Detects sessions on Instagram pages
- **Options Page**: Configuration interface
- **Consent Page**: User consent and data preview
- **Popup**: Quick status and actions

#### Key Technologies
- **Chrome Extensions API**: Manifest v3 compliance
- **Telegram Bot API**: Secure message transmission
- **Modern JavaScript**: ES6+ features with comprehensive error handling
- **CSS Grid/Flexbox**: Responsive design
- **Chrome Storage API**: Secure settings storage

### File Structure
```
instagram-auto-session-extension/
├── manifest.json              # Extension configuration
├── background.js             # Background service worker
├── content.js               # Content script for Instagram
├── consent.html/css/js      # Consent page interface
├── options.html/css/js      # Settings page interface
├── popup.html/css/js        # Extension popup interface
├── icons/                   # Extension icons
├── README.md               # This documentation
└── PRIVACY.md              # Privacy policy
```

### API Endpoints Used
- **Telegram Bot API**: `https://api.telegram.org/bot{token}/`
  - `getMe`: Verify bot configuration
  - `sendMessage`: Send session data

### Permissions Required
- **activeTab**: Access current Instagram tab
- **storage**: Save extension settings
- **scripting**: Inject content scripts
- **host permissions**: Access Instagram.com

### Browser Compatibility
- **Chrome**: Version 88+ (Manifest v3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Other Browsers**: Not supported (Chrome extension specific)

## 📄 Legal & Compliance

### Terms of Use
- **Personal Use Only**: This extension is for educational and personal use
- **Respect Platform Terms**: Always comply with Instagram's Terms of Service
- **Own Account Only**: Only use with your own Instagram account
- **No Commercial Use**: Not intended for commercial or bulk operations

### Privacy Compliance
- **GDPR Compliant**: Explicit consent and data minimization
- **CCPA Compliant**: User control and transparency
- **No Data Retention**: Data cleared after transmission
- **User Rights**: Full control over data processing

### Disclaimer
This extension is provided "as is" without warranty. Users are responsible for:
- Complying with applicable laws and platform terms
- Securing their Telegram bot tokens
- Using the extension responsibly
- Understanding the privacy implications

## 🤝 Contributing

This extension is provided as-is for educational purposes. If you encounter issues:

1. **Report Bugs**: Use Chrome Web Store reviews or feedback
2. **Suggest Features**: Contact through official channels
3. **Security Issues**: Report privately to maintain user safety

## 📝 Changelog

### Version 2.0.0 (Current)
- **New**: Comprehensive consent page with data preview
- **New**: Modern popup interface with real-time status
- **New**: Enhanced privacy controls and settings
- **New**: Activity logging and error tracking
- **New**: Improved Telegram integration with testing
- **New**: Responsive design for all screen sizes
- **Improved**: Better session detection reliability
- **Improved**: Enhanced error handling and user feedback
- **Fixed**: Various UI/UX improvements

### Version 1.0.0 (Previous)
- Initial release with basic functionality
- Simple consent mechanism
- Basic Telegram integration

## 📞 Support
For support and questions:
1. **Documentation**: Review this README and PRIVACY.md
2. **Extension Popup**: Check status and run diagnostics
3. **Browser Console**: Look for detailed error messages
4. **Chrome Web Store**: Leave feedback or reviews
---

**⚠️ Important**: This extension is for educational and personal use only. Always respect Instagram's Terms of Service and applicable laws. Only use with your own Instagram account.
**🔒 Privacy**: Your data is processed locally and only sent to your configured Telegram bot. No third parties have access to your information.
**📧 Contact**: For security issues or important feedback, please use official Chrome Web Store channels.

---

*Instagram Auto Session Manager v2.0.0 - Built with privacy and transparency in mind.*

