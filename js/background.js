// AgenWork Background Service Worker
// This service worker manages the Chrome Extension lifecycle and communication

// Install event - set up initial state
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AgenWork installed:', details.reason);
  
  // Initialize default settings
  chrome.storage.local.set({
    isFloatingIconEnabled: false,
    theme: 'light',
    aiSettings: {
      summarizer: true,
      translator: true,
      writer: true,
      prompter: true
    }
  });
});

// Extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('AgenWork started');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'TOGGLE_FLOATING_ICON':
      handleFloatingIconToggle(message.enabled, sender.tab.id);
      sendResponse({ success: true });
      break;
      
    case 'GET_SETTINGS':
      chrome.storage.local.get(['isFloatingIconEnabled', 'theme', 'aiSettings'], (result) => {
        sendResponse(result);
      });
      return true; // Keep message channel open for async response
      
    case 'SAVE_SETTINGS':
      chrome.storage.local.set(message.settings, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'INIT_AI_SESSION':
      initializeAISession(message.agentType)
        .then(session => sendResponse({ success: true, session }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Handle floating icon toggle
async function handleFloatingIconToggle(enabled, tabId) {
  try {
    if (enabled) {
      // Inject floating icon into the current tab
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['js/floating-icon.js']
      });
    } else {
      // Remove floating icon from the current tab
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const floatingIcon = document.getElementById('agenwork-floating-icon');
          if (floatingIcon) {
            floatingIcon.remove();
          }
        }
      });
    }
    
    // Update storage
    chrome.storage.local.set({ isFloatingIconEnabled: enabled });
  } catch (error) {
    console.error('Error toggling floating icon:', error);
  }
}

// Initialize AI session based on agent type
async function initializeAISession(agentType) {
  try {
    switch (agentType) {
      case 'summarizer':
        if ('ai' in window && 'summarizer' in window.ai) {
          return await window.ai.summarizer.create();
        }
        throw new Error('Summarizer API not available');
        
      case 'translator':
        if ('ai' in window && 'translator' in window.ai) {
          return await window.ai.translator.create();
        }
        throw new Error('Translator API not available');
        
      case 'writer':
        if ('ai' in window && 'writer' in window.ai) {
          return await window.ai.writer.create();
        }
        throw new Error('Writer API not available');
        
      case 'prompter':
        if ('ai' in window && 'languageModel' in window.ai) {
          return await window.ai.languageModel.create();
        }
        throw new Error('Prompt API not available');
        
      default:
        throw new Error('Unknown agent type: ' + agentType);
    }
  } catch (error) {
    console.error('Error initializing AI session:', error);
    throw error;
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup, but we can add additional logic here if needed
  console.log('Extension icon clicked for tab:', tab.id);
});

// Cleanup on extension suspension
chrome.runtime.onSuspend.addListener(() => {
  console.log('AgenWork suspended');
});