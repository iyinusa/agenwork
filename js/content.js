// AgenWork Content Script
// This script runs on every web page and handles floating icon functionality

console.log('AgenWork content script loaded');

// Initialize content script
(function() {
  'use strict';
  
  let isFloatingIconEnabled = false;
  let floatingIcon = null;
  
  // Check if floating icon should be enabled on page load
  chrome.storage.local.get(['isFloatingIconEnabled'], (result) => {
    if (result.isFloatingIconEnabled) {
      createFloatingIcon();
    }
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'TOGGLE_FLOATING_ICON':
        if (message.enabled) {
          createFloatingIcon();
        } else {
          removeFloatingIcon();
        }
        sendResponse({ success: true });
        break;
        
      case 'GET_PAGE_CONTENT':
        sendResponse({
          success: true,
          content: {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText.substring(0, 5000) // Limit text length
          }
        });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  });
  
  // Create floating icon
  function createFloatingIcon() {
    // Remove existing icon if present
    removeFloatingIcon();
    
    // Create floating icon element
    floatingIcon = document.createElement('div');
    floatingIcon.id = 'agenwork-floating-icon';
    floatingIcon.innerHTML = `
      <div class="agenwork-floating-btn">
        <ion-icon name="chatbubble-ellipses-outline"></ion-icon>
      </div>
    `;
    
    // Add styles
    floatingIcon.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      cursor: move;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      transition: all 0.3s ease;
      user-select: none;
    `;
    
    // Add hover effects
    floatingIcon.addEventListener('mouseenter', () => {
      floatingIcon.style.transform = 'scale(1.1)';
      floatingIcon.style.boxShadow = '0 6px 30px rgba(0,0,0,0.25)';
    });
    
    floatingIcon.addEventListener('mouseleave', () => {
      floatingIcon.style.transform = 'scale(1)';
      floatingIcon.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    });
    
    // Make it draggable
    makeDraggable(floatingIcon);
    
    // Add click handler
    floatingIcon.addEventListener('click', (e) => {
      if (!isDragging) {
        openAgenWorkChat();
      }
    });
    
    // Append to body
    document.body.appendChild(floatingIcon);
    
    // Load Ionic icons if not already loaded
    loadIonicIcons();
  }
  
  // Remove floating icon
  function removeFloatingIcon() {
    if (floatingIcon) {
      floatingIcon.remove();
      floatingIcon = null;
    }
  }
  
  // Make element draggable
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  
  function makeDraggable(element) {
    element.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
      isDragging = true;
      const rect = element.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
      
      element.style.cursor = 'grabbing';
      e.preventDefault();
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      
      const boundedX = Math.max(0, Math.min(x, maxX));
      const boundedY = Math.max(0, Math.min(y, maxY));
      
      element.style.left = boundedX + 'px';
      element.style.top = boundedY + 'px';
      element.style.right = 'auto';
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
      element.style.cursor = 'move';
      
      // Small delay to prevent click event after drag
      setTimeout(() => {
        isDragging = false;
      }, 100);
    }
  }
  
  // Open AgenWork chat interface
  function openAgenWorkChat() {
    // Send message to background script to open popup
    chrome.runtime.sendMessage({
      type: 'OPEN_CHAT',
      source: 'floating-icon'
    });
    
    // Alternative: Create inline chat interface
    createInlineChatInterface();
  }
  
  // Create inline chat interface
  function createInlineChatInterface() {
    // Remove existing chat if present
    const existingChat = document.getElementById('agenwork-inline-chat');
    if (existingChat) {
      existingChat.remove();
      return;
    }
    
    const chatInterface = document.createElement('div');
    chatInterface.id = 'agenwork-inline-chat';
    chatInterface.innerHTML = `
      <div class="agenwork-chat-header">
        <span>AgenWork</span>
        <button class="agenwork-close-btn">&times;</button>
      </div>
      <div class="agenwork-chat-body">
        <div class="agenwork-messages"></div>
        <div class="agenwork-input-area">
          <input type="text" placeholder="Ask AgenWork anything..." class="agenwork-input">
          <button class="agenwork-send-btn">
            <ion-icon name="send-outline"></ion-icon>
          </button>
        </div>
      </div>
    `;
    
    chatInterface.style.cssText = `
      position: fixed;
      top: 50%;
      right: 100px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 1000000;
      transform: translateY(-50%);
      font-family: 'Fira Sans', sans-serif;
      overflow: hidden;
    `;
    
    // Add close functionality
    chatInterface.querySelector('.agenwork-close-btn').addEventListener('click', () => {
      chatInterface.remove();
    });
    
    document.body.appendChild(chatInterface);
  }
  
  // Load Ionic icons
  function loadIonicIcons() {
    if (!document.querySelector('script[src*="ionicons"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js';
      document.head.appendChild(script);
      
      const nomoduleScript = document.createElement('script');
      nomoduleScript.noModule = true;
      nomoduleScript.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js';
      document.head.appendChild(nomoduleScript);
    }
  }
  
})();