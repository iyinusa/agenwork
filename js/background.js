// AgenWork Background Service Worker
// This service worker manages the Chrome Extension lifecycle and communication

// Install event - set up initial state
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AgenWork installed:', details.reason);
  
  // Initialize default settings
  chrome.storage.local.set({
    isFloatingIconEnabled: true, // Enable by default for better UX
    theme: 'light',
    aiSettings: {
      summarizer: true,
      translator: true,
      writer: true,
      prompter: true
    }
  });
  
  // Inject floating icon into all existing tabs if enabled
  if (details.reason === 'install') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          try {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['js/floating-icon.js']
            }).catch(err => {
              console.log('Could not inject into tab:', tab.url, err);
            });
          } catch (error) {
            console.log('Could not inject into tab:', tab.url, error);
          }
        }
      });
    });
  }
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
      // Check if sender has a tab (messages from popup don't have tabs)
      if (sender.tab && sender.tab.id) {
        handleFloatingIconToggle(message.enabled, sender.tab.id);
        sendResponse({ success: true });
      } else {
        // If no tab, toggle on all tabs or current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            handleFloatingIconToggle(message.enabled, tabs[0].id);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No active tab found' });
          }
        });
        return true; // Keep message channel open for async response
      }
      break;
      
    case 'GET_SETTINGS':
      chrome.storage.local.get(['isFloatingIconEnabled', 'theme', 'aiSettings'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting settings:', chrome.runtime.lastError);
          sendResponse({ isFloatingIconEnabled: true }); // Default fallback
        } else {
          sendResponse(result);
        }
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
      
    case 'OPEN_POPUP_FROM_FLOATING':
      // Try to open the extension popup
      try {
        chrome.action.openPopup();
        sendResponse({ success: true });
      } catch (error) {
        console.log('Cannot open popup programmatically, falling back to inline interface');
        sendResponse({ success: false, fallback: true });
      }
      break;
      
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
      
      console.log('Floating icon injected into tab:', tabId);
    } else {
      // Remove floating icon from the current tab
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const floatingIcon = document.getElementById('agenwork-floating-icon');
          if (floatingIcon) {
            floatingIcon.style.animation = 'slideOutToRight 0.3s ease forwards';
            setTimeout(() => {
              floatingIcon.remove();
            }, 300);
          }
          // Reset the loaded flag so it can be injected again
          window.agenworkFloatingIconLoaded = false;
        }
      });
      
      console.log('Floating icon removed from tab:', tabId);
    }
    
    // Update storage
    chrome.storage.local.set({ isFloatingIconEnabled: enabled });
  } catch (error) {
    console.error('Error toggling floating icon:', error);
    throw error;
  }
}

// Initialize AI session based on agent type
// Note: AI APIs are not available in service workers (background scripts)
// This functionality is handled in the popup/content scripts
async function initializeAISession(agentType) {
  try {
    // Since AI APIs are not available in service workers,
    // we return a message indicating this should be handled in the popup
    return {
      success: false,
      error: 'AI APIs must be initialized in popup context',
      agentType: agentType
    };
  } catch (error) {
    console.error('Error in AI session initialization:', error);
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