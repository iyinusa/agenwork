// AgenWork Popup JavaScript
// Main script for the Chrome Extension popup interface

document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  // Initialize the popup
  initializePopup();
  
  // Initialize event listeners
  initializeEventListeners();
  
  // Initialize database first, then load settings
  initializeDatabase().then(() => {
    console.log('Database initialization completed successfully');
    // Load settings after database is ready
    loadSettings();
  }).catch(error => {
    console.error('Database initialization failed:', error.message || error.toString() || error);
    // Fall back to loading settings without database
    loadSettings();
  });
  
  // Handle floating mode messaging
  initializeFloatingMode();
});

// Initialize floating mode communication
function initializeFloatingMode() {
  // Listen for messages from parent window (when in iframe)
  window.addEventListener('message', (event) => {
    if (event.data.type === 'FLOATING_MODE') {
      // Handle floating mode initialization
      handleFloatingModeInit(event.data.enabled);
    }
  });
  
  // Send ready signal if in iframe
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'POPUP_READY',
      timestamp: Date.now()
    }, '*');
  }
}

// Handle floating mode initialization
function handleFloatingModeInit(enabled) {
  if (enabled) {
    console.log('Popup running in floating mode');
    
    // Hide floating toggle button in floating mode to prevent recursion
    const floatingToggle = document.getElementById('floatingToggle');
    if (floatingToggle) {
      floatingToggle.style.display = 'none';
    }
    
    // Add a visual indicator that this is floating mode
    const header = document.querySelector('.agenwork-header');
    if (header) {
      header.style.cursor = 'move';
      header.title = 'Drag to move the floating popup';
    }
  }
}

// Global variables
let currentConversationId = null;
let db = null;
let currentView = 'chat';

// Initialize popup
function initializePopup() {
  console.log('AgenWork popup initialized');
  
  // Set theme based on system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  
  // Add initialization animation
  const container = document.querySelector('.agenwork-container');
  container.style.opacity = '0';
  container.style.transform = 'scale(0.95) translateY(20px)';
  
  requestAnimationFrame(() => {
    container.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    container.style.opacity = '1';
    container.style.transform = 'scale(1) translateY(0)';
  });
  
  // Show welcome message with delay
  setTimeout(() => {
    showWelcomeMessage();
  }, 200);
  
  // Update status with delay
  setTimeout(() => {
    updateStatus('Ready', 'success');
  }, 500);
  
  // Update version display
  updateVersionFromManifest();
}

// Update version display from manifest
function updateVersionFromManifest() {
  try {
    const manifest = chrome.runtime.getManifest();
    const versionElement = document.getElementById('versionDisplay');
    if (versionElement && manifest && manifest.version) {
      versionElement.textContent = `AgenWork v${manifest.version}`;
    }
  } catch (error) {
    console.error('Error getting manifest version:', error);
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Navigation buttons
  document.getElementById('settingsBtn').addEventListener('click', () => switchView('settings'));
  document.getElementById('historyBtn').addEventListener('click', () => switchView('history'));
  document.getElementById('backFromSettings').addEventListener('click', () => switchView('chat'));
  document.getElementById('backFromHistory').addEventListener('click', () => switchView('chat'));
  
  // Floating icon toggle
  document.getElementById('floatingToggle').addEventListener('click', toggleFloatingIcon);
  document.getElementById('floatingIconToggle').addEventListener('change', handleFloatingIconToggle);
  
  // Message input
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  messageInput.addEventListener('input', function() {
    sendBtn.disabled = this.value.trim() === '';
  });
  
  sendBtn.addEventListener('click', sendMessage);
  
  // Quick action buttons
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const action = this.dataset.action;
      handleQuickAction(action);
    });
  });
  
  // Settings
  document.getElementById('themeSelect').addEventListener('change', handleThemeChange);
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  document.getElementById('importDataBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', importData);
  document.getElementById('refreshStatsBtn').addEventListener('click', updateDatabaseStats);
  
  // AI Agent toggles
  document.getElementById('summarizerToggle').addEventListener('change', () => saveSettings());
  document.getElementById('translatorToggle').addEventListener('change', () => saveSettings());
  document.getElementById('writerToggle').addEventListener('change', () => saveSettings());
  document.getElementById('prompterToggle').addEventListener('change', () => saveSettings());
}

// Switch between views
function switchView(viewName) {
  const currentActiveView = document.querySelector('.view.active');
  const targetView = document.getElementById(viewName + 'View');
  
  if (!targetView || targetView === currentActiveView) return;
  
  // Animate out current view
  if (currentActiveView) {
    currentActiveView.style.transform = 'translateX(-100%) scale(0.95)';
    currentActiveView.style.opacity = '0';
    currentActiveView.style.filter = 'blur(10px)';
    
    setTimeout(() => {
      currentActiveView.classList.remove('active');
    }, 200);
  }
  
  // Animate in target view
  setTimeout(() => {
    targetView.classList.add('active');
    currentView = viewName;
    
    // Add entrance animation with a slight delay
    requestAnimationFrame(() => {
      targetView.style.transform = 'translateX(0) scale(1)';
      targetView.style.opacity = '1';
      targetView.style.filter = 'blur(0)';
    });
    
    // Load view-specific data
    if (viewName === 'history') {
      setTimeout(() => loadConversationHistory(), 100);
    } else if (viewName === 'settings') {
      // Wait for database to be initialized before updating stats
      setTimeout(async () => {
        // Wait for database initialization if it's still initializing
        let attempts = 0;
        while (!agenWorkDB.isInitialized && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        updateDatabaseStats();
      }, 100);
    }
  }, currentActiveView ? 150 : 0);
}

// Toggle floating icon
async function toggleFloatingIcon() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get current state
    const result = await chrome.storage.local.get(['isFloatingIconEnabled']);
    const currentState = result.isFloatingIconEnabled || false;
    const newState = !currentState;
    
    const response = await chrome.runtime.sendMessage({
      type: 'TOGGLE_FLOATING_ICON',
      enabled: newState
    });
    
    if (response && response.success) {
      updateStatus(`Floating icon ${newState ? 'enabled' : 'disabled'}`, 'success');
      
      // Update the settings toggle to reflect current state
      document.getElementById('floatingIconToggle').checked = newState;
    }
  } catch (error) {
    console.error('Error toggling floating icon:', error);
    updateStatus('Error toggling floating icon', 'error');
  }
}

// Handle floating icon toggle from settings
function handleFloatingIconToggle(e) {
  const enabled = e.target.checked;
  chrome.runtime.sendMessage({
    type: 'TOGGLE_FLOATING_ICON',
    enabled: enabled
  });
}

// Send message
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  
  if (!message) return;
  
  // Clear input and disable send button
  messageInput.value = '';
  document.getElementById('sendBtn').disabled = true;
  
  // Add user message to chat
  addMessageToChat(message, 'user');
  
  // Show typing indicator
  showTypingIndicator();
  
  try {
    // Process message with AI
    const result = await processMessage(message);
    const response = result.response || result;
    const agentType = result.agentType || 'prompter';
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add AI response to chat
    addMessageToChat(response, 'agent');
    
    // Save conversation
    await saveConversation(message, response, agentType);
    
  } catch (error) {
    console.error('Error processing message:', error);
    hideTypingIndicator();
    addMessageToChat('Sorry, I encountered an error processing your message. Please try again.', 'agent');
    updateStatus('Error processing message', 'error');
  }
}

// Process message with appropriate AI agent
async function processMessage(message) {
  updateStatus('Processing message...', 'processing');
  
  // Detect intent using the prompter agent
  const intent = await detectIntent(message);
  
  let response = '';
  
  // Route to appropriate agent based on intent
  switch (intent.primary) {
    case 'summarize':
      response = await handleSummarizeRequest(message, intent);
      break;
    case 'translate':
      response = await handleTranslateRequest(message, intent);
      break;
    case 'write':
      response = await handleWriteRequest(message, intent);
      break;
    case 'research':
      response = await handleResearchRequest(message, intent);
      break;
    default:
      response = await handleGeneralRequest(message);
  }
  
  updateStatus('Ready', 'success');
  return {
    response: response,
    agentType: intent.primary === 'general' ? 'prompter' : intent.primary + 'r'
  };
}

// Detect user intent
async function detectIntent(message) {
  // This is a simplified intent detection
  // In a real implementation, this would use the Prompter agent with Gemini Nano
  
  const intents = {
    summarize: ['summarize', 'summary', 'tldr', 'brief', 'overview'],
    translate: ['translate', 'translation', 'convert language', 'in spanish', 'in french'],
    write: ['write', 'compose', 'draft', 'create', 'help me write'],
    research: ['research', 'find', 'search', 'learn about', 'tell me about']
  };
  
  const lowerMessage = message.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return { primary: intent, confidence: 0.8 };
    }
  }
  
  return { primary: 'general', confidence: 1.0 };
}

// Handle different types of requests
async function handleSummarizeRequest(message, intent) {
  // Get current page content
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
    
    if (response.success) {
      return `Here's a summary of the current page "${response.content.title}":\n\nThis feature will be fully implemented with Chrome's Summarizer API. For now, I can see you're on: ${response.content.url}`;
    }
  } catch (error) {
    return "I'd be happy to help summarize content! The Summarizer AI agent will be fully implemented with Chrome's built-in Summarizer API.";
  }
  
  return "I'd be happy to help summarize content! Please make sure you're on a page you'd like me to summarize.";
}

async function handleTranslateRequest(message, intent) {
  return "I can help with translation! The Translator AI agent will be implemented using Chrome's built-in Translator API. What would you like me to translate?";
}

async function handleWriteRequest(message, intent) {
  return "I'm here to help with your writing! The Writer AI agent will use Chrome's built-in Writer API to assist with composing, editing, and improving text. What would you like help writing?";
}

async function handleResearchRequest(message, intent) {
  return "I can help you research topics! I'll use Chrome's built-in AI to analyze web content and provide insights. What would you like to research?";
}

async function handleGeneralRequest(message) {
  return "Thanks for your message! I'm AgenWork, your smart browsing assistant. I can help with summarizing content, translating text, writing assistance, and research. How can I help you today?";
}

// Handle quick actions
function handleQuickAction(action) {
  const messageInput = document.getElementById('messageInput');
  
  switch (action) {
    case 'summarize':
      messageInput.value = 'Please summarize this page for me';
      break;
    case 'translate':
      messageInput.value = 'Translate this page to ';
      break;
    case 'write':
      messageInput.value = 'Help me write ';
      break;
  }
  
  messageInput.focus();
  document.getElementById('sendBtn').disabled = false;
}

// Add message to chat
function addMessageToChat(message, sender) {
  const messagesContainer = document.getElementById('messagesContainer');
  
  // Hide welcome message if it exists
  const welcomeMessage = messagesContainer.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.style.transition = 'all 0.3s ease';
    welcomeMessage.style.opacity = '0';
    welcomeMessage.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      welcomeMessage.style.display = 'none';
    }, 300);
  }
  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = sender === 'user' ? 'U' : 'A';
  
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = message;
  
  messageElement.appendChild(avatar);
  messageElement.appendChild(bubble);
  
  // Add subtle delay for staggered animation
  const delay = messagesContainer.querySelectorAll('.message').length * 50;
  messageElement.style.animationDelay = `${delay}ms`;
  
  messagesContainer.appendChild(messageElement);
  
  // Smooth scroll to bottom
  messagesContainer.scrollTo({
    top: messagesContainer.scrollHeight,
    behavior: 'smooth'
  });
}

// Show/hide typing indicator
function showTypingIndicator() {
  document.getElementById('typingIndicator').classList.add('active');
}

function hideTypingIndicator() {
  document.getElementById('typingIndicator').classList.remove('active');
}

// Show welcome message
function showWelcomeMessage() {
  const messagesContainer = document.getElementById('messagesContainer');
  const welcomeMessage = messagesContainer.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.style.display = 'block';
  }
}

// Update status
function updateStatus(message, type = 'info') {
  const statusText = document.querySelector('.status-text');
  const statusDot = document.querySelector('.status-dot');
  
  statusText.textContent = message;
  
  // Remove existing status classes
  statusDot.className = 'status-dot';
  
  // Add new status class
  switch (type) {
    case 'success':
      statusDot.style.background = 'var(--success-color)';
      break;
    case 'error':
      statusDot.style.background = 'var(--danger-color)';
      break;
    case 'processing':
      statusDot.style.background = 'var(--warning-color)';
      break;
    default:
      statusDot.style.background = 'var(--primary-color)';
  }
}

// Load and save settings
async function loadSettings() {
  try {
    // Check if database is initialized
    if (!agenWorkDB.isInitialized) {
      // Fall back to chrome storage temporarily
      chrome.storage.local.get([
        'isFloatingIconEnabled',
        'theme',
        'aiSettings'
      ], (result) => {
        updateUIWithSettings(result);
      });
      return;
    }
    
    // Load settings from database
    const settings = await agenWorkDB.getAllSettings();
    
    // Convert database settings format to UI format
    const uiSettings = {
      isFloatingIconEnabled: settings.floatingEnabled ?? false,
      theme: settings.theme ?? 'auto',
      aiSettings: {
        summarizer: settings.summarizerEnabled ?? true,
        translator: settings.translatorEnabled ?? true,
        writer: settings.writerEnabled ?? true,
        prompter: settings.prompterEnabled ?? true
      }
    };
    
    updateUIWithSettings(uiSettings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Fall back to default settings
    updateUIWithSettings({});
  }
}

function updateUIWithSettings(settings) {
  // Update floating icon toggle
  const floatingToggle = document.getElementById('floatingIconToggle');
  if (floatingToggle && settings.isFloatingIconEnabled !== undefined) {
    floatingToggle.checked = settings.isFloatingIconEnabled;
  }
  
  // Update theme
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect && settings.theme) {
    themeSelect.value = settings.theme;
    if (settings.theme !== 'auto') {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }
  
  // Update AI settings
  if (settings.aiSettings) {
    const summarizerToggle = document.getElementById('summarizerToggle');
    const translatorToggle = document.getElementById('translatorToggle');
    const writerToggle = document.getElementById('writerToggle');
    const prompterToggle = document.getElementById('prompterToggle');
    
    if (summarizerToggle) summarizerToggle.checked = settings.aiSettings.summarizer ?? true;
    if (translatorToggle) translatorToggle.checked = settings.aiSettings.translator ?? true;
    if (writerToggle) writerToggle.checked = settings.aiSettings.writer ?? true;
    if (prompterToggle) prompterToggle.checked = settings.aiSettings.prompter ?? true;
  }
}

async function saveSettings() {
  try {
    // Get current settings from UI
    const floatingToggle = document.getElementById('floatingIconToggle');
    const themeSelect = document.getElementById('themeSelect');
    const summarizerToggle = document.getElementById('summarizerToggle');
    const translatorToggle = document.getElementById('translatorToggle');
    const writerToggle = document.getElementById('writerToggle');
    const prompterToggle = document.getElementById('prompterToggle');
    
    // Save individual settings to database
    const settingsToSave = [
      { key: 'floatingEnabled', value: floatingToggle ? floatingToggle.checked : false },
      { key: 'theme', value: themeSelect ? themeSelect.value : 'auto' },
      { key: 'summarizerEnabled', value: summarizerToggle ? summarizerToggle.checked : true },
      { key: 'translatorEnabled', value: translatorToggle ? translatorToggle.checked : true },
      { key: 'writerEnabled', value: writerToggle ? writerToggle.checked : true },
      { key: 'prompterEnabled', value: prompterToggle ? prompterToggle.checked : true }
    ];
    
    // Save each setting
    for (const setting of settingsToSave) {
      await agenWorkDB.setSetting(setting.key, setting.value);
    }
    
    // Also save to Chrome storage for compatibility
    const chromeSettings = {
      isFloatingIconEnabled: floatingToggle ? floatingToggle.checked : false,
      theme: themeSelect ? themeSelect.value : 'auto',
      aiSettings: {
        summarizer: summarizerToggle ? summarizerToggle.checked : true,
        translator: translatorToggle ? translatorToggle.checked : true,
        writer: writerToggle ? writerToggle.checked : true,
        prompter: prompterToggle ? prompterToggle.checked : true
      }
    };
    
    chrome.storage.local.set(chromeSettings);
    
    updateStatus('Settings saved', 'success');
    showNotification('Settings saved successfully', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    updateStatus('Failed to save settings', 'error');
    showNotification('Failed to save settings', 'error');
  }
}

// Handle theme change
async function handleThemeChange(e) {
  const theme = e.target.value;
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  // Save theme setting to database
  await saveSettingToDB('theme', theme);
  
  // Also save all settings
  await saveSettings();
}

// Apply theme to document
function applyTheme(theme) {
  if (!theme) theme = 'light'; // Default to light theme
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  // Update theme selector if it exists
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = theme;
  }
}

// Clear all data
async function clearAllData() {
  if (confirm('Are you sure you want to clear all conversations and settings? This action cannot be undone.')) {
    try {
      // Clear database tables
      if (agenWorkDB.isInitialized) {
        await agenWorkDB.db.conversations.clear();
        await agenWorkDB.db.messages.clear();
        await agenWorkDB.db.settings.clear();
        
        // Reinitialize default settings
        await agenWorkDB.initializeDefaultSettings();
      }
      
      // Clear Chrome storage as well
      chrome.storage.local.clear();
      
      // Reset global variables
      currentConversationId = null;
      
      updateStatus('All data cleared', 'success');
      showNotification('All data cleared successfully', 'success');
      
      // Reset UI
      document.getElementById('messagesContainer').innerHTML = '';
      showWelcomeMessage();
      startNewConversation();
      
      // Reload settings and conversation history
      await loadSettings();
      await loadConversationHistory();
      
    } catch (error) {
      console.error('Failed to clear all data:', error);
      updateStatus('Failed to clear data', 'error');
      showNotification('Failed to clear all data', 'error');
    }
  }
}

// Database operations using DexieJS
async function initializeDatabase() {
  try {
    await agenWorkDB.initialize();
    db = agenWorkDB.db;
    console.log('Database initialized successfully');
    
    // Load settings after database is ready
    await loadSettingsFromDB();
    
    // Load conversation history
    await loadConversationHistory();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error.message || error.toString() || error);
    updateStatus('Database Error: ' + (error.message || 'Unknown error'), 'error');
    return false;
  }
}

async function saveConversation(userMessage, aiResponse, agentType = 'prompter') {
  try {
    // Create a new conversation if none exists
    if (!currentConversationId) {
      const title = generateConversationTitle(userMessage);
      const conversation = await agenWorkDB.createConversation(title, agentType);
      currentConversationId = conversation.id;
      
      // Update UI to show active conversation
      updateActiveConversationTitle(title);
    }
    
    // Add user message
    await agenWorkDB.addMessage(currentConversationId, 'user', userMessage, agentType);
    
    // Add AI response
    await agenWorkDB.addMessage(currentConversationId, 'assistant', aiResponse, agentType, {
      timestamp: new Date().toISOString()
    });
    
    // Refresh conversation history in the background
    setTimeout(() => {
      loadConversationHistory();
    }, 100);
    
    console.log('Conversation saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to save conversation:', error);
    return false;
  }
}

async function loadConversationHistory() {
  try {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    const conversations = await agenWorkDB.getAllConversations();
    
    if (conversations.length === 0) {
      conversationsList.innerHTML = `
        <div class="empty-state">
          <i class="far fa-comments" style="font-size: 48px; margin-bottom: 16px;"></i>
          <p>No conversations yet</p>
          <p class="text-secondary">Start a chat to create your first conversation</p>
        </div>
      `;
      return;
    }
    
    conversationsList.innerHTML = '';
    
    conversations.forEach(conversation => {
      const conversationItem = createConversationItem(conversation);
      conversationsList.appendChild(conversationItem);
    });
    
  } catch (error) {
    console.error('Failed to load conversation history:', error);
    const conversationsList = document.getElementById('conversationsList');
    if (conversationsList) {
      conversationsList.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle" style="color: var(--error-color); font-size: 24px; margin-bottom: 8px;"></i>
          <p>Failed to load conversations</p>
        </div>
      `;
    }
  }
}

// Helper functions for database operations
function generateConversationTitle(userMessage) {
  // Generate a meaningful title from the first user message
  const title = userMessage.length > 50 ? 
    userMessage.substring(0, 47) + '...' : 
    userMessage;
  return title || `Conversation ${new Date().toLocaleString()}`;
}

function updateActiveConversationTitle(title) {
  // Update UI to show the active conversation title
  const headerTitle = document.querySelector('.header-title');
  if (headerTitle) {
    headerTitle.textContent = title;
  }
}

function createConversationItem(conversation) {
  const item = document.createElement('div');
  item.className = 'conversation-item';
  item.setAttribute('data-conversation-id', conversation.id);
  
  // Determine agent icon
  const agentIcons = {
    'prompter': 'fas fa-comments',
    'summarizer': 'fas fa-file-alt',
    'translator': 'fas fa-language',
    'writer': 'fas fa-pen'
  };
  
  const agentIcon = agentIcons[conversation.agentType] || 'fas fa-comments';
  
  item.innerHTML = `
    <div class="conversation-header">
      <div class="conversation-icon">
        <i class="${agentIcon}"></i>
      </div>
      <div class="conversation-info">
        <div class="conversation-title">${conversation.title}</div>
        <div class="conversation-meta">
          <span class="conversation-date">${formatDate(conversation.updatedAt)}</span>
          <span class="conversation-count">${conversation.messageCount || 0} messages</span>
        </div>
      </div>
      <div class="conversation-actions">
        <button class="conversation-action-btn" onclick="loadConversation(${conversation.id})" title="Load conversation">
          <i class="fas fa-folder-open"></i>
        </button>
        <button class="conversation-action-btn" onclick="deleteConversation(${conversation.id})" title="Delete conversation">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  
  // Add click handler to load conversation
  item.addEventListener('click', (e) => {
    if (!e.target.closest('.conversation-actions')) {
      loadConversation(conversation.id);
    }
  });
  
  return item;
}

function formatDate(date) {
  const now = new Date();
  const conversationDate = new Date(date);
  const diffMs = now - conversationDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return conversationDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return conversationDate.toLocaleDateString();
  }
}

async function loadConversation(conversationId) {
  try {
    const conversation = await agenWorkDB.getConversation(conversationId);
    if (!conversation) {
      console.error('Conversation not found');
      return;
    }
    
    currentConversationId = conversationId;
    
    // Clear current messages
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    // Load messages
    conversation.messages.forEach(message => {
      const sender = message.role === 'user' ? 'user' : 'agent';
      addMessageToChat(message.content, sender, message.agentType);
    });
    
    // Switch to chat view
    switchView('chat');
    
    // Update header title
    updateActiveConversationTitle(conversation.title);
    
    console.log('Conversation loaded successfully');
  } catch (error) {
    console.error('Failed to load conversation:', error);
  }
}

async function deleteConversation(conversationId) {
  if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
    return;
  }
  
  try {
    const success = await agenWorkDB.deleteConversation(conversationId);
    if (success) {
      // Refresh conversation history
      await loadConversationHistory();
      
      // If this was the active conversation, reset it
      if (currentConversationId === conversationId) {
        currentConversationId = null;
        startNewConversation();
      }
      
      showNotification('Conversation deleted successfully', 'success');
    } else {
      showNotification('Failed to delete conversation', 'error');
    }
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    showNotification('Failed to delete conversation', 'error');
  }
}

function startNewConversation() {
  currentConversationId = null;
  const messagesContainer = document.getElementById('messagesContainer');
  messagesContainer.innerHTML = '';
  showWelcomeMessage();
  updateActiveConversationTitle('New Conversation');
}

// Settings functions with database integration
async function loadSettingsFromDB() {
  try {
    const settings = await agenWorkDB.getAllSettings();
    
    // Apply theme setting
    if (settings.theme) {
      applyTheme(settings.theme);
    }
    
    // Apply floating mode setting
    if (settings.floatingEnabled) {
      updateFloatingToggle(settings.floatingEnabled);
    }
    
    // Apply other settings
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key + 'Setting');
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else {
          element.value = settings[key];
        }
      }
    });
    
    return settings;
  } catch (error) {
    console.error('Failed to load settings from database:', error);
    return {};
  }
}

async function saveSettingToDB(key, value) {
  try {
    const success = await agenWorkDB.setSetting(key, value);
    if (success) {
      console.log(`Setting ${key} saved:`, value);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
    return false;
  }
}

// Data export and import functions
async function exportData() {
  try {
    updateStatus('Exporting data...', 'processing');
    
    const data = await agenWorkDB.exportData();
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenwork-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    updateStatus('Data exported successfully', 'success');
    showNotification('Data exported successfully', 'success');
  } catch (error) {
    console.error('Failed to export data:', error);
    updateStatus('Export failed', 'error');
    showNotification('Failed to export data', 'error');
  }
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    updateStatus('Importing data...', 'processing');
    
    const fileContent = await file.text();
    const data = JSON.parse(fileContent);
    
    // Validate data structure
    if (!data.conversations && !data.settings) {
      throw new Error('Invalid backup file format');
    }
    
    // Confirm import
    const confirmMessage = `This will replace all current data with the backup from ${data.exportDate}. Continue?`;
    if (!confirm(confirmMessage)) {
      updateStatus('Import cancelled', 'info');
      return;
    }
    
    // Import data
    await agenWorkDB.importData(data);
    
    // Reset current conversation
    currentConversationId = null;
    
    // Refresh UI
    await loadSettings();
    await loadConversationHistory();
    startNewConversation();
    
    updateStatus('Data imported successfully', 'success');
    showNotification('Data imported successfully', 'success');
  } catch (error) {
    console.error('Failed to import data:', error);
    updateStatus('Import failed', 'error');
    showNotification('Failed to import data: ' + error.message, 'error');
  } finally {
    // Clear the file input
    event.target.value = '';
  }
}

// Database statistics
async function updateDatabaseStats() {
  try {
    const statsContainer = document.getElementById('databaseStats');
    if (!statsContainer) {
      console.warn('Database stats container not found');
      return;
    }
    
    statsContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading...</p>';
    
    // Check if database is available
    if (!agenWorkDB || !agenWorkDB.isInitialized) {
      statsContainer.innerHTML = '<p class="error-text">Database not initialized</p>';
      return;
    }
    
    const stats = await agenWorkDB.getDatabaseStats();
    
    if (stats && !stats.error) {
      statsContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Conversations:</span>
            <span class="stat-value">${stats.conversations}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Messages:</span>
            <span class="stat-value">${stats.messages}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Archived:</span>
            <span class="stat-value">${stats.archivedConversations}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Settings:</span>
            <span class="stat-value">${stats.settings}</span>
          </div>
        </div>
      `;
    } else if (stats && stats.error) {
      // Show partial stats even if there was an error
      statsContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Conversations:</span>
            <span class="stat-value">${stats.conversations}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Messages:</span>
            <span class="stat-value">${stats.messages}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Archived:</span>
            <span class="stat-value">${stats.archivedConversations}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Settings:</span>
            <span class="stat-value">${stats.settings}</span>
          </div>
        </div>
        <p class="warning-text" style="margin-top: 8px; font-size: 12px; color: #f39c12;">⚠ Some data may be incomplete</p>
      `;
    } else {
      statsContainer.innerHTML = '<p class="error-text">Failed to load statistics</p>';
    }
  } catch (error) {
    console.error('Failed to update database stats:', error.message || error.toString() || error);
    const statsContainer = document.getElementById('databaseStats');
    if (statsContainer) {
      statsContainer.innerHTML = `<p class="error-text">Error: ${error.message || 'Unknown error'}</p>`;
    }
  }
}

// Notification function
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}