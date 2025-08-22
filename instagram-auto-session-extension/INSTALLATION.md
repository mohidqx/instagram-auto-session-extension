# Quick Installation Guide - Instagram Auto Session Manager

## 🚀 5-Minute Setup

### Step 1: Install the Extension
1. **Extract** the `instagram-auto-session-extension.zip` file
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top right corner)
4. **Click "Load unpacked"** and select the extracted folder
5. **Pin the extension** to your toolbar for easy access

### Step 2: Create Telegram Bot
1. **Open Telegram** and search for `@BotFather`
2. **Send `/newbot`** and follow the prompts
3. **Choose a name** (e.g., "My Instagram Bot")
4. **Choose a username** (must end with 'bot')
5. **Copy the bot token** (looks like: `123456789:ABCdef...`)
6. **Start a chat** with your new bot

### Step 3: Get Your Chat ID
1. **Send any message** to your bot
2. **Visit this URL** (replace YOUR_BOT_TOKEN):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. **Find the "chat" object** and copy the "id" number

### Step 4: Configure Extension
1. **Click the extension icon** in Chrome
2. **Select "Extension Settings"**
3. **Enter your bot token** and chat ID
4. **Click "Test Connection"** to verify
5. **Save settings**

### Step 5: Use the Extension
1. **Visit instagram.com** and log in
2. **Grant consent** when the consent page opens
3. **Check your Telegram** for the session data message

## ✅ Verification Checklist

- [ ] Extension installed and visible in Chrome toolbar
- [ ] Telegram bot created and token copied
- [ ] Chat ID obtained from getUpdates API
- [ ] Extension settings configured and tested
- [ ] Successfully received test message in Telegram
- [ ] Consent page opens when visiting Instagram
- [ ] Session data received in Telegram after consent

## 🔧 Troubleshooting

### Extension Not Loading
- **Check Chrome version** (requires 88+)
- **Ensure Developer mode** is enabled
- **Try reloading** the extension

### Telegram Connection Failed
- **Verify bot token** format (should have colon and be ~45 characters)
- **Check chat ID** is a number (positive or negative)
- **Ensure you messaged** the bot first

### No Session Detected
- **Log into Instagram** first
- **Refresh the page** after logging in
- **Check popup** for status information

### Consent Page Not Opening
- **Disable popup blockers** for Instagram
- **Check browser permissions**
- **Try in regular (non-incognito) mode**

## 📞 Need Help?

1. **Check the README.md** for detailed documentation
2. **Use extension popup** for status information
3. **Enable activity logging** in settings for debugging
4. **Check browser console** (F12) for error messages

---

**⚠️ Important Notes:**
- Only use with your own Instagram account
- Respect Instagram's Terms of Service
- Keep your bot token secure and private
- The extension requires explicit consent for each session

**🔒 Privacy:**
- All processing happens locally in your browser
- Data only goes to your personal Telegram bot
- No third parties have access to your information

---

*Instagram Auto Session Manager v2.0.0 - Quick Installation Guide*

