// AI Agents Module for AgenWork
// Handles all Chrome Built-in AI API interactions

class AIAgents {
  constructor() {
    this.summarizer = null;
    this.translator = null;
    this.writer = null;
    this.prompter = null;
    this.initialized = false;
  }

  // Initialize the AI Agents system
  async initialize() {
    try {
      console.log('Initializing AI Agents...');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize AI Agents:', error);
      this.initialized = false;
      return false;
    }
  }

  // Check if browser supports AI APIs
  static isSupported() {
    const hasWindow = typeof window !== 'undefined';
    const hasAI = hasWindow && 'ai' in window;
    
    // Check for Summarizer API as per Chrome documentation
    const hasSummarizer = hasWindow && ('Summarizer' in self || (hasAI && 'summarizer' in window.ai));
    
    console.log('AI Support Check:', {
      hasWindow,
      hasAI,
      hasSummarizer,
      summarizerInSelf: hasWindow && 'Summarizer' in self,
      windowAISummarizer: hasAI && 'summarizer' in window.ai,
      globalSummarizer: hasWindow && typeof window.Summarizer !== 'undefined',
      userAgent: hasWindow ? navigator.userAgent : 'N/A',
      chromeVersion: hasWindow ? this.getChromeVersion() : 'N/A'
    });
    
    return {
      summarizer: hasSummarizer,
      translator: hasAI && 'translator' in window.ai,
      writer: hasAI && 'writer' in window.ai,
      prompter: hasAI && 'languageModel' in window.ai,
      windowAI: hasAI,
      hasWindow: hasWindow
    };
  }

  // Get Chrome version for debugging
  static getChromeVersion() {
    if (typeof navigator === 'undefined') return null;
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // Summarizer Agent Implementation
  async createSummarizer(options = {}) {
    try {
      // Enhanced availability check with detailed logging
      console.log('Checking Summarizer API availability...');
      
      const support = AIAgents.isSupported();
      console.log('Browser support check:', support);
      
      if (!support.hasWindow) {
        throw new Error('Window object not available - running outside browser context');
      }
      
      if (!support.windowAI) {
        const chromeVersion = AIAgents.getChromeVersion();
        throw new Error(`Chrome Built-in AI API not available. Current Chrome version: ${chromeVersion || 'Unknown'}. Required: Chrome 128+ with AI features enabled.`);
      }
      
      if (!support.summarizer) {
        throw new Error('Summarizer API is not available in this browser. Please ensure you have Chrome 128+ and the Built-in AI APIs are enabled.');
      }

      // Check availability using the correct API pattern
      let availability;
      if ('Summarizer' in self) {
        availability = await self.Summarizer.availability();
      } else if (typeof window.Summarizer !== 'undefined') {
        availability = await window.Summarizer.availability();
      } else if (window.ai && window.ai.summarizer) {
        availability = await window.ai.summarizer.availability();
      } else {
        throw new Error('Summarizer API not found in expected locations');
      }
      console.log('Summarizer availability:', availability);

      if (availability.available === 'no') {
        throw new Error('Summarizer API is not available on this device. Please check system requirements (Chrome 128+, 16GB RAM, 22GB storage). You may also need to enable Chrome flags or join the Origin Trial.');
      }

      if (availability.available === 'after-download') {
        console.log('Summarizer model needs to be downloaded first');
      }

      // Default options for summarizer
      const defaultOptions = {
        type: 'key-points', // 'key-points', 'tldr', 'teaser', 'headline'
        format: 'markdown', // 'markdown', 'plain-text'
        length: 'medium', // 'short', 'medium', 'long'
        sharedContext: 'This is content from a web page that the user wants summarized.',
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Summarizer model download: ${(e.loaded * 100).toFixed(1)}%`);
            // Send progress update to UI
            this.notifyProgress('summarizer', e.loaded * 100);
          });
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Check for user activation requirement
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        console.warn('User activation required for Summarizer API');
      }

      console.log('Creating summarizer with options:', finalOptions);
      
      // Create summarizer using the correct API pattern
      if ('Summarizer' in self) {
        this.summarizer = await self.Summarizer.create(finalOptions);
      } else if (typeof window.Summarizer !== 'undefined') {
        this.summarizer = await window.Summarizer.create(finalOptions);
      } else if (window.ai && window.ai.summarizer) {
        this.summarizer = await window.ai.summarizer.create(finalOptions);
      } else {
        throw new Error('Summarizer API not available for creation');
      }
      
      console.log('Summarizer created successfully');
      return this.summarizer;

    } catch (error) {
      console.error('Error creating summarizer:', error);
      throw new Error(`Failed to create summarizer: ${error.message}`);
    }
  }

  // Summarize text content
  async summarizeText(text, context = '', streaming = false) {
    try {
      if (!this.summarizer) {
        await this.createSummarizer();
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for summarization');
      }

      // Clean text (remove HTML tags, excessive whitespace)
      const cleanText = this.cleanTextForSummarization(text);
      
      if (cleanText.length < 50) {
        return 'The provided text is too short to summarize effectively.';
      }

      console.log(`Summarizing text (${cleanText.length} characters)...`);

      const options = context ? { context } : {};

      if (streaming) {
        return this.summarizer.summarizeStreaming(cleanText, options);
      } else {
        const summary = await this.summarizer.summarize(cleanText, options);
        console.log('Summary generated successfully');
        return summary;
      }

    } catch (error) {
      console.error('Error during summarization:', error);
      throw new Error(`Summarization failed: ${error.message}`);
    }
  }

  // Summarize current page content
  async summarizeCurrentPage() {
    try {
      // Get current tab content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Inject content script to extract page content
      let results;
      try {
        results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractPageContentFunction
        });
      } catch (scriptError) {
        console.error('Script injection error:', scriptError);
        throw new Error(`Cannot access page content. This might be due to page restrictions or permissions. Error: ${scriptError.message}`);
      }

      if (!results || !results[0]) {
        throw new Error('No results returned from content extraction');
      }

      if (!results[0].result) {
        throw new Error('Content extraction returned empty result');
      }

      const pageData = results[0].result;
      
      if (!pageData) {
        throw new Error('Failed to extract page data');
      }

      if (pageData.error) {
        throw new Error(`Content extraction error: ${pageData.error}`);
      }
      
      if (!pageData.content || pageData.content.trim().length === 0) {
        throw new Error('No meaningful content found on this page. The page might be loading or have restricted content.');
      }

      if (pageData.content.trim().length < 50) {
        throw new Error('Page content is too short to summarize effectively.');
      }

      // Create context from page metadata
      const context = `This is content from the webpage titled "${pageData.title}" (${pageData.url}). The user wants a summary of this page.`;

      // Summarize the content
      const summary = await this.summarizeText(pageData.content, context);

      return {
        title: pageData.title,
        url: pageData.url,
        summary: summary,
        wordCount: pageData.content.split(/\s+/).length
      };

    } catch (error) {
      console.error('Error summarizing current page:', error);
      
      // Try fallback method using content script messaging
      try {
        console.log('Trying fallback content extraction method...');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
          
          if (response && response.success && response.content && response.content.content) {
            const context = `This is content from the webpage titled "${response.content.title}" (${response.content.url}). The user wants a summary of this page.`;
            const summary = await this.summarizeText(response.content.content, context);
            
            return {
              title: response.content.title,
              url: response.content.url,
              summary: summary,
              wordCount: response.content.wordCount || response.content.content.split(/\s+/).length
            };
          }
        }
      } catch (fallbackError) {
        console.error('Fallback content extraction also failed:', fallbackError);
      }
      
      throw new Error(`Failed to summarize page: ${error.message}`);
    }
  }



  // Clean text for better summarization
  cleanTextForSummarization(text) {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
      .trim();
  }

  // Notify progress to UI
  notifyProgress(agentType, progress) {
    // Send message to popup/content script about download progress
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'AI_PROGRESS',
        agentType,
        progress
      }).catch(() => {
        // Ignore errors if popup is not open
      });
    }

    // Also dispatch custom event for content scripts
    window.dispatchEvent(new CustomEvent('agenwork-ai-progress', {
      detail: { agentType, progress }
    }));
  }

  // Destroy summarizer instance
  async destroySummarizer() {
    if (this.summarizer) {
      try {
        this.summarizer.destroy();
        this.summarizer = null;
        console.log('Summarizer destroyed');
      } catch (error) {
        console.error('Error destroying summarizer:', error);
      }
    }
  }

  // Comprehensive diagnostic function
  async getDiagnostics() {
    const chromeVersion = AIAgents.getChromeVersion();
    const support = AIAgents.isSupported();
    
    const diagnostics = {
      system: {
        userAgent: navigator.userAgent,
        chromeVersion: chromeVersion,
        chromeVersionValid: chromeVersion >= 128,
        platform: navigator.platform,
        memory: navigator.deviceMemory || 'Unknown'
      },
      browserSupport: support,
      aiAPIs: {
        windowAI: 'ai' in window,
        summarizer: support.windowAI && 'summarizer' in window.ai,
        translator: support.windowAI && 'translator' in window.ai,
        writer: support.windowAI && 'writer' in window.ai,
        languageModel: support.windowAI && 'languageModel' in window.ai
      },
      availability: {},
      recommendations: []
    };

    // Check specific API availability
    if (support.windowAI) {
      try {
        if (support.summarizer) {
          const summarizerCaps = await window.ai.summarizer.capabilities();
          diagnostics.availability.summarizer = summarizerCaps;
        }
      } catch (error) {
        diagnostics.availability.summarizerError = error.message;
      }
    }

    // Generate recommendations
    if (chromeVersion < 128) {
      diagnostics.recommendations.push('Update Chrome to version 128 or higher');
    }
    
    if (!support.windowAI) {
      diagnostics.recommendations.push('Enable Chrome Built-in AI flags or join the Origin Trial');
    }
    
    if (!support.summarizer && support.windowAI) {
      diagnostics.recommendations.push('The Summarizer API may not be available in your region or Chrome build');
    }

    return diagnostics;
  }

  // Get capabilities and status of all AI agents
  async getCapabilities() {
    const support = AIAgents.isSupported();
    const capabilities = {
      summarizer: {
        supported: support.summarizer,
        available: false,
        ready: !!this.summarizer
      },
      translator: {
        supported: support.translator,
        available: false,
        ready: !!this.translator
      },
      writer: {
        supported: support.writer,
        available: false,
        ready: !!this.writer
      },
      prompter: {
        supported: support.prompter,
        available: false,
        ready: !!this.prompter
      }
    };

    // Check availability for each supported agent
    try {
      if (support.summarizer) {
        const summarizerCaps = await window.ai.summarizer.capabilities();
        capabilities.summarizer.available = summarizerCaps.available !== 'no';
      }
    } catch (error) {
      console.warn('Error checking summarizer capabilities:', error);
    }

    return capabilities;
  }

  // Cleanup method
  async cleanup() {
    await this.destroySummarizer();
    // Add cleanup for other agents when implemented
    this.initialized = false;
    console.log('AI Agents cleaned up');
  }
}

// Standalone function for page content extraction (used with chrome.scripting.executeScript)
function extractPageContentFunction() {
  try {
    // Get main content areas (don't remove scripts as this could break the page)
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
    return {
      title: document.title || 'Unknown',
      url: window.location.href || '',
      content: '',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgents;
} else {
  window.AIAgents = AIAgents;
}