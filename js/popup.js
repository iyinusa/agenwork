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
    // Initialize AI Agents
    initializeAIAgents();
  }).catch(error => {
    console.error('Database initialization failed:', error.message || error.toString() || error);
    // Fall back to loading settings without database
    loadSettings();
    // Still try to initialize AI Agents
    initializeAIAgents();
  });
  
  // Handle floating mode messaging
  initializeFloatingMode();
  
  // Listen for AI progress updates
  if (chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'AI_PROGRESS') {
        handleAIProgress(message.agentType, message.progress);
      }
    });
  }
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
let aiAgents = null;

// Initialize popup
function initializePopup() {
  console.log('🚀 AgenWork popup initialized with multi-agent system');
  
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

  // Add console debugging helpers for multi-agent system
  if (typeof window !== 'undefined') {
    window.testMultiAgent = async function(message = 'test the multi-agent system') {
      console.log('🧪 Testing multi-agent coordination system...');
      if (window.aiAgents && typeof window.aiAgents.testMultiAgentSystem === 'function') {
        return await window.aiAgents.testMultiAgentSystem();
      } else if (window.aiAgents && typeof window.aiAgents.coordinateTask === 'function') {
        console.log('Running quick coordination test...');
        return await window.aiAgents.coordinateTask(message);
      } else {
        console.error('❌ AI Agents not available for testing');
        return null;
      }
    };

    window.debugAIAgents = function() {
      console.log('🔍 Multi-Agent System Debug Information:');
      console.log('  • Global aiAgents instance:', !!window.aiAgents);
      console.log('  • AIAgents class available:', !!window.AIAgents);
      
      if (window.aiAgents) {
        console.log('  • Initialized:', window.aiAgents.initialized);
        console.log('  • Preferred language:', window.aiAgents.preferredLanguage);
        console.log('  • Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.aiAgents)).filter(name => name !== 'constructor'));
      }
      
      return {
        aiAgents: !!window.aiAgents,
        AIAgents: !!window.AIAgents,
        initialized: window.aiAgents?.initialized,
        preferredLanguage: window.aiAgents?.preferredLanguage
      };
    };

    // Add summarizer-specific debugging
    window.testSummarizer = async function() {
      console.log('� Testing Summarizer Agent specifically...');
      if (window.aiAgents && window.aiAgents.summarizer && typeof window.aiAgents.summarizer.testSummarizer === 'function') {
        return await window.aiAgents.summarizer.testSummarizer();
      } else {
        console.error('❌ Summarizer agent not available for testing');
        return null;
      }
    };

    window.diagnoseSummarizer = async function() {
      console.log('🩺 Running Summarizer diagnostics...');
      if (window.aiAgents && window.aiAgents.summarizer && typeof window.aiAgents.summarizer.diagnose === 'function') {
        return await window.aiAgents.summarizer.diagnose();
      } else {
        console.error('❌ Summarizer agent not available for diagnostics');
        return null;
      }
    };

    console.log('�💡 Multi-Agent Debug helpers available:');
    console.log('  • testMultiAgent() - Test the multi-agent coordination system');
    console.log('  • debugAIAgents() - Show multi-agent system debug info');
    console.log('  • testSummarizer() - Test the summarizer agent specifically');
    console.log('  • diagnoseSummarizer() - Run detailed summarizer diagnostics');
  }
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

// Initialize AI Agents
async function initializeAIAgents() {
  try {
    console.log('Initializing AI Agents...');
    updateStatus('Initializing AI...', 'processing');
    
    // Create AI Agents instance
    aiAgents = new AIAgents();
    
    // Apply saved language preference
    try {
      const savedLanguage = await getSavedLanguagePreference();
      if (savedLanguage) {
        aiAgents.setPreferredLanguage(savedLanguage);
        console.log(`Applied saved AI language preference: ${savedLanguage}`);
      }
    } catch (error) {
      console.warn('Could not load saved language preference:', error);
    }
    
    // Log AI API availability for debugging
    const support = AIAgents.isSupported();
    console.log('AI API Support Check:', support);
    
    // Initialize the AI system
    const initialized = await aiAgents.initialize();
    
    if (initialized) {
      console.log('AI Agents initialized successfully');
      
      // Check capabilities and update UI
      const capabilities = await aiAgents.getCapabilities();
      console.log('AI Capabilities:', capabilities);
      
      // Update status based on capabilities
      const availableAgents = Object.values(capabilities).filter(cap => cap.supported && cap.available).length;
      const supportedAgents = Object.values(capabilities).filter(cap => cap.supported).length;
      
      if (availableAgents > 0) {
        if (availableAgents === supportedAgents) {
          updateStatus(`AI Ready (${availableAgents}/${supportedAgents} agents)`, 'success');
        } else {
          updateStatus(`AI Ready (${availableAgents}/${supportedAgents} agents ready)`, 'success');
        }
      } else if (supportedAgents > 0) {
        updateStatus(`AI Downloading (${supportedAgents} agents supported)`, 'processing');
      } else {
        updateStatus('AI Limited (Browser not supported)', 'warning');
      }
      
      // Show AI status in welcome message
      updateAIStatus(capabilities);
      
    } else {
      throw new Error('Failed to initialize AI system');
    }
    
  } catch (error) {
    console.error('Error initializing AI Agents:', error);
    updateStatus('AI Unavailable', 'error');
    
    // Show fallback message
    showAIUnavailableMessage();
  }
}

// Update AI status in the UI
function updateAIStatus(capabilities) {
  // Find or create AI status element in welcome message
  const welcomeMessage = document.querySelector('.welcome-message');
  if (!welcomeMessage) return;
  
  let aiStatusElement = welcomeMessage.querySelector('.ai-status');
  if (!aiStatusElement) {
    aiStatusElement = document.createElement('div');
    aiStatusElement.className = 'ai-status';
    welcomeMessage.appendChild(aiStatusElement);
  }
  
  // Helper function to get status icon and text
  const getAgentStatus = (capability, agentName) => {
    if (capability.supported && capability.available) {
      return `<i class="fas fa-check text-success"></i> ${agentName} Ready`;
    } else if (capability.supported) {
      return `<i class="fas fa-clock text-warning"></i> ${agentName} Downloading`;
    } else {
      return `<i class="fas fa-times text-muted"></i> ${agentName} Unavailable`;
    }
  };
  
  // Create status HTML for all agents
  const summarizerStatus = getAgentStatus(capabilities.summarizer, 'Summarizer');
  const translatorStatus = getAgentStatus(capabilities.translator, 'Translator');
  const writerStatus = getAgentStatus(capabilities.writer, 'Writer');
  const prompterStatus = getAgentStatus(capabilities.prompter, 'Prompter');
    
  aiStatusElement.innerHTML = `
    <div class="ai-status-info">
      <small>AI Agents Status:</small>
      <div class="ai-agents-status">
        ${prompterStatus}<br>
        ${summarizerStatus}<br>
        ${translatorStatus}<br>
        ${writerStatus}
      </div>
    </div>
  `;
}

// Show AI unavailable message
function showAIUnavailableMessage() {
  const markdownMessage = `⚠️ **Chrome AI APIs not available**

The Chrome built-in AI APIs are not available in this browser or version. Please ensure you're using **Chrome 138+** with AI features enabled.

Some functionality may be limited to basic responses.`;

  addMessageToChat(markdownMessage, 'agent');
}

// Handle AI progress updates
function handleAIProgress(agentType, progress) {
  const statusText = `Downloading ${agentType} model... ${progress.toFixed(1)}%`;
  updateStatus(statusText, 'processing');
  
  // Show progress in messages if first download
  showDownloadProgress(agentType, progress);
  
  console.log(`AI Progress - ${agentType}: ${progress.toFixed(1)}%`);
}

// Show download progress in chat
function showDownloadProgress(agentType, progress) {
  const messagesContainer = document.getElementById('messagesContainer');
  
  // Find existing progress message or create new one
  let progressMsg = messagesContainer.querySelector(`.ai-download-progress[data-agent="${agentType}"]`);
  
  if (!progressMsg) {
    progressMsg = document.createElement('div');
    progressMsg.className = 'message agent ai-download-progress';
    progressMsg.setAttribute('data-agent', agentType);
    progressMsg.innerHTML = `
      <div class="message-avatar">⬇️</div>
      <div class="message-bubble">
        <strong>Downloading ${agentType} AI model...</strong>
        <div class="ai-progress">
          <div class="ai-progress-bar">
            <div class="ai-progress-fill" style="width: 0%"></div>
          </div>
          <small>This may take a few minutes on first use.</small>
        </div>
      </div>
    `;
    messagesContainer.appendChild(progressMsg);
  }
  
  // Update progress bar
  const progressFill = progressMsg.querySelector('.ai-progress-fill');
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
  
  // Remove message when complete
  if (progress >= 100) {
    setTimeout(() => {
      progressMsg.remove();
    }, 2000);
  }
  
  // Scroll to bottom
  messagesContainer.scrollTo({
    top: messagesContainer.scrollHeight,
    behavior: 'smooth'
  });
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
  document.getElementById('aiLanguageSelect').addEventListener('change', handleLanguageChange);
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
    
    // Add AI response to chat (only if there's a response)
    if (response) {
      addMessageToChat(response, 'agent');
      
      // Save conversation
      await saveConversation(message, response, agentType);
    }
    
  } catch (error) {
    console.error('Error processing message:', error);
    hideTypingIndicator();
    addMessageToChat('Sorry, I encountered an error processing your message. Please try again.', 'agent');
    updateStatus('Error processing message', 'error');
  }
}

// Process message with appropriate AI agent
async function processMessage(message) {
  console.log('🚀 Starting message processing:', message);
  updateStatus('Initializing AI agents...', 'processing');
  
  // Check for special demo commands
  if (message.toLowerCase().includes('markdown demo') || message.toLowerCase().includes('show demo')) {
    updateStatus('Ready', 'success');
    showMarkdownDemo();
    return {
      response: null, // Already added to chat
      agentType: 'demo'
    };
  }
  
  // Validate aiAgents instance
  if (!aiAgents) {
    console.error('❌ AI Agents not initialized');
    updateStatus('AI Unavailable', 'error');
    throw new Error('AI system is not initialized. Please refresh the page and try again.');
  }

  // Get current page context for better AI intent detection
  updateStatus('Gathering page context...', 'processing');
  let pageContext = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      pageContext = {
        title: tab.title,
        url: tab.url,
        contentPreview: null // We'll add content preview later if needed
      };
      console.log('📄 Page context gathered:', pageContext);
    } else {
      console.log('📄 No valid page context available');
    }
  } catch (error) {
    console.log('⚠️ Could not get page context:', error);
  }
  
  // Use Multi-Agent Coordination System
  updateStatus('Starting multi-agent coordination...', 'processing');
  let coordinationResult;
  
  try {
    console.log('🎯 Initiating multi-agent coordination...');
    coordinationResult = await aiAgents.coordinateTask(message, pageContext);
    console.log('✅ Multi-agent coordination completed:', coordinationResult);
    
    // Process the coordination result
    let finalResponse = '';
    const intentInfo = coordinationResult.intentAnalysis;
    const stats = coordinationResult.processingStats;
    
    // Add multi-agent processing info to response
    if (intentInfo.aiPowered) {
      finalResponse += `*🤖 Multi-Agent Analysis: ${intentInfo.reasoning} (${(intentInfo.confidence * 100).toFixed(0)}% confidence)*\n`;
      finalResponse += `*🎯 Agents deployed: ${stats.totalAgents} | Successful: ${stats.successfulAgents} | Failed: ${stats.failedAgents}*\n\n`;
    } else {
      finalResponse += `*📋 Pattern-based analysis: ${intentInfo.reasoning}*\n`;
      finalResponse += `*🎯 Agents deployed: ${stats.totalAgents}*\n\n`;
    }
    
    // Process all results from the multi-agent system
    let primaryResponseAdded = false;
    
    for (const result of coordinationResult.results) {
      if (result.type === 'primary') {
        if (result.success) {
          finalResponse += `**${result.intent.toUpperCase()} Agent Result:**\n${result.result}`;
          primaryResponseAdded = true;
        } else {
          finalResponse += `**${result.intent.toUpperCase()} Agent Error:**\n${result.result}`;
          console.error(`Primary agent (${result.intent}) failed:`, result.error);
        }
      } else if (result.type === 'secondary') {
        finalResponse += `\n\n---\n**Additional ${result.intent.toUpperCase()} Agent Result:**\n`;
        if (result.success) {
          finalResponse += result.result;
        } else {
          finalResponse += `Error: ${result.result}`;
          console.error(`Secondary agent (${result.intent}) failed:`, result.error);
        }
      }
    }
    
    // Ensure we have some response
    if (!primaryResponseAdded) {
      finalResponse += '\n\n*No agents were able to successfully process your request. Please try rephrasing your message.*';
    }
    
    // Update status based on results
    if (stats.successfulAgents > 0) {
      if (stats.failedAgents > 0) {
        updateStatus(`Partially completed (${stats.successfulAgents}/${stats.totalAgents} agents)`, 'warning');
      } else {
        updateStatus('Multi-agent processing completed', 'success');
      }
    } else {
      updateStatus('All agents failed', 'error');
    }
    
    return {
      response: finalResponse,
      agentType: intentInfo.primary || 'unknown',
      coordinationResult: coordinationResult,
      multiAgent: true,
      stats: stats,
      intentAnalysis: intentInfo
    };
    
  } catch (error) {
    console.error('AI coordination failed, falling back to simple processing:', error);
    
    // Fallback to simple intent detection and processing
    updateStatus('Processing (fallback mode)...', 'processing');
    const intent = await detectIntentFallback(message);
    
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
      response: `*⚠️ Fallback mode: ${intent.reasoning}*\n\n${response}`,
      agentType: intent.primary === 'research' ? 'prompter' : intent.primary,
      intentAnalysis: intent
    };
  }
}

// Fallback intent detection using patterns (when AI fails)
async function detectIntentFallback(message) {
  const intents = {
    summarize: {
      keywords: ['summarize', 'summary', 'tldr', 'brief', 'overview', 'sum up', 'digest', 'condense'],
      patterns: [
        /summarize (this|the|current)? ?(page|article|content|text)/i,
        /give me a (summary|overview|brief)/i,
        /what (is|are) the (main|key) points/i,
        /tldr/i,
        /can you summarize/i
      ],
      contextWords: ['page', 'article', 'content', 'website', 'document']
    },
    translate: {
      keywords: ['translate', 'translation', 'convert', 'language'],
      patterns: [
        /translate (this|the|current)? ?(page|text|content)? ?(to|into|in) ?\w+/i,
        /(spanish|french|german|chinese|japanese|italian|portuguese)\s+(translation|version)/i,
        /what does this mean in \w+/i,
        /convert to \w+ language/i
      ],
      contextWords: ['spanish', 'french', 'german', 'chinese', 'japanese', 'italian', 'portuguese', 'english']
    },
    write: {
      keywords: ['write', 'compose', 'draft', 'create', 'help me write', 'generate'],
      patterns: [
        /help me write (a|an)? ?\w+/i,
        /compose (a|an)? ?\w+/i,
        /draft (a|an)? ?\w+/i,
        /create (a|an)? ?\w+/i,
        /generate (a|an)? ?\w+/i
      ],
      contextWords: ['email', 'letter', 'essay', 'article', 'story', 'message', 'response']
    },
    research: {
      keywords: ['research', 'find', 'search', 'learn', 'tell me about', 'explain', 'what is'],
      patterns: [
        /tell me about \w+/i,
        /what is \w+/i,
        /explain \w+/i,
        /research \w+/i,
        /find (information|info) about/i,
        /learn (more )?about/i
      ],
      contextWords: ['information', 'details', 'facts', 'data', 'knowledge']
    }
  };
  
  const lowerMessage = message.toLowerCase();
  const scores = {};
  
  // Score each intent
  for (const [intent, config] of Object.entries(intents)) {
    let score = 0;
    
    // Check keywords
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 1;
      }
    }
    
    // Check patterns
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        score += 2; // Patterns are more specific, higher score
      }
    }
    
    // Check context words
    for (const contextWord of config.contextWords) {
      if (lowerMessage.includes(contextWord)) {
        score += 0.5;
      }
    }
    
    scores[intent] = score;
  }
  
  // Find the highest scoring intent
  const maxScore = Math.max(...Object.values(scores));
  
  if (maxScore > 0) {
    const topIntent = Object.keys(scores).find(intent => scores[intent] === maxScore);
    return { 
      primary: topIntent, 
      confidence: Math.min(maxScore / 3, 1.0),
      secondary: [],
      reasoning: 'Pattern-based classification (fallback)',
      craftedPrompt: message,
      originalMessage: message,
      aiPowered: false
    };
  }
  
  return { 
    primary: 'research', 
    confidence: 0.5,
    secondary: [],
    reasoning: 'Default classification (no clear pattern match)',
    craftedPrompt: message,
    originalMessage: message,
    aiPowered: false
  };
}

// Handle different types of requests
async function handleSummarizeRequest(message, intent) {
  try {
    updateStatus('Analyzing content...', 'processing');
    
    // Check if user wants to summarize current page or provided text
    const lowerMessage = message.toLowerCase();
    const isPageSummary = lowerMessage.includes('page') || lowerMessage.includes('this') || 
                         lowerMessage.includes('current') || lowerMessage.includes('website');
    
    if (isPageSummary) {
      // Try summarizing using content script first (better API access)
      updateStatus('Checking Summarizer API availability...', 'processing');
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          throw new Error('No active tab found');
        }
        
        // First check if API is available in content script context
        const apiCheck = await chrome.tabs.sendMessage(tab.id, { 
          type: 'CHECK_SUMMARIZER_API' 
        });
        
        if (apiCheck.success && apiCheck.available) {
          // Use content script for summarization
          updateStatus('Generating summary...', 'processing');
          const result = await chrome.tabs.sendMessage(tab.id, { 
            type: 'SUMMARIZE_PAGE',
            options: {
              type: 'tldr',
              format: 'markdown',
              length: 'medium'
            }
          });
          
          if (result.success) {
            return `## Summary of "${result.result.title}"\n\n${result.result.summary}\n\n---\n*Summarized ${result.result.wordCount} words from: ${result.result.url}*`;
          } else {
            throw new Error(result.error);
          }
        } else {
          // Fall back to AI Agents method if content script doesn't have access
          if (!aiAgents) {
            throw new Error('AI system not initialized and content script API unavailable');
          }
          
          updateStatus('Extracting page content...', 'processing');
          const result = await aiAgents.summarizeCurrentPage();
          return `## Summary of "${result.title}"\n\n${result.summary}\n\n---\n*Summarized ${result.wordCount} words from: ${result.url}*`;
        }
        
      } catch (tabError) {
        console.warn('Content script approach failed, falling back to popup context:', tabError);
        
        // Final fallback to AI Agents in popup context
        if (!aiAgents) {
          throw new Error('AI system not initialized and content script unavailable');
        }
        
        updateStatus('Extracting page content...', 'processing');
        const result = await aiAgents.summarizeCurrentPage();
        return `## Summary of "${result.title}"\n\n${result.summary}\n\n---\n*Summarized ${result.wordCount} words from: ${result.url}*`;
      }
      
    } else {
      // For text summarization, try AI Agents first
      const textToSummarize = extractTextFromMessage(message);
      
      if (textToSummarize && textToSummarize.length > 50) {
        if (!aiAgents) {
          throw new Error('AI system not initialized');
        }
        updateStatus('Generating summary...', 'processing');
        const summary = await aiAgents.summarizeText(textToSummarize);
        return `## Summary\n\n${summary}`;
      } else {
        // Default to current page if no specific text provided
        return await handleSummarizeRequest('summarize this page', intent);
      }
    }
    
  } catch (error) {
    console.error('Error in summarization:', error);
    
    // Provide helpful error messages
    if (error.message.includes('not available') || error.message.includes('not initialized')) {
      return "❌ **Summarizer Not Available**\n\nThe Chrome Summarizer API is not available. This could be due to:\n\n• **Permission Policy**: Extension popups have limited API access\n• **Chrome Version**: Requires Chrome 138+ \n• **System Requirements**: 16GB RAM, 22GB storage\n• **AI Features**: Need to be enabled in Chrome flags\n\n**Try this:**\n1. Enable `chrome://flags/#optimization-guide-on-device-model`\n2. Restart Chrome\n3. Make sure you have sufficient system resources\n\nI can still help with other tasks!";
    } else if (error.message.includes('No active tab')) {
      return "❌ **Cannot Access Page**\n\nI couldn't access the current page to summarize it. Please make sure you're on a webpage and try again.";
    } else if (error.message.includes('No meaningful content')) {
      return "❌ **No Content Found**\n\nI couldn't find meaningful content to summarize on this page. Try navigating to an article or page with more text content.";
    } else if (error.message.includes('Cannot access page content') || error.message.includes('page restrictions')) {
      return "❌ **Page Access Restricted**\n\nI cannot access the content of this page due to browser security restrictions. This can happen on:\n\n• Chrome internal pages (chrome://)\n• Extension pages\n• Some secure websites\n\nTry navigating to a regular webpage with content to summarize.";
    } else if (error.message.includes('Failed to extract page content')) {
      return "❌ **Content Extraction Failed**\n\nI had trouble extracting content from this page. This might be because:\n\n• The page is still loading\n• The content is generated dynamically\n• The page has restricted access\n\nTry refreshing the page and trying again, or try a different webpage.";
    } else {
      return `❌ **Summarization Error**\n\nSorry, I encountered an error while trying to summarize: ${error.message}\n\n**Possible Solutions:**\n• Make sure you're on a regular webpage (not chrome:// pages)\n• Try refreshing the page\n• Check that Chrome's AI features are enabled\n• Ensure sufficient system resources\n\nPlease try again or try a different page.`;
    }
  }
}

// Extract text to summarize from user message
function extractTextFromMessage(message) {
  // Look for quoted text or text after "summarize"
  const quotedTextMatch = message.match(/["']([^"']+)["']/);
  if (quotedTextMatch) {
    return quotedTextMatch[1];
  }
  
  // Look for text after "summarize this:"
  const colonMatch = message.match(/summarize this:?\s*(.+)/i);
  if (colonMatch) {
    return colonMatch[1];
  }
  
  // Look for text after "summarize"
  const summaryMatch = message.match(/summarize\s+(.+)/i);
  if (summaryMatch && !summaryMatch[1].toLowerCase().includes('page')) {
    return summaryMatch[1];
  }
  
  return null;
}

async function handleTranslateRequest(message, intent) {
  return `## 🌐 Translation Assistant

I can help with translation! The **Translator AI agent** will be implemented using Chrome's built-in Translator API.

**What would you like me to translate?**

*Coming soon: Real-time translation powered by Chrome's built-in AI.*`;
}

async function handleWriteRequest(message, intent) {
  return `## ✍️ Writing Assistant

I'm here to help with your writing! The **Writer AI agent** uses Chrome's built-in Writer API to assist with:

- **Composing** new content
- **Editing** existing text  
- **Improving** writing style and clarity

**What would you like help writing?**

*Powered by Chrome's advanced AI writing capabilities.*`;
}

async function handleResearchRequest(message, intent) {
  try {
    // Try to use the AI agents for research
    if (aiAgents && aiAgents.prompter) {
      // Use the AI agent's research capabilities
      return await aiAgents.handleResearchQuery(intent.craftedPrompt || message);
    } else {
      // Initialize AI agents if not already done
      if (!aiAgents.initialized) {
        await aiAgents.initialize();
      }
      
      // Create prompter and handle research
      await aiAgents.createPrompter();
      return await aiAgents.handleResearchQuery(intent.craftedPrompt || message);
    }
  } catch (error) {
    console.error('Research request failed:', error);
    
    // Fallback response
    return `## 🔍 Research Assistant

I'm having trouble accessing the AI research capabilities right now. This might be because:

- Chrome's built-in AI features need to be enabled
- Your Chrome version needs to be updated (Chrome 138+ required)
- The AI model needs to be downloaded first

**Your question:** "${message}"

**To enable AI research:**
1. Update Chrome to version 138 or higher
2. Enable Chrome AI flags or join the Origin Trial
3. Try your question again

*For now, you can try using the summarizer or other features while we work on getting research AI online.*`;
  }
}

async function handleGeneralRequest(message) {
  try {
    // Try to use the AI prompter for general queries
    if (aiAgents && aiAgents.prompter) {
      return await aiAgents.handleResearchQuery(message);
    } else {
      // Initialize AI agents if not already done
      if (!aiAgents.initialized) {
        await aiAgents.initialize();
      }
      
      // Create prompter and handle general query
      await aiAgents.createPrompter();
      return await aiAgents.handleResearchQuery(message);
    }
  } catch (error) {
    console.error('General request failed:', error);
    
    // Fallback response
    return `## 👋 Welcome to AgenWork!

Thanks for your message: "${message}"

I'm **AgenWork**, your smart browsing assistant powered by Chrome's built-in AI. I'm having trouble accessing the full AI capabilities right now, but here's how I can help:

### 🚀 Available Features:

- **📄 Summarizing** content from web pages
- **🌐 Translating** text between languages  
- **✍️ Writing** assistance and editing
- **🔍 Research** and information gathering

**To unlock full AI capabilities:**
1. Update Chrome to version 138 or higher
2. Enable Chrome AI flags or join the Origin Trial
3. Allow AI model download when prompted

**How can I help you today?**

*Try asking me to summarize this page, or use the quick action buttons above!*`;
  }
}

// Handle quick actions
function handleQuickAction(action) {
  const messageInput = document.getElementById('messageInput');
  
  switch (action) {
    case 'summarize':
      messageInput.value = 'Summarize this page';
      // Auto-send the summarization request
      setTimeout(() => {
        sendMessage();
      }, 100);
      return; // Don't focus input since we're auto-sending
      
    case 'translate':
      messageInput.value = 'Translate this page to ';
      break;
      
    case 'write':
      messageInput.value = 'Help me write ';
      break;
      
    case 'research':
      messageInput.value = 'Research and explain ';
      break;
  }
  
  messageInput.focus();
  // Move cursor to end
  messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
  document.getElementById('sendBtn').disabled = false;
}

// Add message to chat
function addMessageToChat(message, sender, agentType = 'prompter') {
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
  
  // Create markdown content container
  const contentDiv = document.createElement('div');
  contentDiv.className = 'markdown-content';
  
  // Render markdown for agent messages, keep plain text for user messages
  if (sender === 'agent' && window.MarkdownRenderer) {
    try {
      const renderedHtml = MarkdownRenderer.render(message);
      contentDiv.innerHTML = renderedHtml;
    } catch (error) {
      console.warn('Markdown rendering failed, using plain text:', error);
      contentDiv.textContent = message;
    }
  } else {
    contentDiv.textContent = message;
  }
  
  bubble.appendChild(contentDiv);
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

// Show markdown demo (for testing and demonstration purposes)
function showMarkdownDemo() {
  const demoContent = `# 🎉 Markdown Rendering Demo

Welcome to **AgenWork's** new and improved chat interface! All AI responses now support *beautiful* markdown formatting.

## ✨ Features

### Text Formatting
- **Bold text** for emphasis
- *Italic text* for style  
- ~~Strikethrough~~ for corrections
- \`inline code\` for technical terms

### Code Blocks
Here's a sample JavaScript function:

\`\`\`javascript
function greetUser(name) {
  console.log(\`Hello, \${name}! Welcome to AgenWork.\`);
  return \`👋 Welcome \${name}!\`;
}
\`\`\`

### Lists and Organization
1. **Numbered lists** for sequences
2. **Bullet points** for features
   - Sub-items work too
   - With proper indentation

### Quotes and Links
> "The best AI assistant is one that presents information clearly and beautifully."
> — *AgenWork Team*

Visit our [documentation](https://example.com) for more details.

### Tables
| Feature | Status | Notes |
|---------|--------|-------|
| Markdown | ✅ Active | Fully implemented |
| Themes | ✅ Active | Light & Dark modes |
| AI Agents | 🚧 Beta | Chrome AI integration |

---

**Try it yourself!** Ask me anything and see how responses are now beautifully formatted with professional markdown styling. 🚀`;

  addMessageToChat(demoContent, 'agent');
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
      ], async (result) => {
        // Also get aiLanguage from sync storage
        chrome.storage.sync.get(['aiLanguage'], (syncResult) => {
          const supportedLanguages = ['en', 'es', 'ja'];
          const language = syncResult.aiLanguage && supportedLanguages.includes(syncResult.aiLanguage) 
            ? syncResult.aiLanguage 
            : 'en';
          
          // Include language in aiSettings
          if (result.aiSettings) {
            result.aiSettings.language = language;
          } else {
            result.aiSettings = { language };
          }
          
          updateUIWithSettings(result);
        });
      });
      return;
    }
    
    // Load settings from database
    const settings = await agenWorkDB.getAllSettings();
    
    // Convert database settings format to UI format
    // Ensure AI language is valid (only supported languages)
    const supportedLanguages = ['en', 'es', 'ja'];
    const dbLanguage = settings.aiLanguage ?? 'en';
    const validLanguage = supportedLanguages.includes(dbLanguage) ? dbLanguage : 'en';
    
    if (dbLanguage !== validLanguage) {
      console.warn(`Invalid AI language '${dbLanguage}' found in database. Using '${validLanguage}' instead.`);
      // Save the corrected language back to the database
      await agenWorkDB.setSetting('aiLanguage', validLanguage);
    }
    
    const uiSettings = {
      isFloatingIconEnabled: settings.floatingEnabled ?? false,
      theme: settings.theme ?? 'auto',
      aiSettings: {
        summarizer: settings.summarizerEnabled ?? true,
        translator: settings.translatorEnabled ?? true,
        writer: settings.writerEnabled ?? true,
        prompter: settings.prompterEnabled ?? true,
        language: validLanguage // CRITICAL FIX: Include language in aiSettings
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
    const aiLanguageSelect = document.getElementById('aiLanguageSelect');
    
    if (summarizerToggle) summarizerToggle.checked = settings.aiSettings.summarizer ?? true;
    if (translatorToggle) translatorToggle.checked = settings.aiSettings.translator ?? true;
    if (writerToggle) writerToggle.checked = settings.aiSettings.writer ?? true;
    if (prompterToggle) prompterToggle.checked = settings.aiSettings.prompter ?? true;
    if (aiLanguageSelect) aiLanguageSelect.value = settings.aiSettings.language ?? 'en';
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
    const aiLanguageSelect = document.getElementById('aiLanguageSelect');
    
    // Save individual settings to database
    const settingsToSave = [
      { key: 'floatingEnabled', value: floatingToggle ? floatingToggle.checked : false },
      { key: 'theme', value: themeSelect ? themeSelect.value : 'auto' },
      { key: 'summarizerEnabled', value: summarizerToggle ? summarizerToggle.checked : true },
      { key: 'translatorEnabled', value: translatorToggle ? translatorToggle.checked : true },
      { key: 'writerEnabled', value: writerToggle ? writerToggle.checked : true },
      { key: 'prompterEnabled', value: prompterToggle ? prompterToggle.checked : true },
      { key: 'aiLanguage', value: aiLanguageSelect ? aiLanguageSelect.value : 'en' }
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
        prompter: prompterToggle ? prompterToggle.checked : true,
        language: aiLanguageSelect ? aiLanguageSelect.value : 'en'
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

// Handle AI language change
async function handleLanguageChange(e) {
  const language = e.target.value;
  
  // Validate language is supported
  const supportedLanguages = ['en', 'es', 'ja'];
  if (!supportedLanguages.includes(language)) {
    console.error(`Unsupported language selected: ${language}`);
    showNotification('Unsupported language selected', 'error');
    return;
  }
  
  console.log(`AI language changed to: ${language}`);
  
  // Update AI agents with new language preference
  if (aiAgents) {
    const success = aiAgents.setPreferredLanguage(language);
    if (success) {
      showNotification(`AI language set to ${language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Japanese'}`, 'success');
    } else {
      showNotification('Failed to set AI language', 'error');
      return;
    }
  }
  
  // Save language setting to database
  await saveSettingToDB('aiLanguage', language);
  
  // Also save to Chrome sync storage for AIUtils
  try {
    await chrome.storage.sync.set({ aiLanguage: language });
  } catch (error) {
    console.warn('Failed to save language to Chrome sync storage:', error);
  }
  
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

// Helper function to get saved language preference
async function getSavedLanguagePreference() {
  try {
    // Try database first
    if (agenWorkDB && agenWorkDB.isInitialized) {
      const language = await agenWorkDB.getSetting('aiLanguage');
      if (language) return language;
    }
    
    // Fall back to Chrome storage
    return new Promise((resolve) => {
      chrome.storage.local.get(['aiSettings'], (result) => {
        resolve(result.aiSettings?.language || 'en');
      });
    });
  } catch (error) {
    console.warn('Error getting saved language preference:', error);
    return 'en'; // Default to English
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
  
  item.innerHTML = `
    <div class="conversation-header">
      <div class="conversation-info">
        <div class="conversation-title-container">
          <div class="conversation-title" data-conversation-id="${conversation.id}">${conversation.title}</div>
          <input type="text" class="conversation-title-edit" value="${conversation.title}" style="display: none;">
        </div>
        <div class="conversation-meta">
          <span class="conversation-date">${formatDate(conversation.updatedAt)}</span>
          <span class="conversation-count">${conversation.messageCount || 0} messages</span>
        </div>
      </div>
      <div class="conversation-actions">
        <button class="conversation-action-btn edit-title-btn" title="Edit title">
          <i class="fas fa-edit"></i>
        </button>
        <button class="conversation-action-btn delete-btn" title="Delete conversation">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners for action buttons
  const editBtn = item.querySelector('.edit-title-btn');
  const deleteBtn = item.querySelector('.delete-btn');
  
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    editConversationTitle(conversation.id);
  });
  
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteConversation(conversation.id);
  });
  
  // Add click handler to load conversation
  item.addEventListener('click', (e) => {
    // Don't load conversation if clicking on actions or title edit
    if (!e.target.closest('.conversation-actions') && !e.target.closest('.conversation-title-edit')) {
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
    // Validate conversationId
    if (!conversationId) {
      console.error('Invalid conversation ID');
      showNotification('Invalid conversation ID', 'error');
      return;
    }
    
    const conversation = await agenWorkDB.getConversation(conversationId);
    if (!conversation) {
      console.error('Conversation not found');
      showNotification('Conversation not found', 'error');
      return;
    }
    
    currentConversationId = conversationId;
    
    // Clear current messages
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) {
      console.error('Messages container not found');
      return;
    }
    messagesContainer.innerHTML = '';
    
    // Load messages safely
    if (conversation.messages && Array.isArray(conversation.messages)) {
      conversation.messages.forEach(message => {
        const sender = message.role === 'user' ? 'user' : 'agent';
        addMessageToChat(message.content, sender, message.agentType);
      });
    } else {
      console.warn('No messages found for conversation');
    }
    
    // Switch to chat view
    switchView('chat');
    
    // Update header title
    updateActiveConversationTitle(conversation.title);
    
    console.log('Conversation loaded successfully');
  } catch (error) {
    console.error('Failed to load conversation:', error);
    showNotification('Failed to load conversation', 'error');
  }
}

async function editConversationTitle(conversationId) {
  const conversationItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
  if (!conversationItem) return;
  
  const titleElement = conversationItem.querySelector('.conversation-title');
  const editInput = conversationItem.querySelector('.conversation-title-edit');
  const editBtn = conversationItem.querySelector('.edit-title-btn');
  
  if (!titleElement || !editInput || !editBtn) return;
  
  // Toggle edit mode
  const isEditing = editInput.style.display !== 'none';
  
  if (isEditing) {
    // Save the edit
    const newTitle = editInput.value.trim();
    
    // Validate title
    if (!newTitle) {
      showNotification('Title cannot be empty', 'error');
      editInput.focus();
      return;
    }
    
    if (newTitle !== titleElement.textContent) {
      try {
        await agenWorkDB.updateConversation(conversationId, { title: newTitle });
        titleElement.textContent = newTitle;
        showNotification('Title updated successfully', 'success');
        
        // Update active conversation title if this is the current conversation
        if (currentConversationId === conversationId) {
          updateActiveConversationTitle(newTitle);
        }
      } catch (error) {
        console.error('Failed to update conversation title:', error);
        showNotification('Failed to update title', 'error');
        editInput.value = titleElement.textContent; // Reset to original
        return;
      }
    }
    
    // Exit edit mode
    titleElement.style.display = 'block';
    editInput.style.display = 'none';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit title';
  } else {
    // Enter edit mode
    titleElement.style.display = 'none';
    editInput.style.display = 'block';
    editInput.focus();
    editInput.select();
    editBtn.innerHTML = '<i class="fas fa-check"></i>';
    editBtn.title = 'Save title';
    
    // Handle Enter key to save
    editInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        editConversationTitle(conversationId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Cancel edit
        editInput.value = titleElement.textContent;
        titleElement.style.display = 'block';
        editInput.style.display = 'none';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit title';
      }
    };
    
    // Handle blur to save
    editInput.onblur = () => {
      setTimeout(() => {
        if (editInput.style.display !== 'none') {
          editConversationTitle(conversationId);
        }
      }, 100);
    };
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