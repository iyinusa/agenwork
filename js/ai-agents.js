// AI Agents Compatibility Layer
// Forwards to the new modular system in js/ai-agents/

console.log('AI Agents: Loading compatibility layer...');

// Compatibility class that forwards to the modular system
if (typeof window !== 'undefined') {
  // Create a temporary compatibility class until modular system loads
  class AIAgentsCompatibility {
    constructor() {
      this.initialized = false;
      this.preferredLanguage = 'en';
    }

    // Instance methods
    async initialize() {
      // Wait for modular system to load with retry logic
      let retries = 0;
      const maxRetries = 50; // 5 seconds max wait
      
      while (retries < maxRetries) {
        if (window.AIAgents && window.AIAgents !== AIAgentsCompatibility) {
          // Replace with actual implementation
          const realInstance = new window.AIAgents();
          realInstance.setPreferredLanguage(this.preferredLanguage);
          await realInstance.initialize();
          
          // Copy all methods to this instance
          Object.setPrototypeOf(this, window.AIAgents.prototype);
          Object.assign(this, realInstance);
          
          return true;
        }
        
        // Wait 100ms before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      console.warn('AI Agents: Modular system not loaded after 5 seconds');
      return false;
    }

    setPreferredLanguage(language) {
      this.preferredLanguage = language;
      
      // Forward to real implementation if available
      if (window.aiAgents && window.aiAgents.setPreferredLanguage && window.aiAgents !== this) {
        return window.aiAgents.setPreferredLanguage(language);
      }
      
      console.log(`AI Agents: Language preference set to ${language} (pending modular system)`);
      return true;
    }

    // Proxy method to handle any missing methods
    _proxyMethod(methodName, ...args) {
      // Forward to real implementation if available
      if (window.aiAgents && window.aiAgents[methodName] && window.aiAgents !== this) {
        return window.aiAgents[methodName](...args);
      }
      
      console.warn(`AI Agents: Method ${methodName} called before modular system loaded`);
      return Promise.resolve(null);
    }

    // Common methods that might be called
    async summarizeText(...args) { return this._proxyMethod('summarizeText', ...args); }
    async translateText(...args) { return this._proxyMethod('translateText', ...args); }
    async detectLanguage(...args) { return this._proxyMethod('detectLanguage', ...args); }
    async generatePrompt(...args) { return this._proxyMethod('generatePrompt', ...args); }
    async getCapabilities(...args) { return this._proxyMethod('getCapabilities', ...args); }

    // Static methods
    static isSupported() {
      // Forward to real implementation if available
      if (window.AIAgents && window.AIAgents.isSupported && window.AIAgents !== AIAgentsCompatibility) {
        return window.AIAgents.isSupported();
      }
      
      // Fallback check
      if (typeof window.ai !== 'undefined') {
        return {
          summarizer: !!window.ai.summarizer,
          translator: !!window.ai.translator,
          languageModel: !!window.ai.languageModel,
          writer: !!window.ai.writer || false
        };
      }
      
      return {
        summarizer: false,
        translator: false,
        languageModel: false,
        writer: false
      };
    }

    static getChromeVersion() {
      if (window.AIAgents && window.AIAgents.getChromeVersion && window.AIAgents !== AIAgentsCompatibility) {
        return window.AIAgents.getChromeVersion();
      }
      
      const userAgent = navigator.userAgent;
      const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
      return match ? match[1] : 'Unknown';
    }
  }

  // Set up the compatibility layer
  window.AIAgents = AIAgentsCompatibility;
  window.aiAgents = new AIAgentsCompatibility();
  
  console.log('AI Agents: Compatibility layer ready with forwarding support');
}

// Page content extraction function (backward compatibility)
function extractPageContentFunction() {
  try {
    let content = '';
    let title = document.title || '';
    let url = window.location.href || '';

    // Try main content selectors
    const selectors = ['main', 'article', '.content', '#content'];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.innerText || '';
        if (content.trim().length > 200) break;
      }
    }

    // Fallback to body
    if (!content || content.trim().length < 100) {
      content = document.body.innerText || '';
    }

    // Clean content
    content = content.replace(/\s+/g, ' ').trim();
    if (content.length > 50000) {
      content = content.substring(0, 50000) + '...';
    }

    return {
      title,
      url,
      content,
      timestamp: new Date().toISOString(),
      wordCount: content.split(/\s+/).length
    };
  } catch (error) {
    return {
      title: document.title || '',
      url: window.location.href || '',
      content: '',
      error: error.message
    };
  }
}
