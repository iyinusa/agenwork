// AgenWork Floating Icon Script
// This script creates and manages the floating icon on web pages

(function() {
  'use strict';
  
  // Prevent multiple executions
  if (window.agenworkFloatingIconLoaded) {
    return;
  }
  window.agenworkFloatingIconLoaded = true;
  
  // Create floating icon
  function createFloatingIcon() {
    // Remove existing icon if present
    const existingIcon = document.getElementById('agenwork-floating-icon');
    if (existingIcon) {
      existingIcon.remove();
    }
    
    // Create floating icon element
    const floatingIcon = document.createElement('div');
    floatingIcon.id = 'agenwork-floating-icon';
    floatingIcon.innerHTML = `
      <div class="agenwork-floating-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </div>
    `;
    
    // Add styles
    const styles = `
      position: fixed;
      top: 50%;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1);
      cursor: move;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      backdrop-filter: blur(10px);
      transform: translateY(-50%);
    `;
    
    floatingIcon.style.cssText = styles;
    
    // Add hover effects
    floatingIcon.addEventListener('mouseenter', () => {
      floatingIcon.style.transform = 'translateY(-50%) scale(1.1)';
      floatingIcon.style.boxShadow = '0 6px 30px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.2)';
    });
    
    floatingIcon.addEventListener('mouseleave', () => {
      floatingIcon.style.transform = 'translateY(-50%) scale(1)';
      floatingIcon.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)';
    });
    
    // Make it draggable
    makeDraggable(floatingIcon);
    
    // Add click handler
    let clickTimeout;
    floatingIcon.addEventListener('mousedown', () => {
      clickTimeout = setTimeout(() => {
        // This is a drag, not a click
      }, 150);
    });
    
    floatingIcon.addEventListener('mouseup', (e) => {
      clearTimeout(clickTimeout);
      if (!floatingIcon.classList.contains('dragging')) {
        openAgenWorkInterface();
      }
    });
    
    // Append to body
    document.body.appendChild(floatingIcon);
    
    // Animate in
    requestAnimationFrame(() => {
      floatingIcon.style.opacity = '0';
      floatingIcon.style.transform = 'translateY(-50%) scale(0.5)';
      
      requestAnimationFrame(() => {
        floatingIcon.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        floatingIcon.style.opacity = '1';
        floatingIcon.style.transform = 'translateY(-50%) scale(1)';
      });
    });
    
    return floatingIcon;
  }
  
  // Make element draggable
  function makeDraggable(element) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    
    element.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
      
      element.style.cursor = 'grabbing';
      e.preventDefault();
    }
    
    function drag(e) {
      if (!isDragging) {
        const distance = Math.sqrt(
          Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2)
        );
        
        if (distance > 5) {
          isDragging = true;
          element.classList.add('dragging');
        }
      }
      
      if (isDragging) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
        element.style.right = 'auto';
        element.style.transform = 'none';
      }
    }
    
    function stopDrag() {
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
      element.style.cursor = 'move';
      
      // Snap to edges
      if (isDragging) {
        snapToEdge(element);
      }
      
      // Small delay to prevent click event after drag
      setTimeout(() => {
        isDragging = false;
        element.classList.remove('dragging');
      }, 100);
    }
  }
  
  // Snap floating icon to nearest edge
  function snapToEdge(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Determine which edge is closest
    const distanceToLeft = centerX;
    const distanceToRight = windowWidth - centerX;
    const distanceToTop = centerY;
    const distanceToBottom = windowHeight - centerY;
    
    const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
    
    let targetX = rect.left;
    let targetY = rect.top;
    
    if (minDistance === distanceToLeft) {
      targetX = 20;
    } else if (minDistance === distanceToRight) {
      targetX = windowWidth - rect.width - 20;
    } else if (minDistance === distanceToTop) {
      targetY = 20;
    } else {
      targetY = windowHeight - rect.height - 20;
    }
    
    // Animate to target position
    element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    element.style.left = targetX + 'px';
    element.style.top = targetY + 'px';
    
    // Remove transition after animation
    setTimeout(() => {
      element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 300);
  }
  
  // Open AgenWork interface
  function openAgenWorkInterface() {
    // Try to open the extension popup (if supported)
    try {
      chrome.runtime.sendMessage({
        type: 'OPEN_POPUP_FROM_FLOATING'
      });
    } catch (error) {
      // Fallback: create inline interface
      createInlineInterface();
    }
  }
  
  // Create inline chat interface
  function createInlineInterface() {
    // Remove existing interface if present
    const existing = document.getElementById('agenwork-inline-interface');
    if (existing) {
      existing.remove();
      return;
    }
    
    const interfaceElement = document.createElement('div');
    interfaceElement.id = 'agenwork-inline-interface';
    interfaceElement.innerHTML = `
      <div class="agenwork-interface-header">
        <div class="agenwork-interface-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          AgenWork
        </div>
        <button class="agenwork-interface-close">&times;</button>
      </div>
      <div class="agenwork-interface-body">
        <div class="agenwork-interface-messages">
          <div class="agenwork-welcome-message">
            <p>👋 Hi! I'm AgenWork, your smart browsing assistant.</p>
            <p>I can help you summarize content, translate text, assist with writing, and more!</p>
          </div>
        </div>
        <div class="agenwork-interface-input">
          <input type="text" placeholder="Ask me anything..." class="agenwork-input-field">
          <button class="agenwork-send-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    // Style the interface
    const interfaceStyles = `
      position: fixed;
      top: 50%;
      right: 100px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
      z-index: 1000000;
      transform: translateY(-50%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      backdrop-filter: blur(10px);
      animation: slideInFromRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    
    interfaceElement.style.cssText = interfaceStyles;
    
    // Add interface styles to document
    if (!document.getElementById('agenwork-interface-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'agenwork-interface-styles';
      styleSheet.textContent = `
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
        
        .agenwork-interface-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }
        
        .agenwork-interface-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .agenwork-interface-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }
        
        .agenwork-interface-close:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .agenwork-interface-body {
          height: calc(100% - 64px);
          display: flex;
          flex-direction: column;
        }
        
        .agenwork-interface-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: #f8f9fa;
        }
        
        .agenwork-welcome-message {
          text-align: center;
          color: #6c757d;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .agenwork-welcome-message p {
          margin-bottom: 12px;
        }
        
        .agenwork-interface-input {
          padding: 16px;
          background: white;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .agenwork-input-field {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e9ecef;
          border-radius: 24px;
          outline: none;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }
        
        .agenwork-input-field:focus {
          border-color: #667eea;
        }
        
        .agenwork-send-button {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }
        
        .agenwork-send-button:hover {
          transform: scale(1.05);
        }
      `;
      document.head.appendChild(styleSheet);
    }
    
    // Add event listeners
    const closeBtn = interfaceElement.querySelector('.agenwork-interface-close');
    closeBtn.addEventListener('click', function() {
      interfaceElement.style.animation = 'slideInFromRight 0.3s reverse';
      setTimeout(() => interfaceElement.remove(), 300);
    });
    
    const inputField = interfaceElement.querySelector('.agenwork-input-field');
    const sendButton = interfaceElement.querySelector('.agenwork-send-button');
    
    function sendMessage() {
      const message = inputField.value.trim();
      if (!message) return;
      
      // This would integrate with the main extension logic
      console.log('Sending message from floating interface:', message);
      inputField.value = '';
      
      // Show a simple response for now
      const messagesContainer = interfaceElement.querySelector('.agenwork-interface-messages');
      messagesContainer.innerHTML += `
        <div style="margin-bottom: 12px; text-align: right;">
          <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 16px; font-size: 14px; max-width: 80%;">
            ${message}
          </div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="display: inline-block; background: white; border: 1px solid #e9ecef; color: #333; padding: 8px 12px; border-radius: 16px; font-size: 14px; max-width: 80%;">
            Thanks for your message! The full AI integration will be available in the complete extension.
          </div>
        </div>
      `;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    document.body.appendChild(interfaceElement);
    
    // Focus input field
    setTimeout(() => inputField.focus(), 100);
  }
  
  // Create the floating icon
  createFloatingIcon();
  
})();