// AgenWork Content Script
// This script runs on every web page and handles page content extraction

console.log('AgenWork content script loaded');

// Initialize content script
(function() {
  'use strict';
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PAGE_CONTENT':
        sendResponse({
          success: true,
          content: {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText.substring(0, 5000)
          }
        });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  });
  
  // The floating icon functionality is now handled by floating-icon.js
  // which is injected separately by the background script
  
})();
