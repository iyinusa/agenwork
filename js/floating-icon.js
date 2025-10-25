// AgenWork Floating Icon Script
// This script creates and manages the floating icon on web pages

(function() {
  'use strict';
  
  // Prevent multiple executions
  if (window.agenworkFloatingIconLoaded) {
    return;
  }
  window.agenworkFloatingIconLoaded = true;
  
  // Variables to track dragging and modal state
  let isDragging = false;
  let offsetX, offsetY;
  let isModalOpen = false;
  let modalIsDragging = false;
  let modalOffsetX, modalOffsetY;
  
  // Button position (will be stored in localStorage)
  let buttonPosition = {
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)'
  };
  
  // Modal position
  let modalPosition = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };
  
  // Initialize the floating button
  function initFloatingButton() {
    // Check if button should be visible based on user preference
    try {
      chrome.runtime.sendMessage({
        type: 'GET_SETTINGS'
      }, response => {
        // Check for chrome.runtime.lastError
        if (chrome.runtime.lastError) {
          console.log('Chrome runtime error:', chrome.runtime.lastError.message);
          initButton(); // Initialize anyway as fallback
          return;
        }
        
        if (response && response.isFloatingIconEnabled) {
          initButton();
        }
      });
    } catch (error) {
      console.log('Chrome runtime not available, initializing floating button anyway');
      initButton();
    }
  }
  
  function initButton() {
    // Check if the button already exists
    if (document.querySelector('#agenwork-floating-icon')) {
      return;
    }
    
    // Create the button with animation delay to allow page to load first
    setTimeout(() => {
      const button = document.createElement('div');
      button.id = 'agenwork-floating-icon';
      button.className = 'agenwork-floating-button';
      button.title = 'AgenWork Assistant';
      button.innerHTML = '<img src="' + (chrome.runtime ? chrome.runtime.getURL('images/icon.png') : 'images/icon.png') + '" alt="AgenWork" style="width: 32px; height: 32px; color: white;">';
      
      // Load position from localStorage
      const savedPosition = localStorage.getItem('agenwork-button-position');
      if (savedPosition) {
        try {
          buttonPosition = JSON.parse(savedPosition);
        } catch (e) {
          console.log('Could not parse saved position, using default');
        }
      }
      
      // Apply styles and position
      applyButtonStyles(button);
      
      // Add animations CSS if not already present
      if (!document.getElementById('agenwork-floating-animations')) {
        addFloatingAnimations();
      }
      
      // Create modal components
      const modalElements = createModal();
      
      // Button mouse events for drag and click detection
      button.addEventListener('mousedown', handleButtonMouseDown);
      
      // Append the elements to the body
      document.body.appendChild(button);
      document.body.appendChild(modalElements.overlay);
      document.body.appendChild(modalElements.modal);
      
      // Add entrance animation for the button
      animateButtonIn(button);
    }, 1000);
  }
  
  function applyButtonStyles(button) {
    button.style.cssText = 'position: fixed; width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25), 0 0 0 1px rgba(255,255,255,0.1); cursor: pointer; z-index: 999999; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); user-select: none; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 2px solid rgba(255, 255, 255, 0.2); animation: agenworkPulse 3s ease-in-out infinite; touch-action: none;';
    
    button.style.left = buttonPosition.left;
    button.style.top = buttonPosition.top;
    if (buttonPosition.transform) {
      button.style.transform = buttonPosition.transform;
    }
  }
  
  function createModal() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'agenwork-overlay';
    overlay.className = 'agenwork-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'agenwork-modal';
    modal.className = 'agenwork-modal';
    modal.style.top = modalPosition.top;
    modal.style.left = modalPosition.left;
    modal.style.transform = modalPosition.transform;
    
    // Modal header for dragging
    const modalHeader = document.createElement('div');
    modalHeader.className = 'agenwork-modal-header';
    
    // Modal title
    const modalTitle = document.createElement('div');
    modalTitle.className = 'agenwork-modal-title';
    modalTitle.innerHTML = '';
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'agenwork-close-btn';
    closeButton.innerHTML = 'X';
    closeButton.setAttribute('aria-label', 'Close');
    
    // Create iframe for the popup content
    const iframe = document.createElement('iframe');
    iframe.className = 'agenwork-iframe';
    
    // Set iframe source to the popup.html
    try {
      const extensionUrl = chrome.runtime.getURL('');
      iframe.src = extensionUrl + 'popup.html';
    } catch (error) {
      iframe.src = 'popup.html';
    }
    
    // Add event listeners
    iframe.addEventListener('load', () => {
      iframe.classList.add('loaded');
      try {
        iframe.contentWindow.postMessage({
          type: 'FLOATING_MODE',
          enabled: true
        }, '*');
      } catch (e) {
        console.log('Could not send message to iframe:', e);
      }
    });
    
    // Assemble the modal
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    modal.appendChild(modalHeader);
    modal.appendChild(iframe);
    
    // Event handlers
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
    
    modalHeader.addEventListener('mousedown', handleModalMouseDown);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
    
    return { overlay, modal };
  }
  
  function animateButtonIn(button) {
    button.style.opacity = '0';
    button.style.transform = (buttonPosition.transform || 'translateY(-50%)') + ' scale(0.8)';
    
    setTimeout(() => {
      button.style.opacity = '1';
      button.style.transform = (buttonPosition.transform || 'translateY(-50%)') + ' scale(1)';
    }, 100);
  }
  
  function handleButtonMouseDown(e) {
    if (e.button !== 0) return;
    
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    button.classList.add('active');
    
    const moveHandler = (moveEvent) => {
      if (!isDragging && 
          (Math.abs(moveEvent.clientX - startX) > 5 || 
           Math.abs(moveEvent.clientY - startY) > 5)) {
        isDragging = true;
        button.classList.add('dragging');
        button.style.animation = 'none';
      }
      
      if (isDragging) {
        moveEvent.preventDefault();
        
        const newLeft = Math.max(0, Math.min(window.innerWidth - button.offsetWidth, moveEvent.clientX - offsetX));
        const newTop = Math.max(0, Math.min(window.innerHeight - button.offsetHeight, moveEvent.clientY - offsetY));
        
        button.style.left = newLeft + 'px';
        button.style.top = newTop + 'px';
        button.style.transform = 'none';
        
        buttonPosition = {
          left: newLeft + 'px',
          top: newTop + 'px',
          transform: 'none'
        };
      }
    };
    
    const upHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      
      button.classList.remove('active');
      button.classList.remove('dragging');
      
      if (isDragging) {
        localStorage.setItem('agenwork-button-position', JSON.stringify(buttonPosition));
        isDragging = false;
        
        setTimeout(() => {
          button.style.animation = 'agenworkPulse 3s ease-in-out infinite';
        }, 300);
      } else {
        toggleModal();
      }
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }
  
  function handleModalMouseDown(e) {
    if (e.button !== 0 || e.target.closest('.agenwork-close-btn')) return;
    
    e.preventDefault();
    modalIsDragging = true;
    
    const modal = document.querySelector('#agenwork-modal');
    const rect = modal.getBoundingClientRect();
    
    modalOffsetX = e.clientX - rect.left;
    modalOffsetY = e.clientY - rect.top;
    
    modal.style.transform = 'none';
    
    const modalMoveHandler = (moveEvent) => {
      if (modalIsDragging) {
        moveEvent.preventDefault();
        
        const modal = document.querySelector('#agenwork-modal');
        const newLeft = Math.max(0, Math.min(window.innerWidth - modal.offsetWidth, moveEvent.clientX - modalOffsetX));
        const newTop = Math.max(0, Math.min(window.innerHeight - modal.offsetHeight, moveEvent.clientY - modalOffsetY));
        
        modal.style.left = newLeft + 'px';
        modal.style.top = newTop + 'px';
        
        modalPosition = {
          top: newTop + 'px',
          left: newLeft + 'px',
          transform: 'none'
        };
      }
    };
    
    const modalUpHandler = () => {
      modalIsDragging = false;
      document.removeEventListener('mousemove', modalMoveHandler);
      document.removeEventListener('mouseup', modalUpHandler);
    };
    
    document.addEventListener('mousemove', modalMoveHandler);
    document.addEventListener('mouseup', modalUpHandler);
  }
  
  function toggleModal() {
    const modal = document.querySelector('#agenwork-modal');
    const overlay = document.querySelector('#agenwork-overlay');
    const button = document.querySelector('#agenwork-floating-icon');
    const iframe = document.querySelector('.agenwork-iframe');
    
    if (isModalOpen) {
      closeModal();
    } else {
      modal.style.display = 'block';
      overlay.style.display = 'block';
      
      void modal.offsetWidth;
      
      setTimeout(() => {
        modal.classList.add('active');
        overlay.classList.add('active');
        isModalOpen = true;
        
        button.classList.add('active');
        
        if (iframe && iframe.src) {
          const currentSrc = iframe.src;
          iframe.src = '';
          setTimeout(() => {
            iframe.src = currentSrc;
          }, 50);
        }
      }, 10);
    }
  }
  
  function closeModal() {
    const modal = document.querySelector('#agenwork-modal');
    const overlay = document.querySelector('#agenwork-overlay');
    const button = document.querySelector('#agenwork-floating-icon');
    
    if (!modal || !overlay) return;
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    setTimeout(() => {
      modal.style.display = 'none';
      overlay.style.display = 'none';
      isModalOpen = false;
      
      button.classList.remove('active');
    }, 300);
  }
  
  function addFloatingAnimations() {
    const animationStyles = document.createElement('style');
    animationStyles.id = 'agenwork-floating-animations';
    animationStyles.textContent = '@keyframes agenworkPulse { 0%, 100% { box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25), 0 0 0 1px rgba(255,255,255,0.1); } 50% { box-shadow: 0 12px 40px rgba(102, 126, 234, 0.35), 0 0 0 2px rgba(255,255,255,0.2); } } .agenwork-floating-button:hover { transform: translateY(-50%) scale(1.1) rotate(5deg) !important; box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4), 0 0 0 2px rgba(255,255,255,0.3) !important; background: linear-gradient(135deg, #5a67d8 0%, #6b4e8c 100%) !important; animation: none !important; } .agenwork-floating-button.active { background: linear-gradient(135deg, #5a67d8 0%, #6b4e8c 100%) !important; animation: none !important; } .agenwork-floating-button.dragging { opacity: 0.8 !important; cursor: move !important; transform: scale(0.95) !important; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2) !important; } .agenwork-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0); z-index: 999998; display: none; transition: background-color 0.3s ease; } .agenwork-overlay.active { background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); } .agenwork-modal { position: fixed; width: 650px; height: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(102, 126, 234, 0.15), 0 0 0 1px rgba(255,255,255,0.2); z-index: 999999; overflow: hidden; display: none; opacity: 0; transform: scale(0.9); transition: opacity 0.3s ease, transform 0.3s ease; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 2px solid rgba(255, 255, 255, 0.3); } .agenwork-modal.active { opacity: 1; transform: scale(1); } .agenwork-modal-header { height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; cursor: move; font-family: "Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 500; border-radius: 16px 16px 0 0; } .agenwork-modal-title { font-size: 16px; font-weight: 500; } .agenwork-close-btn { background: rgba(255, 255, 255, 0.2); border: none; border-radius: 50%; width: 32px; height: 32px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.2s ease; } .agenwork-close-btn:hover { background: rgba(255, 255, 255, 0.3); transform: scale(1.1); } .agenwork-iframe { width: 100%; height: calc(100% - 60px); border: none; background: transparent; } .agenwork-iframe.loaded { background: #ffffff; }';
    document.head.appendChild(animationStyles);
  }
  
  // Listen for messages from the extension
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'TOGGLE_FLOATING_ICON') {
        const button = document.querySelector('#agenwork-floating-icon');
        
        if (button) {
          if (request.enabled) {
            button.style.display = 'flex';
            animateButtonIn(button);
          } else {
            button.style.opacity = '0';
            button.style.transform = (buttonPosition.transform || 'translateY(-50%)') + ' scale(0.8)';
            
            setTimeout(() => {
              button.style.display = 'none';
            }, 300);
          }
          
          if (!request.enabled && isModalOpen) {
            closeModal();
          }
        } else if (request.enabled) {
          initButton();
        }
        
        sendResponse({ success: true });
      }
    });
  } catch (error) {
    console.log('Chrome runtime not available for message listening');
  }
  
  // Add keyboard support - Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
      closeModal();
    }
  });
  
  // Initialize after DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingButton);
  } else {
    initFloatingButton();
  }
  
  // Re-initialize on navigation (for SPAs)
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(initFloatingButton, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
  
})();
