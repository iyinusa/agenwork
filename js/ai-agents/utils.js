// AI Agents Utilities Module
// Shared utility functions for AI agents

class AIUtils {
  // Debug logging with timestamps
  static debugLog(module, method, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${module}:${method}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Error logging with stack traces
  static errorLog(module, method, error, context = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${module}:${method}] ERROR:`, error);
    
    if (context) {
      console.error('Context:', context);
    }
    
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
  // Clean text for better summarization
  static cleanTextForSummarization(text) {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
      .trim();
  }

  // Clean text for better translation
  static cleanTextForTranslation(text) {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove excessive newlines
      .trim();
  }

  // Get supported languages for AI operations
  static getSupportedLanguages() {
    return {
      summarizer: ['en', 'es', 'ja'],
      languageModel: ['en', 'ja', 'es'], // Based on Chrome documentation
      translator: ['auto-detect'], // Dynamic language detection
      writer: ['en', 'ja', 'es']
    };
  }

  // Extract target language from user prompt
  static extractTargetLanguage(prompt, defaultLang = 'en') {
    const languageMap = {
      'spanish': 'es', 'español': 'es',
      'french': 'fr', 'français': 'fr',
      'german': 'de', 'deutsch': 'de',
      'italian': 'it', 'italiano': 'it',
      'portuguese': 'pt', 'português': 'pt',
      'russian': 'ru', 'русский': 'ru',
      'japanese': 'ja', '日本語': 'ja',
      'korean': 'ko', '한국어': 'ko',
      'chinese': 'zh', '中文': 'zh',
      'arabic': 'ar', 'العربية': 'ar',
      'hindi': 'hi', 'हिन्दी': 'hi',
      'turkish': 'tr', 'türkçe': 'tr',
      'polish': 'pl', 'polski': 'pl',
      'dutch': 'nl', 'nederlands': 'nl',
      'swedish': 'sv', 'svenska': 'sv',
      'danish': 'da', 'dansk': 'da',
      'norwegian': 'no', 'norsk': 'no',
      'finnish': 'fi', 'suomi': 'fi',
      'english': 'en'
    };

    const lowerPrompt = prompt.toLowerCase();
    
    // Look for language names in the prompt
    for (const [langName, langCode] of Object.entries(languageMap)) {
      if (lowerPrompt.includes(langName)) {
        console.log(`Detected target language: ${langName} (${langCode})`);
        return langCode;
      }
    }

    // Look for common patterns like "to Spanish", "into French", etc.
    const patterns = [
      /(?:to|into|in)\s+(\w+)/i,
      /translate.*?(?:to|into|in)\s+(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = lowerPrompt.match(pattern);
      if (match) {
        const detectedLang = match[1].toLowerCase();
        if (languageMap[detectedLang]) {
          console.log(`Detected target language from pattern: ${detectedLang} (${languageMap[detectedLang]})`);
          return languageMap[detectedLang];
        }
      }
    }

    // Default to provided default language
    console.log(`No target language detected, using default: ${defaultLang}`);
    return defaultLang;
  }

  // Notify progress to UI
  static notifyProgress(agentType, progress) {
    console.log(`${agentType} download progress: ${progress.toFixed(1)}%`);
    
    // Send progress to background script if available
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'AI_PROGRESS',
          agentType: agentType,
          progress: progress
        });
      } catch (error) {
        console.warn('Could not send progress to background script:', error);
      }
    }
    
    // Dispatch custom event for local listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-progress', {
        detail: { agentType, progress }
      }));
    }

    // Also dispatch custom event for content scripts
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agenwork-ai-progress', {
        detail: { agentType, progress }
      }));
    }
  }

  // Get supported languages for Chrome Built-in AI APIs
  static getSupportedLanguages() {
    return ['en', 'es', 'ja'];
  }

  // Get output language from Chrome storage or fallback
  static async getOutputLanguage(fallbackLanguage = 'en') {
    // Get supported languages
    const supportedLanguages = AIUtils.getSupportedLanguages();
    
    // First try to get from Chrome storage (popup settings)
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['aiLanguage']);
        if (result.aiLanguage && supportedLanguages.includes(result.aiLanguage)) {
          return result.aiLanguage;
        } else if (result.aiLanguage) {
          console.warn(`Unsupported AI language '${result.aiLanguage}' from storage. Supported: ${supportedLanguages.join(', ')}. Using fallback.`);
        }
      }
    } catch (error) {
      console.warn('Could not get language from storage:', error);
    }
    
    // Ensure fallback language is supported
    const validFallback = supportedLanguages.includes(fallbackLanguage) ? fallbackLanguage : 'en';
    if (fallbackLanguage !== validFallback) {
      console.warn(`Unsupported fallback language '${fallbackLanguage}'. Using 'en' instead.`);
    }
    
    return validFallback;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIUtils;
} else if (typeof window !== 'undefined') {
  window.AIUtils = AIUtils;
}