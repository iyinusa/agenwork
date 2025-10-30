// Core AI Agents Module
// Main coordination class for all AI agents

class AIAgents {
  constructor() {
    this.summarizer = new SummarizerAgent();
    this.translator = new TranslatorAgent();
    this.prompter = new PrompterAgent();
    this.writer = new WriterAgent();
    this.initialized = false;
    this.preferredLanguage = 'en'; // Default to English, supported: 'en', 'es', 'ja'
  }

  // Initialize the AI Agents system
  async initialize() {
    try {
      console.log('Initializing AI Agents...');
      
      const support = ChromeIntegration.isSupported();
      console.log('AI APIs support check:', support);
      
      if (support.summarizer) {
        console.log('✓ Summarizer API available');
      }
      if (support.prompter) {
        console.log('✓ LanguageModel API available');
      }
      if (support.translator) {
        console.log('✓ Translator API available');
      }
      if (support.writer) {
        console.log('✓ Writer API available');
      }
      
      if (!support.summarizer && !support.prompter && !support.translator && !support.writer) {
        console.warn('⚠️ No Chrome Built-in AI APIs detected');
        
        const chromeVersion = ChromeIntegration.getChromeVersion();
        if (!chromeVersion || chromeVersion < 138) {
          console.warn(`Chrome version ${chromeVersion || 'Unknown'} detected. Chrome 138+ required for Built-in AI APIs.`);
        }
      }

      // Set preferred language for all agents
      this.setPreferredLanguage(this.preferredLanguage);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize AI Agents:', error);
      this.initialized = false;
      return false;
    }
  }

  // Set preferred language for AI operations
  setPreferredLanguage(language) {
    const supportedLanguages = ['en', 'es', 'ja'];
    if (!supportedLanguages.includes(language)) {
      console.warn(`Language '${language}' not supported. Supported languages: ${supportedLanguages.join(', ')}. Defaulting to 'en'.`);
      this.preferredLanguage = 'en';
    } else {
      console.log(`Setting preferred AI language to: ${language}`);
      this.preferredLanguage = language;
    }
    
    // Update all agents with the new language preference
    this.summarizer.setPreferredLanguage(this.preferredLanguage);
    this.translator.setPreferredLanguage(this.preferredLanguage);
    this.prompter.setPreferredLanguage(this.preferredLanguage);
    this.writer.setPreferredLanguage(this.preferredLanguage);
    
    return supportedLanguages.includes(language);
  }

  // Get current preferred language
  getPreferredLanguage() {
    return this.preferredLanguage;
  }

  // Get output language for AI operations
  async getOutputLanguage() {
    return await AIUtils.getOutputLanguage(this.preferredLanguage);
  }

  // Get supported languages for AI operations
  static getSupportedLanguages() {
    return AIUtils.getSupportedLanguages();
  }

  // Check if browser supports AI APIs
  static isSupported() {
    return ChromeIntegration.isSupported();
  }

  // Get Chrome version for debugging
  static getChromeVersion() {
    return ChromeIntegration.getChromeVersion();
  }

  // Check if the current Chrome version supports Built-in AI APIs
  static isChromeVersionSupported() {
    return ChromeIntegration.isChromeVersionSupported();
  }

  // Generate helpful error messages based on Chrome version and API availability
  static generateHelpfulErrorMessage(apiName, error) {
    return ChromeIntegration.generateHelpfulErrorMessage(apiName, error);
  }

  // Check if the current context supports AI APIs
  static async checkEnvironment() {
    return await ChromeIntegration.checkEnvironment();
  }

  // SUMMARIZATION METHODS
  
  // Summarize text content
  async summarizeText(text, context = '', intentResult = null) {
    try {
      return await this.summarizer.summarizeText(text, context, intentResult);
    } catch (error) {
      console.error('Error in summarizeText:', error);
      throw error;
    }
  }

  // Summarize current page content
  async summarizeCurrentPage(intentAnalysis = null) {
    try {
      return await this.summarizer.summarizeCurrentPage(intentAnalysis);
    } catch (error) {
      console.error('Error in summarizeCurrentPage:', error);
      throw error;
    }
  }

  // TRANSLATION METHODS
  
  // Translate text content
  async translateText(text, targetLang = 'en', sourceLang = 'auto') {
    try {
      return await this.translator.translateText(text, targetLang, sourceLang);
    } catch (error) {
      console.error('Error in translateText:', error);
      throw error;
    }
  }

  // Translate current page content
  async translateCurrentPage(targetLang = 'en') {
    try {
      return await this.translator.translateCurrentPage(targetLang);
    } catch (error) {
      console.error('Error in translateCurrentPage:', error);
      throw error;
    }
  }

  // Detect language of given text
  async detectLanguage(text) {
    try {
      return await this.translator.detectLanguage(text);
    } catch (error) {
      console.error('Error in detectLanguage:', error);
      throw error;
    }
  }

  // Get available language pairs for translation
  async getAvailableLanguagePairs() {
    try {
      return await this.translator.getAvailableLanguagePairs();
    } catch (error) {
      console.error('Error in getAvailableLanguagePairs:', error);
      throw error;
    }
  }

  // Extract target language from user prompt
  extractTargetLanguage(prompt) {
    return AIUtils.extractTargetLanguage(prompt, this.preferredLanguage);
  }

  // PROMPTING AND INTENT DETECTION METHODS
  
  // Intelligent intent detection using Gemini Nano
  async detectIntentWithAI(userMessage, pageContext = null) {
    try {
      return await this.prompter.detectIntentWithAI(userMessage, pageContext);
    } catch (error) {
      console.error('Error in detectIntentWithAI:', error);
      throw error;
    }
  }

  // Handle research queries using the prompter
  async handleResearchQuery(query, pageContext = null) {
    try {
      return await this.prompter.handleResearchQuery(query, pageContext);
    } catch (error) {
      console.error('Error in handleResearchQuery:', error);
      throw error;
    }
  }

  // Process a user message with intelligent prompt handling
  async processPrompt(prompt, systemContext = null) {
    try {
      return await this.prompter.processPrompt(prompt, systemContext);
    } catch (error) {
      console.error('Error in processPrompt:', error);
      throw error;
    }
  }

  // WRITING METHODS
  
  // Write content based on prompt
  async writeContent(prompt, context = '', options = {}) {
    try {
      return await this.writer.writeContent(prompt, context, options);
    } catch (error) {
      console.error('Error in writeContent:', error);
      throw error;
    }
  }

  // Help with different types of writing tasks
  async helpWithWriting(task, details, context = '') {
    try {
      return await this.writer.helpWithWriting(task, details, context);
    } catch (error) {
      console.error('Error in helpWithWriting:', error);
      throw error;
    }
  }

  // COORDINATION AND DISPATCH METHODS
  
  // Extract displayable result from coordination response
  getDisplayableResult(coordinationResult) {
    if (!coordinationResult || !coordinationResult.results || coordinationResult.results.length === 0) {
      return 'No results available.';
    }
    
    // Get the primary result
    const primaryResult = coordinationResult.results.find(r => r.type === 'primary');
    if (primaryResult && primaryResult.result) {
      return primaryResult.result;
    }
    
    // Fallback to first result
    return coordinationResult.results[0].result || 'No result available.';
  }

  // Simplified method for chat interfaces - returns just the displayable result
  async processUserMessage(userMessage, pageContext = null) {
    try {
      const coordinationResult = await this.coordinateTask(userMessage, pageContext);
      return this.getDisplayableResult(coordinationResult);
    } catch (error) {
      console.error('Error processing user message:', error);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  }

  // Test the multi-agent coordination system
  async testMultiAgentSystem() {
    console.log('🧪 Testing Multi-Agent Coordination System...');
    
    const tests = [
      {
        name: 'Summarization Intent',
        message: 'Can you summarize this page for me?',
        expectedIntent: 'summarize'
      },
      {
        name: 'Translation Intent',
        message: 'Translate this to Spanish',
        expectedIntent: 'translate'
      },
      {
        name: 'Writing Intent',
        message: 'Help me write an email',
        expectedIntent: 'write'
      },
      {
        name: 'Research Intent',
        message: 'What is machine learning?',
        expectedIntent: 'research'
      }
    ];

    const results = [];
    
    for (const test of tests) {
      console.log(`\n🔍 Testing: ${test.name}`);
      
      try {
        const startTime = Date.now();
        const result = await this.coordinateTask(test.message);
        const duration = Date.now() - startTime;
        
        const success = result.intentAnalysis.primary === test.expectedIntent;
        
        results.push({
          test: test.name,
          message: test.message,
          expectedIntent: test.expectedIntent,
          detectedIntent: result.intentAnalysis.primary,
          confidence: result.intentAnalysis.confidence,
          aiPowered: result.intentAnalysis.aiPowered,
          agentsUsed: result.results.length,
          successfulAgents: result.results.filter(r => r.success).length,
          duration: duration,
          success: success
        });
        
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${result.intentAnalysis.primary} (${(result.intentAnalysis.confidence * 100).toFixed(0)}% confidence, ${duration}ms)`);
        
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        results.push({
          test: test.name,
          message: test.message,
          expectedIntent: test.expectedIntent,
          error: error.message,
          success: false
        });
      }
    }
    
    // Generate summary
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`\n📊 Multi-Agent System Test Results:`);
    console.log(`✅ Successful: ${successful}/${total} tests`);
    console.log(`⏱️ Average duration: ${(results.filter(r => r.duration).reduce((a, b) => a + b.duration, 0) / results.filter(r => r.duration).length).toFixed(0)}ms`);
    
    if (successful === total) {
      console.log('🎉 All tests passed! Multi-agent system is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check individual results above.');
    }
    
    return {
      success: successful === total,
      results: results,
      summary: {
        successful: successful,
        total: total,
        successRate: (successful / total * 100).toFixed(1) + '%'
      }
    };
  }

  // Coordinate and dispatch tasks to appropriate agents
  async coordinateTask(userMessage, pageContext = null) {
    try {
      console.log('🚀 Multi-Agent Coordination started for:', userMessage);

      // Validate input
      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        throw new Error('Invalid user message provided to coordination system');
      }

      // Ensure agents are properly initialized
      if (!this.initialized) {
        console.log('⚠️ AI Agents not initialized, attempting initialization...');
        const initResult = await this.initialize();
        if (!initResult) {
          console.error('❌ Failed to initialize AI Agents for coordination');
          throw new Error('AI system initialization failed');
        }
      }

      // Step 1: Use Prompter Agent for intent detection
      console.log('🔍 Step 1: Intent Detection via Prompter Agent');
      let intentResult;
      
      try {
        intentResult = await this.detectIntentWithAI(userMessage, pageContext);
        console.log('✅ Intent detected successfully:', {
          primary: intentResult.primary,
          confidence: intentResult.confidence,
          aiPowered: intentResult.aiPowered,
          secondary: intentResult.secondary
        });
      } catch (intentError) {
        console.error('❌ Intent detection failed:', intentError);
        // Use fallback intent detection
        console.log('📋 Using fallback intent detection...');
        intentResult = this.prompter.detectIntentFallback(userMessage);
        console.log('✅ Fallback intent detection completed:', intentResult);
      }

      // Validate intent result
      if (!intentResult || !intentResult.primary) {
        console.error('❌ Invalid intent detection result:', intentResult);
        throw new Error('Intent detection failed to produce valid results');
      }

      // Step 2: Dispatch to appropriate agent(s)
      console.log('🎯 Step 2: Agent Dispatching');
      const results = [];
      
      // Handle primary intent
      console.log(`📤 Dispatching to PRIMARY agent: ${intentResult.primary}`);
      try {
        const primaryResult = await this.dispatchToAgent(
          intentResult.primary, 
          intentResult.craftedPrompt || userMessage, 
          pageContext, 
          intentResult
        );
        
        results.push({
          intent: intentResult.primary,
          type: 'primary',
          result: primaryResult,
          success: true
        });
        console.log(`✅ PRIMARY agent (${intentResult.primary}) completed successfully`);
        
      } catch (primaryError) {
        console.error(`❌ PRIMARY agent (${intentResult.primary}) failed:`, primaryError);
        results.push({
          intent: intentResult.primary,
          type: 'primary',
          result: `Error in ${intentResult.primary} agent: ${primaryError.message}`,
          success: false,
          error: primaryError.message
        });
      }

      // Handle secondary intents if present
      if (intentResult.secondary && Array.isArray(intentResult.secondary) && intentResult.secondary.length > 0) {
        console.log('📤 Processing SECONDARY intents:', intentResult.secondary);
        const validIntents = ['summarize', 'translate', 'write', 'research'];
        
        for (const secondaryIntent of intentResult.secondary) {
          if (secondaryIntent !== intentResult.primary) {
            // Skip if this looks like a parameter rather than an intent
            if (typeof secondaryIntent === 'string' && secondaryIntent.includes(':')) {
              console.log(`⏭️ Skipping parameter-like secondary intent: ${secondaryIntent}`);
              continue;
            }
            
            // Skip if not a valid intent
            if (!validIntents.includes(secondaryIntent)) {
              console.log(`⏭️ Skipping invalid secondary intent: ${secondaryIntent}`);
              continue;
            }
            
            console.log(`📤 Dispatching to SECONDARY agent: ${secondaryIntent}`);
            try {
              const secondaryResult = await this.dispatchToAgent(
                secondaryIntent, 
                intentResult.craftedPrompt || userMessage, 
                pageContext, 
                intentResult
              );
              
              results.push({
                intent: secondaryIntent,
                type: 'secondary',
                result: secondaryResult,
                success: true
              });
              console.log(`✅ SECONDARY agent (${secondaryIntent}) completed successfully`);
              
            } catch (secondaryError) {
              console.error(`❌ SECONDARY agent (${secondaryIntent}) failed:`, secondaryError);
              results.push({
                intent: secondaryIntent,
                type: 'secondary',
                result: `Error processing ${secondaryIntent}: ${secondaryError.message}`,
                success: false,
                error: secondaryError.message
              });
            }
          }
        }
      }

      // Validate we have at least one result
      if (results.length === 0) {
        throw new Error('No agents were able to process the request');
      }

      console.log('🎉 Multi-Agent Coordination completed successfully');
      console.log(`📊 Results: ${results.length} agent(s) processed the request`);
      
      return {
        intentAnalysis: intentResult,
        results: results,
        success: true,
        timestamp: new Date().toISOString(),
        processingStats: {
          totalAgents: results.length,
          successfulAgents: results.filter(r => r.success).length,
          failedAgents: results.filter(r => !r.success).length
        }
      };

    } catch (error) {
      console.error('💥 Multi-Agent Coordination failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error information
      let errorMessage = `Multi-agent coordination failed: ${error.message}`;
      
      if (error.message.includes('initialization')) {
        errorMessage = 'AI system is not properly initialized. Please refresh and try again.';
      } else if (error.message.includes('Intent detection')) {
        errorMessage = 'Unable to understand your request. Please try rephrasing your message.';
      } else if (error.message.includes('No agents')) {
        errorMessage = 'No AI agents are available to process your request. Please check your browser support.';
      }
      
      throw new Error(errorMessage);
    }
  }

  // Dispatch to specific agent based on intent
  async dispatchToAgent(intent, craftedPrompt, pageContext = null, intentAnalysis = null) {
    console.log(`🎯 Dispatching to ${intent} agent with prompt:`, craftedPrompt);

    // Validate inputs
    if (!intent || typeof intent !== 'string') {
      throw new Error('Invalid intent provided for agent dispatch');
    }

    if (!craftedPrompt || typeof craftedPrompt !== 'string') {
      throw new Error('Invalid prompt provided for agent dispatch');
    }

    const validIntents = ['summarize', 'translate', 'write', 'research'];
    if (!validIntents.includes(intent)) {
      throw new Error(`Unknown intent: ${intent}. Valid intents: ${validIntents.join(', ')}`);
    }

    // Check agent availability before dispatching
    const capabilities = await this.getCapabilities();
    const agentMap = {
      'summarize': 'summarizer',
      'translate': 'translator', 
      'write': 'writer',
      'research': 'prompter'
    };

    const agentName = agentMap[intent];
    if (capabilities[agentName] && !capabilities[agentName].available) {
      console.warn(`⚠️ ${agentName} agent not available, capabilities:`, capabilities[agentName]);
    }

    try {
      switch (intent) {
        case 'summarize':
          console.log('📝 Processing SUMMARIZE request');
          
          // Check summarizer availability first
          try {
            const summarizerCaps = await this.summarizer.getCapabilities();
            console.log('📊 Summarizer capabilities:', summarizerCaps);
            
            if (!summarizerCaps.supported) {
              throw new Error('Summarizer API is not supported in this browser. Please ensure you have Chrome 138+ with AI features enabled.');
            }
            
            if (!summarizerCaps.available) {
              throw new Error('Summarizer API is not available on this device. Please check system requirements: 16GB+ RAM, 22GB+ storage space.');
            }
            
            if (summarizerCaps.availability === 'after-download' && (!navigator.userActivation || !navigator.userActivation.isActive)) {
              throw new Error('User interaction required for AI model download. Please click a button or interact with the page first.');
            }
            
          } catch (capError) {
            console.error('❌ Summarizer capability check failed:', capError);
            throw new Error(`Summarizer not ready: ${capError.message}`);
          }
          
          // Check if user wants to summarize current page or provided text
          const isPageSummary = craftedPrompt.toLowerCase().includes('page') || 
                               craftedPrompt.toLowerCase().includes('this') || 
                               craftedPrompt.toLowerCase().includes('current');
          
          if (isPageSummary && pageContext) {
            console.log('📄 Summarizing current page');
            console.log('📊 Using intent analysis for page summarization:', {
              type: intentAnalysis?.summarizationType || intentAnalysis?.summarization_type,
              length: intentAnalysis?.summarizationLength || intentAnalysis?.summarization_length
            });
            try {
              const pageResult = await this.summarizeCurrentPage(intentAnalysis);
              return `**${pageResult.title}**\n\n${pageResult.summary}\n\n*Source: ${pageResult.url}*\n*Word count: ${pageResult.wordCount}*`;
            } catch (pageError) {
              console.error('❌ Page summarization failed:', pageError);
              throw new Error(`Page summarization failed: ${pageError.message}`);
            }
          } else {
            console.log('📃 Summarizing provided text');
            // For text summarization, extract text from the prompt
            const textMatch = craftedPrompt.match(/"([^"]+)"|'([^']+)'|summarize\s+(.+)$/i);
            const textToSummarize = textMatch ? (textMatch[1] || textMatch[2] || textMatch[3]) : craftedPrompt;
            
            if (!textToSummarize || textToSummarize.trim().length === 0) {
              throw new Error('No text provided for summarization. Please specify what you want to summarize.');
            }
            
            try {
              return await this.summarizeText(textToSummarize, '', intentAnalysis);
            } catch (textError) {
              console.error('❌ Text summarization failed:', textError);
              throw new Error(`Text summarization failed: ${textError.message}`);
            }
          }

        case 'translate':
          console.log('🌐 Processing TRANSLATE request');
          
          // Extract translation preferences from intent analysis and prompt
          const translationOptions = {};
          if (intentAnalysis) {
            if (intentAnalysis.targetLanguage) {
              translationOptions.targetLang = intentAnalysis.targetLanguage;
              console.log(`🎯 Using detected target language: ${intentAnalysis.targetLanguage}`);
            }
            if (intentAnalysis.sourceLanguage) {
              translationOptions.sourceLang = intentAnalysis.sourceLanguage;
              console.log(`🔍 Using detected source language: ${intentAnalysis.sourceLanguage}`);
            }
          }

          // Check if user wants to translate current page or provided text
          const isPageTranslation = craftedPrompt.toLowerCase().includes('page') || 
                                   craftedPrompt.toLowerCase().includes('this') || 
                                   craftedPrompt.toLowerCase().includes('current');
          
          if (isPageTranslation && pageContext) {
            console.log('📄 Translating current page');
            const translationResult = await this.translateCurrentPage(translationOptions.targetLang);
            return `**Translation of "${translationResult.title}"**\n\n${translationResult.translation.translatedText}\n\n*Translated from ${translationResult.sourceLanguage} to ${translationResult.targetLanguage}*\n*Source: ${translationResult.url}*`;
          } else {
            console.log('📃 Translating provided text');
            // For text translation, extract text from the prompt
            const textMatch = craftedPrompt.match(/"([^"]+)"|'([^']+)'|translate\s+(.+?)(?:\s+to\s+\w+)?$/i);
            const textToTranslate = textMatch ? (textMatch[1] || textMatch[2] || textMatch[3]) : craftedPrompt;
            
            if (!textToTranslate || textToTranslate.trim().length === 0) {
              throw new Error('No text provided for translation');
            }
            
            // Extract target language from prompt if not in analysis
            const targetLang = translationOptions.targetLang || this.extractTargetLanguage(craftedPrompt);
            const translationResult = await this.translateText(textToTranslate, targetLang, translationOptions.sourceLang);
            return `**Translation**\n\n${translationResult.translatedText}\n\n*Translated from ${translationResult.sourceLanguage} to ${translationResult.targetLanguage}*`;
          }

        case 'write':
          console.log('✍️ Processing WRITE request');
          
          if (!craftedPrompt || craftedPrompt.trim().length === 0) {
            throw new Error('No writing prompt provided');
          }
          
          const contextInfo = pageContext ? `Context: ${pageContext.title} - ${pageContext.url}` : '';
          return await this.writeContent(craftedPrompt, contextInfo);

        case 'research':
          console.log('🔍 Processing RESEARCH request');
          
          if (!craftedPrompt || craftedPrompt.trim().length === 0) {
            throw new Error('No research query provided');
          }
          
          return await this.handleResearchQuery(craftedPrompt, pageContext);

        default:
          // This should never happen due to validation above, but keeping for safety
          throw new Error(`Unknown intent: ${intent}`);
      }
      
    } catch (agentError) {
      console.error(`❌ Agent ${intent} failed:`, agentError);
      
      // Provide specific error messages based on the type of error
      let errorMessage = `${intent} agent encountered an error: ${agentError.message}`;
      
      if (agentError.message.includes('not available') || agentError.message.includes('not supported')) {
        errorMessage = `${intent} functionality is not available in your browser. Please ensure you have Chrome 138+ with AI features enabled.`;
      } else if (agentError.message.includes('No text provided') || agentError.message.includes('No') && agentError.message.includes('provided')) {
        errorMessage = `Please provide ${intent === 'translate' ? 'text to translate' : intent === 'summarize' ? 'text to summarize' : 'more specific information'} in your request.`;
      } else if (agentError.message.includes('timeout')) {
        errorMessage = `${intent} request timed out. Please try again with a shorter or simpler request.`;
      }
      
      throw new Error(errorMessage);
    }
  }

  // CAPABILITIES AND DIAGNOSTICS
  
  // Get capabilities and status of all AI agents
  async getCapabilities() {
    const summarizerCaps = await this.summarizer.getCapabilities();
    const translatorCaps = await this.translator.getCapabilities();
    const prompterCaps = await this.prompter.getCapabilities();
    const writerCaps = await this.writer.getCapabilities();

    return {
      summarizer: summarizerCaps,
      translator: translatorCaps.translator,
      languageDetector: translatorCaps.languageDetector,
      prompter: prompterCaps,
      writer: writerCaps
    };
  }

  // Comprehensive diagnostic function
  async getDiagnostics() {
    const chromeVersion = ChromeIntegration.getChromeVersion();
    const support = ChromeIntegration.isSupported();
    const capabilities = await this.getCapabilities();
    
    const diagnostics = {
      system: {
        userAgent: navigator.userAgent,
        chromeVersion: chromeVersion,
        chromeVersionValid: chromeVersion >= 138,
        platform: navigator.platform,
        memory: navigator.deviceMemory || 'Unknown'
      },
      browserSupport: support,
      capabilities: capabilities,
      recommendations: []
    };

    // Generate recommendations
    if (chromeVersion < 138) {
      diagnostics.recommendations.push('Update Chrome to version 138 or higher');
    }
    
    if (!support.summarizer && !support.prompter && !support.translator && !support.writer) {
      diagnostics.recommendations.push('Enable Chrome Built-in AI flags or join the Origin Trial');
    }
    
    if (!support.summarizer && support.hasWindow) {
      diagnostics.recommendations.push('The Summarizer API may not be available in your region or Chrome build');
    }

    if (!support.prompter && support.hasWindow) {
      diagnostics.recommendations.push('The Language Model API may not be available in your region or Chrome build');
    }

    return diagnostics;
  }

  // Debug method to check all AI capabilities
  async debugCapabilities() {
    console.log('=== AI Capabilities Debug ===');
    
    const support = ChromeIntegration.isSupported();
    console.log('Support Check Results:', support);
    
    const capabilities = await this.getCapabilities();
    console.log('Capabilities Check Results:', capabilities);
    
    // Test each agent individually
    const testResults = {};
    
    try {
      testResults.summarizer = await this.summarizer.testSummarizer();
    } catch (error) {
      testResults.summarizer = { success: false, error: error.message };
    }
    
    try {
      testResults.translator = await this.translator.testTranslator();
    } catch (error) {
      testResults.translator = { success: false, error: error.message };
    }
    
    try {
      testResults.prompter = await this.prompter.testPrompter();
    } catch (error) {
      testResults.prompter = { success: false, error: error.message };
    }
    
    try {
      testResults.writer = await this.writer.testWriter();
    } catch (error) {
      testResults.writer = { success: false, error: error.message };
    }
    
    console.log('Agent Test Results:', testResults);
    console.log('=== End Debug ===');
    
    return { support, capabilities, testResults };
  }

  // Test all agents with a comprehensive test
  async testAllAgents() {
    console.log('🧪 Testing All AI Agents...');
    
    const results = {
      environment: await ChromeIntegration.checkEnvironment(),
      agents: {}
    };
    
    // Test each agent
    const agents = ['summarizer', 'translator', 'prompter', 'writer'];
    
    for (const agentName of agents) {
      try {
        console.log(`Testing ${agentName}...`);
        switch (agentName) {
          case 'summarizer':
            results.agents[agentName] = await this.summarizer.testSummarizer();
            break;
          case 'translator':
            results.agents[agentName] = await this.translator.testTranslator();
            break;
          case 'prompter':
            results.agents[agentName] = await this.prompter.testPrompter();
            break;
          case 'writer':
            results.agents[agentName] = await this.writer.testWriter();
            break;
        }
        
        if (results.agents[agentName].success) {
          console.log(`✓ ${agentName} test passed`);
        } else {
          console.log(`❌ ${agentName} test failed:`, results.agents[agentName].error);
        }
      } catch (error) {
        console.error(`❌ ${agentName} test error:`, error);
        results.agents[agentName] = { success: false, error: error.message };
      }
    }
    
    return results;
  }

  // Cleanup method
  async cleanup() {
    await this.summarizer.destroy();
    await this.translator.destroy();
    await this.prompter.destroy();
    await this.writer.destroy();
    this.initialized = false;
    console.log('AI Agents cleaned up');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgents;
} else if (typeof window !== 'undefined') {
  window.AIAgents = AIAgents;
}