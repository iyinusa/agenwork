// Summarizer Agent Module
// Handles all Chrome Built-in AI Summarizer API interactions

class SummarizerAgent {
  constructor() {
    this.summarizer = null;
    this.preferredLanguage = 'en';
  }

  // Set preferred language
  setPreferredLanguage(language) {
    const supportedLanguages = ['en', 'es', 'ja'];
    if (!supportedLanguages.includes(language)) {
      console.warn(`Language '${language}' not supported. Supported languages: ${supportedLanguages.join(', ')}. Defaulting to 'en'.`);
      this.preferredLanguage = 'en';
      return false;
    }
    
    console.log(`Setting preferred summarizer language to: ${language}`);
    this.preferredLanguage = language;
    
    // If we have active agent, we may need to recreate it with the new language
    if (this.summarizer) {
      console.log('Note: Existing summarizer will use the new language on next creation');
    }
    
    return true;
  }

  // Create summarizer instance with comprehensive availability checking
  async createSummarizer(options = {}) {
    try {
      console.log('🔍 Performing comprehensive Summarizer API availability check...');
      
      // First, check basic API availability
      if (!window.Summarizer) {
        throw new Error('Summarizer API not available in this browser. Please ensure you are using Chrome 138+ with AI features enabled.');
      }

      // Check comprehensive availability
      let availabilityResult;
      try {
        availabilityResult = await ChromeIntegration.validateAPIReadiness('Summarizer');
        console.log('✅ Summarizer comprehensive check passed:', availabilityResult);
      } catch (availabilityError) {
        console.error('❌ Summarizer availability check failed:', availabilityError);
        
        // Try direct availability check as fallback
        console.log('🔄 Attempting direct availability check...');
        try {
          const directAvailability = await window.Summarizer.availability();
          console.log('Direct availability result:', directAvailability);
          
          if (directAvailability === 'no') {
            throw new Error('Summarizer API is not available on this device. Please check system requirements: Chrome 138+, 16GB+ RAM, 22GB+ storage space.');
          }
          
          // Continue with direct availability result
          availabilityResult = {
            availability: directAvailability,
            passed: directAvailability !== 'no'
          };
        } catch (directError) {
          console.error('❌ Direct availability check also failed:', directError);
          throw new Error(`Summarizer API cannot be used: ${availabilityError.message}. Direct check error: ${directError.message}`);
        }
      }

      if (availabilityResult.availability === 'after-download') {
        console.log('📥 Summarizer model needs to be downloaded first - this may take time');
        
        // Check user activation for downloads
        if (!navigator.userActivation || !navigator.userActivation.isActive) {
          throw new Error('User interaction required for model download. Please click a button or interact with the page first.');
        }
      }

      // Build options with safe defaults
      const supportedLanguages = ['en', 'es', 'ja'];
      const safeOutputLanguage = supportedLanguages.includes(this.preferredLanguage) ? this.preferredLanguage : 'en';
      
      const defaultOptions = {
        type: 'key-points', // 'key-points', 'tldr', 'teaser', 'headline'
        format: 'markdown', // 'markdown', 'plain-text'
        length: 'medium', // 'short', 'medium', 'long'
        outputLanguage: safeOutputLanguage, // REQUIRED: Must be 'en', 'es', or 'ja'
        sharedContext: 'This is content from a web page that the user wants summarized.',
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Summarizer model download: ${(e.loaded * 100).toFixed(1)}%`);
            // Send progress update to UI
            if (typeof AIUtils !== 'undefined' && AIUtils.notifyProgress) {
              AIUtils.notifyProgress('summarizer', e.loaded * 100);
            }
          });
        }
      };

      // Merge with user options, but ensure critical fields are safe
      const finalOptions = { ...defaultOptions, ...options };
      
      // Force safe outputLanguage if user provided invalid one
      if (!finalOptions.outputLanguage || !supportedLanguages.includes(finalOptions.outputLanguage)) {
        console.warn(`⚠️ Invalid outputLanguage '${finalOptions.outputLanguage}', using '${safeOutputLanguage}'`);
        finalOptions.outputLanguage = safeOutputLanguage;
      }

      console.log('🛠️ Creating summarizer with options:', finalOptions);
      
      // Create summarizer with timeout protection
      const createPromise = window.Summarizer.create(finalOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Summarizer creation timeout after 120 seconds')), 120000)
      );
      
      this.summarizer = await Promise.race([createPromise, timeoutPromise]);
      
      if (!this.summarizer) {
        throw new Error('Summarizer creation returned null or undefined');
      }
      
      console.log('✅ Summarizer created successfully');
      return this.summarizer;

    } catch (error) {
      console.error('💥 Error creating summarizer:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to create summarizer: ';
      
      if (error.message.includes('not available on this device')) {
        userMessage += 'The Summarizer API is not available on your device. Please ensure you have Chrome 138+ with sufficient system resources (16GB+ RAM, 22GB+ storage).';
      } else if (error.message.includes('User interaction required')) {
        userMessage += 'User interaction is required for model download. Please click a button or interact with the page first.';
      } else if (error.message.includes('timeout')) {
        userMessage += 'The request timed out. The AI model may be downloading in the background. Please try again in a moment.';
      } else if (error.message.includes('No output language') || error.message.includes('outputLanguage')) {
        userMessage += 'Invalid language configuration. Please check your language settings.';
      } else {
        userMessage += error.message;
      }
      
      throw new Error(userMessage);
    }
  }

  // Summarize text content
  async summarizeText(text, context = '', intentResult = null) {
    try {
      console.log('📝 Starting text summarization...');
      
      // Validate input text
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('No valid text provided for summarization');
      }

      // Clean and prepare text
      let cleanText;
      try {
        cleanText = (typeof AIUtils !== 'undefined' && AIUtils.cleanTextForSummarization) 
          ? AIUtils.cleanTextForSummarization(text)
          : text.trim();
      } catch (cleanError) {
        console.warn('⚠️ Text cleaning failed, using raw text:', cleanError);
        cleanText = text.trim();
      }
      
      if (cleanText.length < 50) {
        return 'The provided text is too short to summarize effectively (minimum 50 characters required).';
      }

      if (cleanText.length > 100000) {
        console.log('⚠️ Text is very long, truncating to 100,000 characters');
        cleanText = cleanText.substring(0, 100000) + '...';
      }

      // Prepare summarization options
      const supportedLanguages = ['en', 'es', 'ja'];
      let outputLanguage;
      
      try {
        outputLanguage = (typeof AIUtils !== 'undefined' && AIUtils.getOutputLanguage) 
          ? await AIUtils.getOutputLanguage(this.preferredLanguage)
          : this.preferredLanguage || 'en';
      } catch (langError) {
        console.warn('⚠️ Error getting output language, using default:', langError);
        outputLanguage = 'en';
      }
      
      const finalOutputLanguage = supportedLanguages.includes(outputLanguage) ? outputLanguage : 'en';
      
      const summaryOptions = {
        type: intentResult?.summarization_type || intentResult?.summarizationType || 'key-points',
        length: intentResult?.summarization_length || intentResult?.summarizationLength || 'medium',
        format: 'markdown',
        outputLanguage: finalOutputLanguage, // REQUIRED: Must be one of 'en', 'es', 'ja'
        sharedContext: context || 'Please summarize this text'
      };

      console.log(`🎯 Summarizing ${cleanText.length} characters with options:`, summaryOptions);

      // Create or recreate summarizer with intelligent options
      let summarizer;
      try {
        summarizer = await this.createSummarizer(summaryOptions);
      } catch (createError) {
        console.error('❌ Failed to create summarizer:', createError);
        throw new Error(`Cannot create summarizer: ${createError.message}`);
      }

      if (!summarizer) {
        throw new Error('Summarizer creation returned null - API may not be available');
      }

      // Perform summarization with timeout
      let summary;
      try {
        const summaryPromise = summarizer.summarize(cleanText, context ? { context } : {});
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Summarization timeout after 60 seconds')), 60000)
        );
        
        summary = await Promise.race([summaryPromise, timeoutPromise]);
        
        if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
          throw new Error('Summarization returned empty or invalid result');
        }
        
        console.log('✅ Text summarization completed successfully');
        
      } catch (summaryError) {
        console.error('❌ Summarization API call failed:', summaryError);
        throw new Error(`AI summarization failed: ${summaryError.message}`);
      } finally {
        // Always clean up the summarizer
        try {
          if (summarizer && typeof summarizer.destroy === 'function') {
            summarizer.destroy();
          }
        } catch (destroyError) {
          console.warn('⚠️ Error destroying summarizer:', destroyError);
        }
      }
      
      return summary;

    } catch (error) {
      console.error('💥 Error during text summarization:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Summarization failed: ';
      
      if (error.message.includes('No valid text')) {
        userMessage += 'No text was provided to summarize.';
      } else if (error.message.includes('too short')) {
        userMessage += 'The text is too short to summarize effectively.';
      } else if (error.message.includes('Cannot create summarizer')) {
        userMessage += 'The AI summarization service is not available. Please check your browser support.';
      } else if (error.message.includes('timeout')) {
        userMessage += 'The summarization request timed out. Please try again with shorter text.';
      } else if (error.message.includes('API may not be available')) {
        userMessage += 'The AI summarization API is not available in your browser. Please ensure you have Chrome 138+ with AI features enabled.';
      } else {
        userMessage += error.message;
      }
      
      throw new Error(userMessage);
    }
  }

  // Summarize current page content
  async summarizeCurrentPage(intentAnalysis = null) {
    try {
      console.log('📄 Starting page summarization...');
      console.log('📊 Intent analysis for page summarization:', {
        type: intentAnalysis?.summarizationType || intentAnalysis?.summarization_type,
        length: intentAnalysis?.summarizationLength || intentAnalysis?.summarization_length
      });
      
      // Extract page content
      let pageData;
      try {
        pageData = await ChromeIntegration.extractCurrentPageContent();
        console.log(`✅ Extracted page content: ${pageData.content.length} characters from "${pageData.title}"`);
      } catch (extractError) {
        console.error('❌ Failed to extract page content:', extractError);
        throw new Error(`Could not extract page content: ${extractError.message}`);
      }

      // Validate content
      if (!pageData.content || pageData.content.trim().length === 0) {
        throw new Error('The current page has no content to summarize. The page may be empty or restricted.');
      }

      if (pageData.content.trim().length < 100) {
        throw new Error('The current page content is too short to summarize effectively (less than 100 characters).');
      }

      // Create enhanced context from page metadata and intent analysis
      let context = `This is content from the webpage titled "${pageData.title}" (${pageData.url}). The user wants a summary of this page.`;
      
      // Add intent-specific context if available
      if (intentAnalysis) {
        const summaryType = intentAnalysis.summarizationType || intentAnalysis.summarization_type;
        const summaryLength = intentAnalysis.summarizationLength || intentAnalysis.summarization_length;
        
        if (summaryType || summaryLength) {
          context += ` The user specifically requested a ${summaryLength || 'medium'} length summary`;
          if (summaryType) {
            const typeDescriptions = {
              'key-points': 'in key points format',
              'tldr': 'as a quick TLDR',
              'teaser': 'as an intriguing teaser',
              'headline': 'as a headline or title'
            };
            context += ` ${typeDescriptions[summaryType] || `in ${summaryType} format`}`;
          }
          context += '.';
        }
      }

      // Summarize the content with intent analysis passed through
      let summary;
      try {
        console.log('📝 Starting text summarization with intelligent parameters...');
        summary = await this.summarizeText(pageData.content, context, intentAnalysis);
        console.log('✅ Page summarization completed successfully');
      } catch (summaryError) {
        console.error('❌ Text summarization failed:', summaryError);
        throw new Error(`Summarization failed: ${summaryError.message}`);
      }

      return {
        title: pageData.title,
        url: pageData.url,
        summary: summary,
        wordCount: pageData.content.split(/\s+/).length,
        characterCount: pageData.content.length
      };

    } catch (error) {
      console.error('💥 Error in page summarization:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to summarize page: ';
      
      if (error.message.includes('Cannot access')) {
        userMessage += 'Cannot access this page content. This may be a restricted page (like chrome:// pages) or a permission issue.';
      } else if (error.message.includes('too short')) {
        userMessage += 'The page content is too short to summarize effectively.';
      } else if (error.message.includes('no content')) {
        userMessage += 'The page appears to be empty or has no readable content.';
      } else if (error.message.includes('Summarizer API')) {
        userMessage += 'The AI summarization service is not available. Please check your browser support and try again.';
      } else {
        userMessage += error.message;
      }
      
      throw new Error(userMessage);
    }
  }

  // Destroy summarizer instance
  async destroy() {
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

  // Get summarizer capabilities with comprehensive checking
  async getCapabilities() {
    try {
      // Use comprehensive availability checking
      const comprehensiveResult = await ChromeIntegration.checkComprehensiveAvailability('Summarizer');
      
      const capabilities = {
        supported: comprehensiveResult.supported,
        availability: comprehensiveResult.availability,
        available: comprehensiveResult.availability !== 'no',
        ready: comprehensiveResult.ready,
        passed: comprehensiveResult.passed,
        instanceReady: !!this.summarizer,
        error: comprehensiveResult.error,
        details: comprehensiveResult.details,
        lastChecked: comprehensiveResult.timestamp
      };

      console.log('Summarizer capabilities (comprehensive check):', capabilities);
      return capabilities;

    } catch (error) {
      console.error('Error checking summarizer capabilities:', error);
      return {
        supported: false,
        availability: 'no',
        available: false,
        ready: false,
        passed: false,
        instanceReady: !!this.summarizer,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  // Diagnostic method to identify specific issues
  async diagnose() {
    console.log('🔍 Running Summarizer Agent Diagnostics...');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {},
      api: {},
      capabilities: {},
      issues: [],
      recommendations: []
    };

    // Environment checks
    diagnostics.environment = {
      hasWindow: typeof window !== 'undefined',
      hasNavigator: typeof navigator !== 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      chromeVersion: ChromeIntegration.getChromeVersion(),
      userActivation: navigator.userActivation ? navigator.userActivation.isActive : false
    };

    // API availability checks
    diagnostics.api = {
      windowSummarizer: typeof window.Summarizer !== 'undefined',
      summarizerType: window.Summarizer ? typeof window.Summarizer : 'undefined',
      hasCreate: window.Summarizer && typeof window.Summarizer.create === 'function',
      hasAvailability: window.Summarizer && typeof window.Summarizer.availability === 'function'
    };

    // Try direct availability check
    if (diagnostics.api.hasAvailability) {
      try {
        const directAvailability = await window.Summarizer.availability();
        diagnostics.api.directAvailability = directAvailability;
      } catch (availError) {
        diagnostics.api.directAvailabilityError = availError.message;
      }
    }

    // Comprehensive capabilities check
    try {
      diagnostics.capabilities = await this.getCapabilities();
    } catch (capError) {
      diagnostics.capabilities = { error: capError.message };
    }

    // Identify issues
    if (!diagnostics.environment.hasWindow) {
      diagnostics.issues.push('Window object not available - not running in browser');
    }

    if (diagnostics.environment.chromeVersion < 138) {
      diagnostics.issues.push(`Chrome version ${diagnostics.environment.chromeVersion} is too old (need 138+)`);
      diagnostics.recommendations.push('Update Chrome to version 138 or higher');
    }

    if (!diagnostics.api.windowSummarizer) {
      diagnostics.issues.push('window.Summarizer is not available');
      diagnostics.recommendations.push('Enable Chrome AI flags or join Origin Trial');
    }

    if (diagnostics.api.directAvailability === 'no') {
      diagnostics.issues.push('Summarizer API reports not available on this device');
      diagnostics.recommendations.push('Check system requirements: 16GB+ RAM, 22GB+ storage');
    }

    if (!diagnostics.environment.userActivation) {
      diagnostics.issues.push('User activation required for model downloads');
      diagnostics.recommendations.push('Click a button or interact with the page first');
    }

    console.log('🔍 Summarizer Diagnostics Complete:', diagnostics);
    return diagnostics;
  }

  // Quick test method for summarizer functionality
  async testSummarizer() {
    try {
      console.log('🧪 Testing Summarizer Agent...');
      
      // Run diagnostics first
      const diagnostics = await this.diagnose();
      
      const capabilities = await this.getCapabilities();
      console.log('✓ Capabilities Check:', capabilities);
      
      if (!capabilities.supported) {
        throw new Error('Summarizer API not supported in this browser. Check diagnostics for details.');
      }

      if (!capabilities.available) {
        throw new Error('Summarizer API not available on this device. Check diagnostics for details.');
      }

      // Test simple summarization
      const testText = 'This is a test article about artificial intelligence and machine learning. AI has been transforming various industries by providing intelligent solutions to complex problems. Machine learning algorithms can analyze large datasets and make predictions based on patterns in the data. These technologies are becoming increasingly important in our daily lives.';
      
      console.log('🔄 Attempting test summarization...');
      const summary = await this.summarizeText(testText, 'Test summarization context');
      
      console.log('✓ Summarization Test Results:');
      console.log(`  Original length: ${testText.length} characters`);
      console.log(`  Summary: "${summary}"`);
      
      return {
        success: true,
        capabilities: capabilities,
        diagnostics: diagnostics,
        testSummary: summary
      };

    } catch (error) {
      console.error('❌ Summarizer test failed:', error);
      
      // Include diagnostics in failure result
      let diagnostics = null;
      try {
        diagnostics = await this.diagnose();
      } catch (diagError) {
        console.error('❌ Could not run diagnostics:', diagError);
      }
      
      return {
        success: false,
        error: error.message,
        diagnostics: diagnostics
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SummarizerAgent;
} else if (typeof window !== 'undefined') {
  window.SummarizerAgent = SummarizerAgent;
}