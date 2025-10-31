// Translator Agent Module
// Handles all Chrome Built-in AI Translator and Language Detection API interactions

class TranslatorAgent {
  constructor() {
    this.translator = null;
    this.preferredLanguage = 'en';
    
    // Known supported language pairs (based on Chrome Translator API documentation)
    // Most languages translate to/from English as a hub
    this.knownSupportedPairs = {
      'en': ['es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'zh-Hant', 'ar', 'hi', 'ru', 'tr', 'nl', 'pl', 'vi', 'id', 'th', 'uk', 'sv', 'cs', 'ro', 'el', 'hu', 'da', 'fi', 'no', 'sk', 'bg'],
      'es': ['en', 'fr', 'de', 'it', 'pt'],
      'fr': ['en', 'es', 'de', 'it', 'pt'],
      'de': ['en', 'es', 'fr', 'it', 'pt'],
      'it': ['en', 'es', 'fr', 'de', 'pt'],
      'pt': ['en', 'es', 'fr', 'de', 'it'],
      'ja': ['en'],
      'ko': ['en'],
      'zh': ['en'],
      'zh-Hant': ['en'],
      'ar': ['en'],
      'hi': ['en'],
      'ru': ['en'],
      'tr': ['en'],
      'nl': ['en'],
      'pl': ['en'],
      'vi': ['en'],
      'id': ['en'],
      'th': ['en'],
      'uk': ['en'],
      'sv': ['en'],
      'cs': ['en'],
      'ro': ['en'],
      'el': ['en'],
      'hu': ['en'],
      'da': ['en'],
      'fi': ['en'],
      'no': ['en'],
      'sk': ['en'],
      'bg': ['en']
    };
  }
  
  // Check if a language pair is likely supported (pre-flight check)
  isLikelySupportedPair(sourceLang, targetLang) {
    const normalizedSource = sourceLang.toLowerCase();
    const normalizedTarget = targetLang.toLowerCase();
    
    if (this.knownSupportedPairs[normalizedSource]) {
      const supported = this.knownSupportedPairs[normalizedSource].includes(normalizedTarget);
      console.log(`📋 Language pair ${sourceLang} → ${targetLang}: ${supported ? '✅ likely supported' : '⚠️ not in known list'}`);
      return supported;
    }
    
    console.log(`⚠️ Source language '${sourceLang}' not in known list - will attempt anyway`);
    return true; // Let Chrome API decide
  }

  // Set preferred language
  setPreferredLanguage(language) {
    // Get all languages that can be used as targets (all keys + all values in knownSupportedPairs)
    const allSupportedLanguages = new Set([
      ...Object.keys(this.knownSupportedPairs),
      ...Object.values(this.knownSupportedPairs).flat()
    ]);
    
    if (!allSupportedLanguages.has(language.toLowerCase())) {
      console.warn(`⚠️ Language '${language}' may not be fully supported. Defaulting to 'en'.`);
      this.preferredLanguage = 'en';
      return false;
    }
    
    console.log(`✅ Setting preferred translator language to: ${language}`);
    this.preferredLanguage = language;
    this.preferredLanguage = language;
    return true;
  }
  
  // Get Chrome version for diagnostics
  getChromeVersion() {
    if (typeof navigator === 'undefined') return null;
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // Create translator instance with comprehensive availability checking
  async createTranslator(sourceLang = 'auto', targetLang = 'en') {
    try {
      // CONTEXT VERIFICATION: Ensure we're in the correct execution context
      if (typeof window === 'undefined') {
        throw new Error('Translator API requires browser window object. This suggests execution in an invalid context (e.g., service worker without DOM access).');
      }
      
      // DETAILED DIAGNOSTIC: Check what's actually available
      const diagnosticInfo = {
        windowExists: typeof window !== 'undefined',
        translatorInWindow: 'Translator' in window,
        translatorType: typeof window.Translator,
        windowTranslator: window.Translator,
        chromeVersion: this.getChromeVersion(),
        userAgent: navigator.userAgent,
        location: window.location.href
      };
      
      console.log('🔍 Translator API Diagnostic Info:', diagnosticInfo);
      
      if (!('Translator' in window)) {
        const chromeVersion = this.getChromeVersion();
        const versionInfo = chromeVersion ? `Current version: ${chromeVersion}` : 'Chrome version could not be detected';
        
        throw new Error(
          `Translator API not available. ` +
          `${versionInfo}. ` +
          `Requirements: ` +
          `1) Chrome 138+ (Canary/Dev channel), ` +
          `2) Enable chrome://flags/#translation-api, ` +
          `3) Restart Chrome after enabling. ` +
          `Current context: ${window.location.href}`
        );
      }
      
      console.log(`🔍 Performing Translator API availability check for ${sourceLang} → ${targetLang}...`);
      console.log(`📍 Execution context: Extension page (${window.location.href})`);
      
      // Don't allow 'auto' as source language for translator creation
      if (sourceLang === 'auto') {
        throw new Error('Cannot create translator with "auto" as source language. Language must be detected first.');
      }
      
      // According to Chrome docs, we need to check with the specific language pair
      const checkOptions = {
        translatorOptions: {
          sourceLanguage: sourceLang,
          targetLanguage: targetLang
        }
      };
      
      // First do a direct availability check with the specific language pair
      console.log(`📡 Checking Translator.availability() directly for ${sourceLang} → ${targetLang}...`);
      let directAvailability;
      try {
        directAvailability = await window.Translator.availability({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang
        });
        console.log(`📊 Direct availability result: ${directAvailability}`);
      } catch (availError) {
        console.error('❌ Direct availability check failed:', availError);
        throw new Error(`Cannot check availability for ${sourceLang} → ${targetLang}: ${availError.message}`);
      }
      
      // If the language pair is not available at all, fail early
      if (directAvailability === 'no') {
        throw new Error(`The language pair ${sourceLang} → ${targetLang} is not available on this device. Chrome's AI may not support this combination yet.`);
      }
      
      // According to the test pattern, we should proceed directly to creating translator
      // after the direct availability check passes
      if (directAvailability === 'after-download') {
        console.log('⬇️ Translation model needs to be downloaded first - this may take time');
      }

      // Check for user activation requirement (required for model downloads)
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        console.info('ℹ️ Note: User activation may be required for Translator API model downloads. If you see permission errors, try clicking a button or interacting with the page first.');
      }

      // Default options for translator according to Chrome documentation
      // This matches exactly how the test creates the translator
      const translatorOptions = {
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Translation model download: ${(e.loaded * 100).toFixed(1)}%`);
            // Send progress update to UI
            if (typeof AIUtils !== 'undefined' && AIUtils.notifyProgress) {
              AIUtils.notifyProgress('translator', e.loaded * 100);
            }
          });
        }
      };

      console.log('🛠️ Creating translator with options:', translatorOptions);
      
      // Create translator using Chrome Built-in AI pattern - same as test
      // Note: Language pair availability is only known after trying to create
      this.translator = await window.Translator.create(translatorOptions);
      
      if (!this.translator) {
        throw new Error('Translator.create() returned null or undefined');
      }
      
      console.log('✅ Translator created successfully');
      return this.translator;

    } catch (error) {
      console.error('❌ Error creating translator:', error);
      
      // Provide more specific error messages based on the error
      if (error.message && error.message.includes('not available')) {
        throw new Error(`The AI translation service is not available for this language pair (${sourceLang} → ${targetLang}). This language pair may not be supported yet by Chrome's built-in AI.`);
      } else if (error.message && error.message.includes('NotSupportedError')) {
        throw new Error(`Translation is not supported in this browser for ${sourceLang} → ${targetLang}. Please check browser requirements.`);
      } else if (error.message && error.message.includes('NotAllowedError')) {
        throw new Error(`Permission denied for translation. User interaction may be required.`);
      } else {
        throw new Error(`Failed to create translator for ${sourceLang} → ${targetLang}: ${error.message}`);
      }
    }
  }

  // Create language detector instance
  async createLanguageDetector() {
    try {
      // CONTEXT VERIFICATION: Ensure we're in the correct execution context
      if (typeof window === 'undefined') {
        throw new Error('LanguageDetector API requires browser window object. This suggests execution in an invalid context.');
      }
      
      if (!('LanguageDetector' in window)) {
        throw new Error(
          'LanguageDetector API not available in this context. ' +
          'Requirements: Chrome 138+, chrome://flags/#translation-api enabled, Extension page context (not content script).'
        );
      }
      
      console.log('🔍 Checking Language Detection API availability...');
      console.log(`📍 Execution context: Extension page (${window.location.href})`);
      
      const support = ChromeIntegration.isSupported();
      if (!support.hasWindow) {
        throw new Error('Window object not available - running outside browser context');
      }
      
      // Check availability directly - same as test pattern
      const availability = await window.LanguageDetector.availability();
      console.log('📊 Language Detector availability:', availability);

      if (availability === 'no') {
        throw new Error('Language Detection API is not available on this device.');
      }

      if (availability === 'after-download') {
        console.log('⬇️ Language detection model needs to be downloaded first');
      }

      // Create language detector - same as test pattern
      const detector = await window.LanguageDetector.create({
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Language detection model download: ${(e.loaded * 100).toFixed(1)}%`);
            if (typeof AIUtils !== 'undefined' && AIUtils.notifyProgress) {
              AIUtils.notifyProgress('language-detector', e.loaded * 100);
            }
          });
        }
      });

      console.log('✅ Language detector created successfully');
      return detector;

    } catch (error) {
      console.error('❌ Error creating language detector:', error);
      throw new Error(`Failed to create language detector: ${error.message}`);
    }
  }

  // Detect language of given text
  async detectLanguage(text) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for language detection');
      }

      // Clean text for better detection
      const cleanText = AIUtils.cleanTextForTranslation(text);
      
      if (cleanText.length < 10) {
        throw new Error('Text is too short for reliable language detection (minimum 10 characters)');
      }

      console.log(`Detecting language for text (${cleanText.length} characters)...`);

      // Create language detector
      const detector = await this.createLanguageDetector();
      
      // Detect language
      const results = await detector.detect(cleanText);
      
      // Clean up
      detector.destroy();
      
      console.log('Language detection results:', results);

      if (!results || results.length === 0) {
        throw new Error('Could not detect language for the provided text');
      }

      // Return the most confident result
      const topResult = results[0];
      return {
        language: topResult.detectedLanguage,
        confidence: topResult.confidence,
        allResults: results
      };

    } catch (error) {
      console.error('Error during language detection:', error);
      throw new Error(`Language detection failed: ${error.message}`);
    }
  }

  // Translate text content
  async translateText(text, targetLang = 'en', sourceLang = 'auto', intentAnalysis = null) {
    try {
      console.log('🌐 Starting text translation...');
      console.log('📊 Intent analysis for translation:', {
        targetLang: intentAnalysis?.targetLanguage || targetLang,
        sourceLang: intentAnalysis?.sourceLanguage || sourceLang
      });

      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for translation');
      }

      // Use intent analysis parameters if available
      const finalTargetLang = intentAnalysis?.targetLanguage || targetLang || 'en';
      const finalSourceLang = intentAnalysis?.sourceLanguage || sourceLang || 'auto';

      console.log(`🎯 Final translation parameters: ${finalSourceLang} → ${finalTargetLang}`);

      // Clean text for better translation
      const cleanText = AIUtils.cleanTextForTranslation(text);
      
      if (cleanText.length < 1) {
        throw new Error('Text is too short to translate effectively');
      }

      console.log(`Translating text (${cleanText.length} characters) from ${finalSourceLang} to ${finalTargetLang}...`);

      // If source language is auto, try to detect it first
      let detectedSourceLang = finalSourceLang;
      if (finalSourceLang === 'auto') {
        try {
          console.log('🔍 Auto-detecting source language...');
          const detection = await this.detectLanguage(cleanText);
          detectedSourceLang = detection.language;
          console.log(`✅ Auto-detected source language: ${detectedSourceLang} (confidence: ${detection.confidence})`);
        } catch (detectionError) {
          console.warn('⚠️ Language detection failed, using fallback:', detectionError);
          detectedSourceLang = 'en'; // Fallback to English
        }
      }

      // Skip translation if source and target are the same
      if (detectedSourceLang === finalTargetLang) {
        console.log(`ℹ️ Source and target languages are the same (${finalTargetLang}), no translation needed`);
        return {
          originalText: cleanText,
          translatedText: cleanText,
          sourceLanguage: detectedSourceLang,
          targetLanguage: finalTargetLang,
          message: `Text is already in ${finalTargetLang}. No translation needed.`,
          skipped: true
        };
      }
      
      // Check if language pair is likely supported
      if (!this.isLikelySupportedPair(detectedSourceLang, finalTargetLang)) {
        console.warn(`⚠️ Language pair ${detectedSourceLang} → ${finalTargetLang} may not be supported by Chrome's AI`);
        throw new Error(`The language pair ${detectedSourceLang} → ${finalTargetLang} is not supported by Chrome's built-in AI. Most languages translate to/from English. Consider translating through English as an intermediate step.`);
      }

      // Create translator with the detected/specified source language
      let translator;
      try {
        console.log('🛠️ Creating translator instance...');
        translator = await this.createTranslator(detectedSourceLang, finalTargetLang);
        
        if (!translator) {
          throw new Error('Translator creation returned null or undefined');
        }
        
        console.log('✅ Translator created successfully');
      } catch (createError) {
        console.error('❌ Failed to create translator:', createError);
        throw new Error(`Cannot create translator for ${detectedSourceLang} → ${finalTargetLang}: ${createError.message}`);
      }

      console.log(`🔄 Performing translation: ${detectedSourceLang} → ${finalTargetLang}...`);

      // Perform translation with timeout protection
      let translatedText;
      try {
        const translatePromise = translator.translate(cleanText);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Translation timeout after 60 seconds')), 60000)
        );
        
        translatedText = await Promise.race([translatePromise, timeoutPromise]);
        
        if (!translatedText || typeof translatedText !== 'string' || translatedText.trim().length === 0) {
          throw new Error('Translation returned empty or invalid result');
        }
        
        console.log('✅ Translation completed successfully');
        
      } catch (translateError) {
        console.error('❌ Translation API call failed:', translateError);
        throw new Error(`AI translation failed: ${translateError.message}`);
      } finally {
        // Always clean up the translator
        try {
          if (translator && typeof translator.destroy === 'function') {
            translator.destroy();
          }
        } catch (destroyError) {
          console.warn('⚠️ Error destroying translator:', destroyError);
        }
      }

      return {
        originalText: cleanText,
        translatedText: translatedText,
        sourceLanguage: detectedSourceLang,
        targetLanguage: finalTargetLang,
        wordCount: cleanText.split(/\s+/).length,
        characterCount: cleanText.length
      };

    } catch (error) {
      console.error('💥 Error during text translation:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Translation failed: ';
      
      if (error.message.includes('No text provided')) {
        userMessage += 'No text was provided to translate.';
      } else if (error.message.includes('too short')) {
        userMessage += 'The text is too short to translate effectively.';
      } else if (error.message.includes('Cannot create translator')) {
        userMessage += 'The AI translation service is not available for this language pair. Please check your browser support.';
      } else if (error.message.includes('timeout')) {
        userMessage += 'The translation request timed out. Please try again with shorter text.';
      } else if (error.message.includes('not available') || error.message.includes('not supported')) {
        userMessage += 'The AI translation service is not available in your browser. Please ensure you have Chrome 138+ with AI features enabled.';
      } else if (error.message.includes('AI translation failed')) {
        userMessage += 'The AI translation service encountered an error. This may be due to unsupported language pairs or temporary service issues.';
      } else {
        userMessage += error.message;
      }
      
      throw new Error(userMessage);
    }
  }

  // Translate current page content
  async translateCurrentPage(targetLang = 'en', intentAnalysis = null) {
    try {
      console.log('📄 Starting page translation...');
      console.log('📊 Intent analysis for page translation:', {
        targetLang: intentAnalysis?.targetLanguage || targetLang,
        sourceLang: intentAnalysis?.sourceLanguage || 'auto'
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
        throw new Error('The current page has no content to translate. The page may be empty or restricted.');
      }

      if (pageData.content.trim().length < 10) {
        throw new Error('The current page content is too short to translate effectively (less than 10 characters).');
      }

      // For very long pages, limit content to prevent timeout
      let contentToTranslate = pageData.content;
      if (contentToTranslate.length > 10000) {
        contentToTranslate = contentToTranslate.substring(0, 10000) + '...';
        console.log('⚠️ Content truncated for translation to prevent timeout (10,000 character limit)');
      }

      // Use intent analysis parameters if available
      const finalTargetLang = intentAnalysis?.targetLanguage || targetLang || 'en';
      
      // Translate the content with intent analysis passed through
      let translation;
      try {
        console.log('🔄 Starting content translation with intelligent parameters...');
        translation = await this.translateText(contentToTranslate, finalTargetLang, 'auto', intentAnalysis);
        console.log('✅ Page translation completed successfully');
      } catch (translationError) {
        console.error('❌ Content translation failed:', translationError);
        throw new Error(`Translation failed: ${translationError.message}`);
      }

      return {
        title: pageData.title,
        url: pageData.url,
        originalContent: pageData.content,
        translation: translation,
        sourceLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        wordCount: pageData.wordCount || pageData.content.split(/\s+/).length,
        characterCount: pageData.content.length,
        truncated: contentToTranslate.length < pageData.content.length
      };

    } catch (error) {
      console.error('💥 Error in page translation:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to translate page: ';
      
      if (error.message.includes('Cannot access')) {
        userMessage += 'Cannot access this page content. This may be a restricted page (like chrome:// pages) or a permission issue.';
      } else if (error.message.includes('too short')) {
        userMessage += 'The page content is too short to translate effectively.';
      } else if (error.message.includes('no content')) {
        userMessage += 'The page appears to be empty or has no readable content.';
      } else if (error.message.includes('Translator API')) {
        userMessage += 'The AI translation service is not available. Please check your browser support and try again.';
      } else {
        userMessage += error.message;
      }
      
      throw new Error(userMessage);
    }
  }

  // Get available language pairs for translation
  async getAvailableLanguagePairs() {
    try {
      const support = ChromeIntegration.isSupported();
      if (!support.translator) {
        throw new Error('Translator API is not available');
      }

      // Common language codes supported by Chrome's Translation API
      const commonLanguages = [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
      ];

      const availablePairs = [];

      // Check each language pair (this might take some time)
      for (const sourceLang of commonLanguages) {
        for (const targetLang of commonLanguages) {
          if (sourceLang !== targetLang) {
            try {
              const availability = await window.Translator.availability({
                sourceLanguage: sourceLang,
                targetLanguage: targetLang
              });
              
              if (availability === 'readily' || availability === 'after-download') {
                availablePairs.push({
                  source: sourceLang,
                  target: targetLang,
                  availability: availability
                });
              }
            } catch (error) {
              console.warn(`Could not check ${sourceLang} -> ${targetLang}:`, error);
            }
          }
        }
      }

      return availablePairs;

    } catch (error) {
      console.error('Error getting available language pairs:', error);
      throw new Error(`Failed to get available language pairs: ${error.message}`);
    }
  }

  // Destroy translator instance
  async destroy() {
    if (this.translator) {
      try {
        this.translator.destroy();
        this.translator = null;
        console.log('Translator destroyed');
      } catch (error) {
        console.error('Error destroying translator:', error);
      }
    }
  }

  // Get translator capabilities with comprehensive checking
  async getCapabilities() {
    try {
      // Comprehensive availability check for Translator
      const translatorResult = await ChromeIntegration.checkComprehensiveAvailability('Translator', {
        translatorOptions: { sourceLanguage: 'en', targetLanguage: 'es' }
      });

      // Comprehensive availability check for LanguageDetector
      const langDetectorResult = await ChromeIntegration.checkComprehensiveAvailability('LanguageDetector');

      const capabilities = {
        translator: {
          supported: translatorResult.supported,
          availability: translatorResult.availability,
          available: translatorResult.availability !== 'no',
          ready: translatorResult.ready,
          passed: translatorResult.passed,
          instanceReady: !!this.translator,
          error: translatorResult.error,
          details: translatorResult.details,
          lastChecked: translatorResult.timestamp
        },
        languageDetector: {
          supported: langDetectorResult.supported,
          availability: langDetectorResult.availability,
          available: langDetectorResult.availability !== 'no',
          ready: langDetectorResult.ready,
          passed: langDetectorResult.passed,
          instanceReady: false, // Language detector is created per-use
          error: langDetectorResult.error,
          details: langDetectorResult.details,
          lastChecked: langDetectorResult.timestamp
        }
      };

      console.log('Translator capabilities (comprehensive check):', capabilities);
      return capabilities;

    } catch (error) {
      console.error('Error checking translator capabilities:', error);
      return {
        translator: {
          supported: false,
          availability: 'no',
          available: false,
          ready: false,
          passed: false,
          instanceReady: !!this.translator,
          error: error.message,
          lastChecked: new Date().toISOString()
        },
        languageDetector: {
          supported: false,
          availability: 'no',
          available: false,
          ready: false,
          passed: false,
          instanceReady: false,
          error: error.message,
          lastChecked: new Date().toISOString()
        }
      };
    }
  }

  // Quick test method for translator functionality
  async testTranslator() {
    try {
      console.log('🧪 Testing Translator Agent...');
      
      const capabilities = await this.getCapabilities();
      console.log('✓ Capabilities Check:', capabilities);
      
      if (!capabilities.translator.supported) {
        throw new Error('Translator API not supported in this browser');
      }

      if (!capabilities.translator.available) {
        throw new Error('Translator API not available on this device');
      }

      // Test simple translation
      const testText = 'Hello, how are you today?';
      const translation = await this.translateText(testText, 'es', 'en');
      
      console.log('✓ Translation Test Results:');
      console.log(`  Original: "${translation.originalText}"`);
      console.log(`  Translated: "${translation.translatedText}"`);
      console.log(`  Languages: ${translation.sourceLanguage} -> ${translation.targetLanguage}`);
      
      // Test language detection if available
      let detectionTest = null;
      if (capabilities.languageDetector.supported && capabilities.languageDetector.available) {
        try {
          detectionTest = await this.detectLanguage(testText);
          console.log('✓ Language Detection Test:');
          console.log(`  Detected: ${detectionTest.language} (confidence: ${detectionTest.confidence})`);
        } catch (detectionError) {
          console.warn('Language detection test failed:', detectionError);
        }
      }
      
      return {
        success: true,
        capabilities: capabilities,
        translation: translation,
        languageDetection: detectionTest
      };

    } catch (error) {
      console.error('❌ Translator test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Diagnostic method to identify specific translation issues
  async diagnose() {
    console.log('🔍 Running Translator Agent Diagnostics...');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {},
      apis: {},
      capabilities: {},
      languagePairs: {},
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
    diagnostics.apis = {
      windowTranslator: typeof window.Translator !== 'undefined',
      translatorType: window.Translator ? typeof window.Translator : 'undefined',
      hasCreate: window.Translator && typeof window.Translator.create === 'function',
      hasAvailability: window.Translator && typeof window.Translator.availability === 'function',
      windowLanguageDetector: typeof window.LanguageDetector !== 'undefined',
      languageDetectorType: window.LanguageDetector ? typeof window.LanguageDetector : 'undefined',
      langDetectorHasCreate: window.LanguageDetector && typeof window.LanguageDetector.create === 'function',
      langDetectorHasAvailability: window.LanguageDetector && typeof window.LanguageDetector.availability === 'function'
    };

    // Try direct availability checks
    if (diagnostics.apis.hasAvailability) {
      try {
        const enToEsAvailability = await window.Translator.availability({
          sourceLanguage: 'en',
          targetLanguage: 'es'
        });
        diagnostics.apis.directTranslatorAvailability = enToEsAvailability;
      } catch (availError) {
        diagnostics.apis.directTranslatorAvailabilityError = availError.message;
      }
    }

    if (diagnostics.apis.langDetectorHasAvailability) {
      try {
        const langDetectorAvailability = await window.LanguageDetector.availability();
        diagnostics.apis.directLanguageDetectorAvailability = langDetectorAvailability;
      } catch (availError) {
        diagnostics.apis.directLanguageDetectorAvailabilityError = availError.message;
      }
    }

    // Comprehensive capabilities check
    try {
      diagnostics.capabilities = await this.getCapabilities();
    } catch (capError) {
      diagnostics.capabilities = { error: capError.message };
    }

    // Test common language pair availability
    const commonPairs = [
      { source: 'en', target: 'es' },
      { source: 'en', target: 'fr' },
      { source: 'es', target: 'en' },
      { source: 'auto', target: 'en' }
    ];

    for (const pair of commonPairs) {
      try {
        if (window.Translator && window.Translator.availability) {
          const pairAvailability = await window.Translator.availability({
            sourceLanguage: pair.source === 'auto' ? 'en' : pair.source,
            targetLanguage: pair.target
          });
          diagnostics.languagePairs[`${pair.source}-${pair.target}`] = pairAvailability;
        }
      } catch (pairError) {
        diagnostics.languagePairs[`${pair.source}-${pair.target}`] = `Error: ${pairError.message}`;
      }
    }

    // Identify issues
    if (!diagnostics.environment.hasWindow) {
      diagnostics.issues.push('Window object not available - not running in browser');
    }

    if (diagnostics.environment.chromeVersion < 138) {
      diagnostics.issues.push(`Chrome version ${diagnostics.environment.chromeVersion} is too old (need 138+)`);
      diagnostics.recommendations.push('Update Chrome to version 138 or higher');
    }

    if (!diagnostics.apis.windowTranslator) {
      diagnostics.issues.push('window.Translator is not available');
      diagnostics.recommendations.push('Enable Chrome AI flags or join Origin Trial');
    }

    if (!diagnostics.apis.windowLanguageDetector) {
      diagnostics.issues.push('window.LanguageDetector is not available');
      diagnostics.recommendations.push('Enable Chrome AI flags for Language Detection API');
    }

    if (diagnostics.apis.directTranslatorAvailability === 'no') {
      diagnostics.issues.push('Translator API reports not available on this device');
      diagnostics.recommendations.push('Check system requirements: 16GB+ RAM, 22GB+ storage');
    }

    if (!diagnostics.environment.userActivation) {
      diagnostics.issues.push('User activation required for model downloads');
      diagnostics.recommendations.push('Click a button or interact with the page first');
    }

    console.log('🔍 Translator Diagnostics Complete:', diagnostics);
    return diagnostics;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TranslatorAgent;
} else if (typeof window !== 'undefined') {
  window.TranslatorAgent = TranslatorAgent;
}