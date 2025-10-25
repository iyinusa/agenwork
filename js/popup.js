// AgenWork Popup JavaScript
// Main script for the Chrome Extension popup interface

document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  // Initialize the popup
  initializePopup();
  
  // Initialize event listeners
  initializeEventListeners();
  
  // Load settings
  loadSettings();
  
  // Initialize database
  initializeDatabase();
});

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
  
  // Show welcome message
  showWelcomeMessage();
  
  // Update status
  updateStatus('Ready', 'success');
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
  
  // AI Agent toggles
  document.getElementById('summarizerToggle').addEventListener('change', saveSettings);
  document.getElementById('translatorToggle').addEventListener('change', saveSettings);
  document.getElementById('writerToggle').addEventListener('change', saveSettings);
  document.getElementById('prompterToggle').addEventListener('change', saveSettings);
}

// Switch between views
function switchView(viewName) {
  // Hide current view
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Show target view
  const targetView = document.getElementById(viewName + 'View');
  if (targetView) {
    targetView.classList.add('active');
    currentView = viewName;
    
    // Load view-specific data
    if (viewName === 'history') {
      loadConversationHistory();
    }
  }
}

// Toggle floating icon
async function toggleFloatingIcon() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.runtime.sendMessage({
      type: 'TOGGLE_FLOATING_ICON',
      enabled: true
    });
    
    if (response.success) {
      updateStatus('Floating icon toggled', 'success');
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
    const response = await processMessage(message);
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add AI response to chat
    addMessageToChat(response, 'agent');
    
    // Save conversation
    saveConversation(message, response);
    
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
  return response;
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
    welcomeMessage.style.display = 'none';
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
  
  messagesContainer.appendChild(messageElement);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
function loadSettings() {
  chrome.storage.local.get([
    'isFloatingIconEnabled',
    'theme',
    'aiSettings'
  ], (result) => {
    // Update floating icon toggle
    if (result.isFloatingIconEnabled !== undefined) {
      document.getElementById('floatingIconToggle').checked = result.isFloatingIconEnabled;
    }
    
    // Update theme
    if (result.theme) {
      document.getElementById('themeSelect').value = result.theme;
      if (result.theme !== 'auto') {
        document.documentElement.setAttribute('data-theme', result.theme);
      }
    }
    
    // Update AI settings
    if (result.aiSettings) {
      document.getElementById('summarizerToggle').checked = result.aiSettings.summarizer ?? true;
      document.getElementById('translatorToggle').checked = result.aiSettings.translator ?? true;
      document.getElementById('writerToggle').checked = result.aiSettings.writer ?? true;
      document.getElementById('prompterToggle').checked = result.aiSettings.prompter ?? true;
    }
  });
}

function saveSettings() {
  const settings = {
    isFloatingIconEnabled: document.getElementById('floatingIconToggle').checked,
    theme: document.getElementById('themeSelect').value,
    aiSettings: {
      summarizer: document.getElementById('summarizerToggle').checked,
      translator: document.getElementById('translatorToggle').checked,
      writer: document.getElementById('writerToggle').checked,
      prompter: document.getElementById('prompterToggle').checked
    }
  };
  
  chrome.storage.local.set(settings, () => {
    updateStatus('Settings saved', 'success');
  });
}

// Handle theme change
function handleThemeChange(e) {
  const theme = e.target.value;
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  saveSettings();
}

// Clear all data
function clearAllData() {
  if (confirm('Are you sure you want to clear all conversations and settings? This action cannot be undone.')) {
    chrome.storage.local.clear(() => {
      if (db) {
        db.conversations.clear();
      }
      updateStatus('All data cleared', 'success');
      
      // Reset UI
      document.getElementById('messagesContainer').innerHTML = '<div class="welcome-message">...</div>';
      showWelcomeMessage();
      loadSettings();
    });
  }
}

// Database operations (using DexieJS when implemented)
function initializeDatabase() {
  // This will be implemented with DexieJS in backlog 3
  console.log('Database initialization placeholder');
}

function saveConversation(userMessage, aiResponse) {
  // This will be implemented with DexieJS in backlog 3
  console.log('Save conversation placeholder:', { userMessage, aiResponse });
}

function loadConversationHistory() {
  // This will be implemented with DexieJS in backlog 3
  const conversationsList = document.getElementById('conversationsList');
  conversationsList.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
      <i class="far fa-comments" style="font-size: 48px; margin-bottom: 16px;"></i>
      <p>Conversation history will be available once DexieJS is integrated.</p>
    </div>
  `;
}