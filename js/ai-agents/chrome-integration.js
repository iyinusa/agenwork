// Chrome Integration Utilities for AI Agents
// Handles Chrome-specific functionality and environment checks

class ChromeIntegration {
  // Check if browser supports AI APIs (Updated for Chrome 138+ Built-in AI APIs)
  static isSupported() {
    const hasWindow = typeof window !== 'undefined';
    
    // Check for AI APIs directly as global objects according to Chrome Built-in AI documentation
    const hasSummarizer = hasWindow && 'Summarizer' in window;
    const hasLanguageModel = hasWindow && 'LanguageModel' in window;
    const hasTranslator = hasWindow && 'Translator' in window;
    const hasLanguageDetector = hasWindow && 'LanguageDetector' in window;
    const hasWriter = hasWindow && 'Writer' in window;
    
    console.log('AI Support Check (Chrome Built-in AI):', {
      hasWindow,
      hasSummarizer,
      hasLanguageModel,
      hasTranslator,
      hasLanguageDetector,
      hasWriter,
      summarizerType: hasWindow && window.Summarizer ? typeof window.Summarizer : 'not found',
      languageModelType: hasWindow && window.LanguageModel ? typeof window.LanguageModel : 'not found',
      translatorType: hasWindow && window.Translator ? typeof window.Translator : 'not found',
      languageDetectorType: hasWindow && window.LanguageDetector ? typeof window.LanguageDetector : 'not found',
      userAgent: hasWindow ? navigator.userAgent : 'N/A',
      chromeVersion: hasWindow ? this.getChromeVersion() : 'N/A'
    });
    
    return {
      summarizer: hasSummarizer,
      translator: hasTranslator,
      languageDetector: hasLanguageDetector,
      writer: hasWriter,
      prompter: hasLanguageModel, // Prompt API uses LanguageModel
      hasWindow: hasWindow
    };
  }

  // Get Chrome version for debugging (Enhanced for better detection)
  static getChromeVersion() {
    if (typeof navigator === 'undefined') return null;
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    if (!match) return null;
    
    const version = parseInt(match[1]);
    console.log(`Detected Chrome version: ${version}`);
    return version;
  }

  // Check if the current Chrome version supports Built-in AI APIs
  static isChromeVersionSupported() {
    const version = this.getChromeVersion();
    return version && version >= 138;
  }

  // Generate helpful error messages based on Chrome version and API availability
  static generateHelpfulErrorMessage(apiName, error) {
    const chromeVersion = this.getChromeVersion();
    const isVersionSupported = this.isChromeVersionSupported();
    
    let message = `## ${apiName} API Error\n\n`;
    
    if (!chromeVersion) {
      message += "❌ **Not using Chrome**: This extension requires Google Chrome with built-in AI APIs.\n\n";
      message += "**Solution**: Please use Google Chrome browser.\n\n";
    } else if (!isVersionSupported) {
      message += `❌ **Chrome version too old**: Current version ${chromeVersion}, required 138+\n\n`;
      message += "**Solution**: Update Chrome to the latest version.\n\n";
    } else {
      message += `✅ **Chrome version**: ${chromeVersion} (supported)\n\n`;
      message += "❌ **API not available**: The AI APIs may not be enabled.\n\n";
      message += "**Solutions**:\n";
      message += "1. Enable Chrome AI flags at `chrome://flags/`\n";
      message += "2. Check `chrome://on-device-internals` for model status\n";
      message += "3. Ensure sufficient storage (22GB+ free space)\n";
      message += "4. Ensure sufficient RAM (16GB+)\n\n";
    }
    
    message += `**Technical Error**: ${error.message}\n\n`;
    message += "**Need Help?** Check the extension's README for detailed setup instructions.";
    
    return message;
  }

  // Comprehensive AI Model Availability Check - checks all three states: Supported, Availability, Ready
  static async checkComprehensiveAvailability(apiName, checkOptions = {}) {
    console.log(`Performing comprehensive availability check for ${apiName}...`);
    
    const result = {
      apiName,
      supported: false,
      availability: 'no',
      ready: false,
      passed: false,
      error: null,
      details: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Step 1: Check if API is Supported (exists in window)
      const support = ChromeIntegration.isSupported();
      const apiKey = apiName.toLowerCase();
      
      if (!support.hasWindow) {
        throw new Error('Window object not available - running outside browser context');
      }

      result.supported = support[apiKey] || false;
      result.details.windowObjectExists = apiName in window;
      result.details.supportCheckResult = support[apiKey];

      if (!result.supported) {
        result.error = `${apiName} API is not supported in this browser`;
        return result;
      }

      // Step 2: Check Availability status
      console.log(`Checking ${apiName} availability status...`);
      let availability;
      
      switch (apiName) {
        case 'Summarizer':
          availability = await window.Summarizer.availability();
          break;
        case 'LanguageModel':
          // For LanguageModel, we need default options to check availability properly
          let modelParams;
          try {
            modelParams = await window.LanguageModel.params();
          } catch (error) {
            console.warn('Could not get LanguageModel params for availability check:', error);
            modelParams = {defaultTopK: 3, defaultTemperature: 1};
          }
          
          const languageModelOptions = checkOptions.languageModelOptions || {
            temperature: modelParams.defaultTemperature || 1,
            topK: modelParams.defaultTopK || 3
          };
          
          availability = await window.LanguageModel.availability(languageModelOptions);
          break;
        case 'Translator':
          const translatorOptions = checkOptions.translatorOptions || {
            sourceLanguage: 'en',
            targetLanguage: 'es'
          };
          availability = await window.Translator.availability(translatorOptions);
          break;
        case 'Writer':
          availability = await window.Writer.availability();
          break;
        case 'LanguageDetector':
          availability = await window.LanguageDetector.availability();
          break;
        default:
          throw new Error(`Unknown API: ${apiName}`);
      }
      
      result.availability = availability;
      result.details.availabilityStatus = availability;

      if (availability === 'no') {
        result.error = `${apiName} API is not available on this device`;
        return result;
      }

      // Step 3: Check Ready state (availability === 'readily')
      result.ready = availability === 'readily';
      result.details.readyStatus = result.ready;
      result.details.needsDownload = availability === 'after-download';

      // Step 4: Determine if all checks passed
      // According to Chrome documentation, both 'readily' and 'after-download' states are usable
      result.passed = result.supported && (result.availability === 'readily' || result.availability === 'after-download');
      
      console.log(`${apiName} comprehensive check result:`, {
        supported: result.supported,
        availability: result.availability,
        ready: result.ready,
        passed: result.passed
      });

      return result;

    } catch (error) {
      console.error(`Error during comprehensive availability check for ${apiName}:`, error);
      result.error = error.message;
      result.details.exception = error.name;
      return result;
    }
  }

  // Check if the current context supports AI APIs with comprehensive validation
  static async checkEnvironment() {
    const results = {
      chromeVersion: ChromeIntegration.getChromeVersion(),
      isChromeVersionSupported: ChromeIntegration.isChromeVersionSupported(),
      userActivation: navigator.userActivation ? navigator.userActivation.isActive : false,
      apis: {},
      comprehensive: {},
      summary: {
        totalAPIs: 0,
        supportedAPIs: 0,
        readyAPIs: 0,
        passedAPIs: 0
      },
      recommendations: []
    };

    // List of APIs to check comprehensively
    const apisToCheck = ['Summarizer', 'LanguageModel', 'Translator', 'Writer'];
    
    // Perform comprehensive checks for each API
    for (const apiName of apisToCheck) {
      const checkOptions = apiName === 'Translator' ? {
        translatorOptions: { sourceLanguage: 'en', targetLanguage: 'es' }
      } : {};
      
      const comprehensiveResult = await ChromeIntegration.checkComprehensiveAvailability(apiName, checkOptions);
      results.comprehensive[apiName.toLowerCase()] = comprehensiveResult;
      
      // Legacy format for backward compatibility
      const legacyKey = apiName === 'LanguageModel' ? 'languageModel' : apiName.toLowerCase();
      results.apis[legacyKey] = {
        supported: comprehensiveResult.supported,
        availability: comprehensiveResult.availability,
        ready: comprehensiveResult.ready,
        error: comprehensiveResult.error
      };
      
      // Update summary counts
      results.summary.totalAPIs++;
      if (comprehensiveResult.supported) results.summary.supportedAPIs++;
      if (comprehensiveResult.ready) results.summary.readyAPIs++;
      if (comprehensiveResult.passed) results.summary.passedAPIs++;
      
      // Log comprehensive check result for debugging
      console.log(`${apiName} comprehensive check:`, {
        supported: comprehensiveResult.supported,
        availability: comprehensiveResult.availability,
        ready: comprehensiveResult.ready,
        passed: comprehensiveResult.passed,
        error: comprehensiveResult.error
      });
    }

    // Check LanguageDetector separately (may not be available in all builds)
    try {
      if ('LanguageDetector' in window) {
        const langDetectorResult = await ChromeIntegration.checkComprehensiveAvailability('LanguageDetector');
        results.comprehensive.languagedetector = langDetectorResult;
        results.apis.languageDetector = {
          supported: langDetectorResult.supported,
          availability: langDetectorResult.availability,
          ready: langDetectorResult.ready,
          error: langDetectorResult.error
        };
      } else {
        results.apis.languageDetector = { supported: false };
        results.comprehensive.languagedetector = {
          apiName: 'LanguageDetector',
          supported: false,
          availability: 'no',
          ready: false,
          passed: false,
          error: 'LanguageDetector API not found in window'
        };
      }
    } catch (error) {
      console.warn('LanguageDetector check failed:', error);
      results.apis.languageDetector = { supported: false, error: error.message };
    }

    // Generate comprehensive recommendations
    if (!results.isChromeVersionSupported) {
      results.recommendations.push('Update Chrome to version 138 or later for Chrome Built-in AI API support');
    }
    
    if (!results.userActivation) {
      results.recommendations.push('User interaction required - click a button or interact with the page first');
    }

    if (results.summary.supportedAPIs === 0) {
      results.recommendations.push('No AI APIs are supported. Enable Chrome Built-in AI flags or update Chrome');
      results.recommendations.push('Visit chrome://flags/ and search for "Built-in AI" or "Gemini Nano"');
    } else if (results.summary.passedAPIs === 0 && results.summary.supportedAPIs > 0) {
      results.recommendations.push('AI APIs are supported but not usable. Check availability status');
      results.recommendations.push('Check chrome://on-device-internals/ for model download status');
      results.recommendations.push('Ensure sufficient storage (22GB+) and RAM (16GB+) are available');
    } else if (results.summary.passedAPIs < results.summary.supportedAPIs) {
      results.recommendations.push(`${results.summary.passedAPIs}/${results.summary.supportedAPIs} supported APIs are usable`);
      results.recommendations.push('Some models may be in "no" availability state or have errors');
    } else if (results.summary.passedAPIs > 0) {
      results.recommendations.push(`✅ ${results.summary.passedAPIs} API(s) are ready to use!`);
      if (results.summary.readyAPIs < results.summary.passedAPIs) {
        results.recommendations.push('Some APIs may require model downloads on first use');
      }
    }

    // Add system requirements reminder if no APIs are working
    if (results.summary.passedAPIs === 0) {
      results.recommendations.push('System Requirements: Chrome 138+, 16GB+ RAM, 22GB+ storage');
      results.recommendations.push('Check chrome://on-device-internals/ for detailed model status');
    }

    console.log('Environment check summary:', results.summary);
    return results;
  }

  // Validate that an API passes all three checks before use
  static async validateAPIReadiness(apiName, options = {}) {
    // For LanguageModel, ensure we have proper options
    if (apiName === 'LanguageModel' && !options.languageModelOptions) {
      try {
        const modelParams = await window.LanguageModel.params();
        options.languageModelOptions = {
          temperature: modelParams.defaultTemperature || 1,
          topK: modelParams.defaultTopK || 3
        };
      } catch (error) {
        console.warn('Could not get model params for validation, using defaults');
        options.languageModelOptions = {
          temperature: 1,
          topK: 3
        };
      }
    }
    
    const result = await ChromeIntegration.checkComprehensiveAvailability(apiName, options);
    
    if (!result.passed) {
      const reasons = [];
      if (!result.supported) reasons.push('not supported in this browser');
      if (result.availability === 'no') reasons.push('not available on this device');
      // Note: 'after-download' state is valid and usable, just needs download
      
      throw new Error(`${apiName} API cannot be used: ${reasons.join(', ')}. ${result.error || 'Check system requirements and model status.'}`);
    }
    
    return result;
  }

  // Extract page content using Chrome scripting API
  static async extractCurrentPageContent() {
    try {
      // Get current tab content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Check if we can access the page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('Cannot access Chrome internal pages or extension pages');
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
        throw new Error('Page content is too short to process effectively.');
      }

      return pageData;

    } catch (error) {
      console.error('Error extracting current page content:', error);
      
      // Try fallback method using content script messaging
      try {
        console.log('Trying fallback content extraction method...');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
          
          if (response && response.success && response.content && response.content.content) {
            return response.content;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback content extraction also failed:', fallbackError);
      }
      
      throw error;
    }
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
  module.exports = ChromeIntegration;
} else if (typeof window !== 'undefined') {
  window.ChromeIntegration = ChromeIntegration;
}