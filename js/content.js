// AgenWork Content Script
// This script runs on every web page and handles page content extraction

console.log('AgenWork content script loaded');

// Extract page content function
function extractPageContent() {
  try {
    // Get main content areas
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '#content',
      '#main-content',
      '.article-content',
      '.blog-content',
      '.text-content'
    ];

    let content = '';
    let title = document.title || '';
    let url = window.location.href || '';

    // Try to find main content area
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.innerText || element.textContent || '';
        if (content.trim().length > 200) {
          break;
        }
      }
    }

    // If no main content found, try to get meaningful content from body
    if (!content || content.trim().length < 200) {
      // Try to get content excluding navigation, headers, footers, etc.
      const elementsToExclude = 'nav, header, footer, aside, .navigation, .menu, .sidebar, .ad, .advertisement, script, style, noscript, .comments';
      const bodyClone = document.body.cloneNode(true);
      
      // Remove excluded elements
      bodyClone.querySelectorAll(elementsToExclude).forEach(el => el.remove());
      
      content = bodyClone.innerText || bodyClone.textContent || '';
    }

    // If still no content, fallback to full body
    if (!content || content.trim().length < 100) {
      content = document.body.innerText || document.body.textContent || '';
    }

    // Clean up the content
    content = content
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .trim();

    // Limit content length to prevent issues with very long pages
    if (content.length > 50000) {
      content = content.substring(0, 50000) + '...';
    }

    return {
      title,
      url,
      content,
      timestamp: new Date().toISOString(),
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length
    };

  } catch (error) {
    console.error('Error extracting page content:', error);
    throw error;
  }
}

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
        
      case 'CHECK_SUMMARIZER_API':
        // Check if Summarizer API is available in page context
        const hasSummarizer = 'Summarizer' in self;
        sendResponse({
          success: true,
          available: hasSummarizer,
          context: 'content-script'
        });
        break;
        
      case 'SUMMARIZE_PAGE':
        handleSummarizeRequest(message.options)
          .then(result => sendResponse({ success: true, result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  });
  
  // Handle summarization in content script context
  async function handleSummarizeRequest(options = {}) {
    try {
      // Check if Summarizer API is available
      if (!('Summarizer' in self)) {
        throw new Error('Summarizer API not available in this context');
      }
      
      // Check availability
      const availability = await self.Summarizer.availability();
      if (availability === 'no') {
        throw new Error('Summarizer API is not available on this device');
      }
      
      // Create summarizer
      const summarizer = await self.Summarizer.create({
        type: options.type || 'key-points',
        format: options.format || 'markdown',
        length: options.length || 'medium',
        outputLanguage: options.outputLanguage || 'en',
        ...options
      });
      
      // Get page content
      const pageText = document.body.innerText;
      if (pageText.length < 50) {
        throw new Error('Page content too short to summarize');
      }
      
      // Summarize
      const summary = await summarizer.summarize(pageText);
      
      return {
        title: document.title,
        url: window.location.href,
        summary: summary,
        wordCount: pageText.split(/\s+/).length
      };
      
    } catch (error) {
      throw new Error(`Summarization failed: ${error.message}`);
    }
  }
  
  // The floating icon functionality is now handled by floating-icon.js
  // which is injected separately by the background script
  
})();
