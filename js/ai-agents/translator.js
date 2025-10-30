// Translator Agent Module
// Handles all Chrome Built-in AI Translator and Language Detection API interactions

class TranslatorAgent {
  constructor() {
    this.translator = null;
    this.preferredLanguage = 'en';
  }

  // Set preferred language
  setPreferredLanguage(language) {
    const supportedLanguages = ['en', 'es', 'ja', 'fr', 'de', 'it', 'pt', 'ru', 'ko', 'zh', 'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'];
    if (!supportedLanguages.includes(language)) {
      console.warn(`Language '${language}' may not be fully supported. Defaulting to 'en'.`);
      this.preferredLanguage = 'en';
      return false;
    }
    
    console.log(`Setting preferred translator language to: ${language}`);
    this.preferredLanguage = language;
    return true;
  }

  // Create translator instance with comprehensive availability checking
  async createTranslator(sourceLang = 'auto', targetLang = 'en') {
    try {
      console.log('Performing comprehensive Translator API availability check...');
      
      // Comprehensive availability check - validates Supported, Availability, and Ready states
      const checkOptions = {
        translatorOptions: {
          sourceLanguage: sourceLang === 'auto' ? 'en' : sourceLang,
          targetLanguage: targetLang
        }
      };
      
      const availabilityResult = await ChromeIntegration.validateAPIReadiness('Translator', checkOptions);
      console.log('Translator comprehensive check result:', availabilityResult);

      // If we reach here, all three checks (Supported, Availability, Ready) have passed
      if (!availabilityResult.passed) {
        throw new Error(`Translator API comprehensive check failed: ${availabilityResult.error}`);
      }

      if (availabilityResult.availability === 'after-download') {
        console.log('Translation model needs to be downloaded first - this may take time');
      }

      // Default options for translator according to Chrome documentation
      const translatorOptions = {
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Translation model download: ${(e.loaded * 100).toFixed(1)}%`);
            // Send progress update to UI
            AIUtils.notifyProgress('translator', e.loaded * 100);
          });
        }
      };

      // Check for user activation requirement (required for model downloads)
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        console.info('Note: User activation may be required for Translator API model downloads. If you see permission errors, try clicking a button or interacting with the page first.');
        // Don't throw error, just inform - the API may work if model is already downloaded
      }

      console.log('Creating translator with options:', translatorOptions);
      
      // Create translator using Chrome Built-in AI pattern
      this.translator = await window.Translator.create(translatorOptions);
      
      console.log('Translator created successfully');
      return this.translator;

    } catch (error) {
      console.error('Error creating translator:', error);
      throw new Error(`Failed to create translator: ${error.message}`);
    }
  }

  // Create language detector instance
  async createLanguageDetector() {
    try {
      console.log('Checking Language Detection API availability...');
      
      const support = ChromeIntegration.isSupported();
      if (!support.hasWindow) {
        throw new Error('Window object not available - running outside browser context');
      }
      
      // Comprehensive availability check for LanguageDetector
      const langDetectorResult = await ChromeIntegration.checkComprehensiveAvailability('LanguageDetector');
      console.log('LanguageDetector comprehensive check result:', langDetectorResult);

      if (!langDetectorResult.supported) {
        throw new Error('Language Detection API is not available in this browser. Please ensure you have Chrome 138+ and the Built-in AI APIs are enabled.');
      }

      // Check availability
      const availability = await window.LanguageDetector.availability();
      console.log('Language Detector availability:', availability);

      if (availability === 'no') {
        throw new Error('Language Detection API is not available on this device.');
      }

      if (availability === 'after-download') {
        console.log('Language detection model needs to be downloaded first');
      }

      // Create language detector
      const detector = await window.LanguageDetector.create({
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Language detection model download: ${(e.loaded * 100).toFixed(1)}%`);
            AIUtils.notifyProgress('language-detector', e.loaded * 100);
          });
        }
      });

      console.log('Language detector created successfully');
      return detector;

    } catch (error) {
      console.error('Error creating language detector:', error);
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
  async translateText(text, targetLang = 'en', sourceLang = 'auto') {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for translation');
      }

      if (!targetLang) {
        targetLang = 'en'; // Default to English
      }

      // Clean text for better translation
      const cleanText = AIUtils.cleanTextForTranslation(text);
      
      if (cleanText.length < 1) {
        throw new Error('Text is too short to translate effectively');
      }

      console.log(`Translating text (${cleanText.length} characters) from ${sourceLang} to ${targetLang}...`);

      // If source language is auto, try to detect it first
      let detectedSourceLang = sourceLang;
      if (sourceLang === 'auto') {
        try {
          const detection = await this.detectLanguage(cleanText);
          detectedSourceLang = detection.language;
          console.log(`Auto-detected source language: ${detectedSourceLang} (confidence: ${detection.confidence})`);
        } catch (detectionError) {
          console.warn('Language detection failed, using fallback:', detectionError);
          detectedSourceLang = 'en'; // Fallback to English
        }
      }

      // Skip translation if source and target are the same
      if (detectedSourceLang === targetLang) {
        return {
          originalText: cleanText,
          translatedText: cleanText,
          sourceLanguage: detectedSourceLang,
          targetLanguage: targetLang,
          message: `Text is already in ${targetLang}. No translation needed.`
        };
      }

      // Create translator with the detected/specified source language
      const translator = await this.createTranslator(detectedSourceLang, targetLang);

      if (!translator) {
        throw new Error('Failed to create translator');
      }

      console.log(`Translating from ${detectedSourceLang} to ${targetLang}...`);

      // Perform translation
      const translatedText = await translator.translate(cleanText);
      
      // Clean up
      translator.destroy();
      
      console.log('Translation completed successfully');

      return {
        originalText: cleanText,
        translatedText: translatedText,
        sourceLanguage: detectedSourceLang,
        targetLanguage: targetLang,
        wordCount: cleanText.split(/\s+/).length
      };

    } catch (error) {
      console.error('Error during translation:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  // Translate current page content
  async translateCurrentPage(targetLang = 'en') {
    try {
      const pageData = await ChromeIntegration.extractCurrentPageContent();

      // For very long pages, limit content to prevent timeout
      let contentToTranslate = pageData.content;
      if (contentToTranslate.length > 10000) {
        contentToTranslate = contentToTranslate.substring(0, 10000) + '...';
        console.log('Content truncated for translation to prevent timeout');
      }

      // Translate the content
      const translation = await this.translateText(contentToTranslate, targetLang, 'auto');

      return {
        title: pageData.title,
        url: pageData.url,
        originalContent: pageData.content,
        translation: translation,
        sourceLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        wordCount: pageData.wordCount || pageData.content.split(/\s+/).length
      };

    } catch (error) {
      console.error('Error translating current page:', error);
      throw new Error(`Failed to translate page: ${error.message}`);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TranslatorAgent;
} else if (typeof window !== 'undefined') {
  window.TranslatorAgent = TranslatorAgent;
}