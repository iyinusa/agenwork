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
  async translateText(text, targetLang = 'en', sourceLang = 'auto', intentAnalysis = null) {
    try {
      return await this.translator.translateText(text, targetLang, sourceLang, intentAnalysis);
    } catch (error) {
      console.error('Error in translateText:', error);
      throw error;
    }
  }

  // Translate current page content
  async translateCurrentPage(targetLang = 'en', intentAnalysis = null) {
    try {
      return await this.translator.translateCurrentPage(targetLang, intentAnalysis);
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
    // Use the enhanced language extraction from prompter agent if available
    if (this.prompter && typeof this.prompter.extractTargetLanguageEnhanced === 'function') {
      return this.prompter.extractTargetLanguageEnhanced(prompt, this.preferredLanguage);
    }
    // Fallback to AIUtils method
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

  // Enhanced intent detection with smart multi-step analysis
  async detectSmartIntent(userMessage, pageContext = null) {
    try {
      console.log('🧠 Advanced multi-step intent detection for:', userMessage);
      
      // Initialize prompter if needed
      if (!this.prompter) {
        await this.prompter.createPrompter();
      }

      // Enhanced system prompt for smart triage
      const smartTriagePrompt = `You are an advanced AI coordinator that analyzes user requests to identify complex multi-step tasks. Your job is to determine if a user request requires multiple AI agents working in sequence or parallel, and create an optimal execution plan.

ANALYSIS FRAMEWORK:
1. Identify ALL intents in the user message (primary and secondary)
2. Determine if the request requires SEQUENTIAL execution (one task output feeds into another)
3. Detect language requirements and cross-language operations
4. Create an optimal execution plan

CRITICAL MULTI-STEP PATTERNS - Always detect these as multi-step:
- "Brief/short overview in [language]": SUMMARIZE → TRANSLATE (sequential)
- "[Language] summary/overview": SUMMARIZE → TRANSLATE (sequential)
- "Summarize in [language]": SUMMARIZE → TRANSLATE (sequential)
- "Give me [language] summary": SUMMARIZE → TRANSLATE (sequential)
- "Quick overview in [language]": SUMMARIZE → TRANSLATE (sequential)
- "Summarize this and translate to [language]": SUMMARIZE → TRANSLATE (sequential)
- "Translate and summarize": TRANSLATE → SUMMARIZE or PARALLEL based on context
- "Research and write about": RESEARCH → WRITE (sequential)
- "Write in [language] about": RESEARCH → WRITE in target language (sequential)
- "Explain in [language]": RESEARCH → TRANSLATE (sequential)
- "Tell me about [topic] in [language]": RESEARCH → TRANSLATE (sequential)
- "Summarize and write [code/sample/example]": SUMMARIZE → WRITE (sequential)
- "Summarize this page and write [code/sample/example]": SUMMARIZE → WRITE (sequential)
- "Brief summary and create [code/sample]": SUMMARIZE → WRITE (sequential)
- "Overview and generate [code/sample]": SUMMARIZE → WRITE (sequential)
- "Explain and show [code/example]": RESEARCH → WRITE (sequential)
- "Research [topic] and write code": RESEARCH → WRITE (sequential)

EXECUTION TYPES:
- "sequential": Output of first agent becomes input of second agent (USE THIS when one task needs the result of another)
- "parallel": Agents can work simultaneously on same input (USE THIS when tasks are independent)
- "single": Only one agent needed (USE THIS only when truly single-step)

LANGUAGE DETECTION - Common patterns:
- "in German", "in Spanish", "in French", "in Chinese" etc.
- "translate to [language]"
- "give me [language] version"
- "[language] summary", "[language] overview"
- Language codes: German=de, Spanish=es, French=fr, Italian=it, Portuguese=pt, Russian=ru, Japanese=ja, Korean=ko, Chinese=zh, Arabic=ar, Hindi=hi, Turkish=tr, Polish=pl, Dutch=nl, Swedish=sv, Danish=da, Norwegian=no, Finnish=fi

IMPORTANT RULES:
1. If you see "in [language]" after any action word → This is ALWAYS multi-step sequential
2. If summarization + language specified → ALWAYS summarize first, then translate
3. For "translate_text" action, the input MUST be the output variable from the previous step
4. Use "summarize_page" when summarizing current page, "summarize_text" when summarizing text from previous step
5. Use "translate_page" when translating current page, "translate_text" when translating output from previous step

RESPONSE FORMAT (JSON only, no extra text):
{
  "primary": "main_intent",
  "secondary": ["secondary_intent1", "secondary_intent2"],
  "isMultiStep": true/false,
  "executionType": "sequential|parallel|single",
  "executionPlan": [
    {
      "step": 1,
      "agent": "agent_name",
      "action": "specific_action",
      "input": "input_source",
      "output": "output_destination",
      "params": {"key": "value"}
    }
  ],
  "finalOutputLanguage": "language_code or null",
  "reasoning": "explanation of the execution plan",
  "confidence": 0.0-1.0
}

EXAMPLES:

User: "Give me a brief overview in German"
Response: {
  "primary": "summarize",
  "secondary": ["translate"],
  "isMultiStep": true,
  "executionType": "sequential",
  "executionPlan": [
    {
      "step": 1,
      "agent": "summarizer",
      "action": "summarize_page",
      "input": "current_page",
      "output": "summary_text",
      "params": {"type": "tldr", "length": "short"}
    },
    {
      "step": 2,
      "agent": "translator",
      "action": "translate_text",
      "input": "summary_text",
      "output": "final_result",
      "params": {"target_language": "de", "source_language": "auto"}
    }
  ],
  "finalOutputLanguage": "de",
  "reasoning": "User wants page summarized first, then translated to German - sequential execution required",
  "confidence": 0.95
}

User: "Spanish summary"
Response: {
  "primary": "summarize",
  "secondary": ["translate"],
  "isMultiStep": true,
  "executionType": "sequential",
  "executionPlan": [
    {
      "step": 1,
      "agent": "summarizer",
      "action": "summarize_page",
      "input": "current_page",
      "output": "summary_text",
      "params": {"type": "key-points", "length": "medium"}
    },
    {
      "step": 2,
      "agent": "translator",
      "action": "translate_text",
      "input": "summary_text",
      "output": "final_result",
      "params": {"target_language": "es", "source_language": "auto"}
    }
  ],
  "finalOutputLanguage": "es",
  "reasoning": "Spanish summary requires summarization then translation to Spanish - sequential execution",
  "confidence": 0.92
}

User: "Quick French overview"
Response: {
  "primary": "summarize",
  "secondary": ["translate"],
  "isMultiStep": true,
  "executionType": "sequential",
  "executionPlan": [
    {
      "step": 1,
      "agent": "summarizer",
      "action": "summarize_page",
      "input": "current_page",
      "output": "summary_text",
      "params": {"type": "tldr", "length": "short"}
    },
    {
      "step": 2,
      "agent": "translator",
      "action": "translate_text",
      "input": "summary_text",
      "output": "final_result",
      "params": {"target_language": "fr", "source_language": "auto"}
    }
  ],
  "finalOutputLanguage": "fr",
  "reasoning": "Quick French overview requires summarization then translation to French",
  "confidence": 0.93
}

User: "Translate this to Spanish and write a summary"
Response: {
  "primary": "translate",
  "secondary": ["summarize"],
  "isMultiStep": true,
  "executionType": "parallel",
  "executionPlan": [
    {
      "step": 1,
      "agent": "translator",
      "action": "translate_page",
      "input": "current_page",
      "output": "spanish_text",
      "params": {"target_language": "es", "source_language": "auto"}
    },
    {
      "step": 1,
      "agent": "summarizer",
      "action": "summarize_page",
      "input": "current_page",
      "output": "summary_text",
      "params": {"type": "key-points", "length": "medium"}
    }
  ],
  "finalOutputLanguage": null,
  "reasoning": "Translation and summarization are independent tasks that can run in parallel",
  "confidence": 0.85
}

User: "Tell me about this page in Chinese"
Response: {
  "primary": "summarize",
  "secondary": ["translate"],
  "isMultiStep": true,
  "executionType": "sequential",
  "executionPlan": [
    {
      "step": 1,
      "agent": "summarizer",
      "action": "summarize_page",
      "input": "current_page",
      "output": "summary_text",
      "params": {"type": "key-points", "length": "medium"}
    },
    {
      "step": 2,
      "agent": "translator",
      "action": "translate_text",
      "input": "summary_text",
      "output": "final_result",
      "params": {"target_language": "zh", "source_language": "auto"}
    }
  ],
  "finalOutputLanguage": "zh",
  "reasoning": "Requires summarization then translation to Chinese - sequential execution",
  "confidence": 0.90
}

User: "Briefly summarize this page and write sample code for my JavaScript app"
Response: {
  "primary": "summarize",
  "secondary": ["write"],
  "isMultiStep": true,
  "executionType": "sequential",
  "executionPlan": [
    {
      "step": 1,
      "agent": "summarizer",
      "action": "summarize_page",
      "input": "current_page",
      "output": "summary_text",
      "params": {"type": "tldr", "length": "short"}
    },
    {
      "step": 2,
      "agent": "writer",
      "action": "write_content",
      "input": "summary_text",
      "output": "final_result",
      "params": {"content_type": "code", "language": "javascript", "purpose": "sample code for JavaScript app based on page content"}
    }
  ],
  "finalOutputLanguage": null,
  "reasoning": "User wants page summarized first, then use that summary to write sample JavaScript code - sequential execution required",
  "confidence": 0.93
}

User: "Give me an overview and create a code example"
Response: {
  "primary": "summarize",
  "secondary": ["write"],
  "isMultiStep": true,
  "executionType": "sequential",
  "executionPlan": [
    {
      "step": 1,
      "agent": "summarizer",
      "action": "summarize_page",
      "input": "current_page",
      "output": "summary_text",
      "params": {"type": "key-points", "length": "medium"}
    },
    {
      "step": 2,
      "agent": "writer",
      "action": "write_content",
      "input": "summary_text",
      "output": "final_result",
      "params": {"content_type": "code", "language": "auto", "purpose": "code example based on page content"}
    }
  ],
  "finalOutputLanguage": null,
  "reasoning": "User wants overview first, then code example based on that overview - sequential execution",
  "confidence": 0.88
}`;

      // Add page context if available
      let contextInfo = '';
      if (pageContext) {
        contextInfo = `\n\nCURRENT PAGE CONTEXT:
Title: ${pageContext.title || 'Unknown'}
URL: ${pageContext.url || 'Unknown'}
Content available: ${pageContext.content ? 'Yes' : 'No'}`;
      }

      const fullPrompt = `${smartTriagePrompt}${contextInfo}

USER MESSAGE: "${userMessage}"

Analyze this message and provide the smart triage plan as JSON:`;

      // Get AI response with timeout
      console.log('📤 Sending smart triage prompt to AI...');
      let response;
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Smart triage timeout after 120 seconds')), 120000)
        );
        
        const promptPromise = this.prompter.prompt(fullPrompt);
        response = await Promise.race([promptPromise, timeoutPromise]);
        
        console.log('📥 Smart triage AI response received:', response);
        
      } catch (promptError) {
        console.error('❌ Error getting smart triage response:', promptError);
        throw new Error(`Smart triage AI prompt failed: ${promptError.message}`);
      }

      // Parse and validate AI response
      let result;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = JSON.parse(response);
        }
        
        // Validate required fields
        if (!result.primary || !result.hasOwnProperty('isMultiStep')) {
          throw new Error('Smart triage response missing required fields');
        }
        
        console.log('✅ Smart Triage Analysis successful:', {
          primary: result.primary,
          isMultiStep: result.isMultiStep,
          executionType: result.executionType,
          planSteps: result.executionPlan?.length || 0
        });
        
      } catch (parseError) {
        console.error('❌ Failed to parse smart triage response:', parseError);
        throw new Error(`Smart triage response parsing failed: ${parseError.message}`);
      }

      // Return enhanced result
      return {
        primary: result.primary,
        secondary: result.secondary || [],
        isMultiStep: result.isMultiStep || false,
        executionType: result.executionType || 'single',
        executionPlan: result.executionPlan || [],
        finalOutputLanguage: result.finalOutputLanguage || null,
        reasoning: result.reasoning || 'Smart triage analysis completed',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.8)),
        originalMessage: userMessage,
        aiPowered: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 Smart intent detection failed:', error);
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
    
    // Handle multi-step results specially
    if (coordinationResult.processingStats && coordinationResult.processingStats.isMultiStep) {
      return this.formatMultiStepResult(coordinationResult);
    }
    
    // Get the primary result for single-step operations
    const primaryResult = coordinationResult.results.find(r => r.type === 'primary');
    if (primaryResult && primaryResult.result) {
      // Ensure we return a string
      if (typeof primaryResult.result === 'string') {
        return primaryResult.result;
      } else if (primaryResult.result && typeof primaryResult.result === 'object') {
        return primaryResult.result.text || primaryResult.result.message || 
               primaryResult.result.content || JSON.stringify(primaryResult.result);
      } else {
        return String(primaryResult.result);
      }
    }
    
    // Fallback to first result
    const firstResult = coordinationResult.results[0].result;
    if (!firstResult) {
      return 'No result available.';
    }
    if (typeof firstResult === 'string') {
      return firstResult;
    } else if (firstResult && typeof firstResult === 'object') {
      return firstResult.text || firstResult.message || 
             firstResult.content || JSON.stringify(firstResult);
    } else {
      return String(firstResult);
    }
  }

  // Format multi-step results for optimal display
  formatMultiStepResult(coordinationResult) {
    const results = coordinationResult.results;
    const executionType = coordinationResult.executionType;
    
    // For sequential execution, show the final result (last successful step)
    if (executionType === 'sequential') {
      // Get the last successful result as it contains the final processed output
      const successfulResults = results.filter(r => r.success);
      if (successfulResults.length > 0) {
        const finalResult = successfulResults[successfulResults.length - 1];
        
        // Ensure result is a string (should already be markdown-formatted)
        let resultText = '';
        if (typeof finalResult.result === 'string') {
          resultText = finalResult.result;
        } else if (finalResult.result && typeof finalResult.result === 'object') {
          // Handle object results - extract text or stringify
          resultText = finalResult.result.text || finalResult.result.message || 
                       finalResult.result.content || JSON.stringify(finalResult.result);
        } else {
          resultText = String(finalResult.result || 'No result available');
        }
        
        // Add processing note in markdown format for multi-step operations
        if (successfulResults.length > 1) {
          const agentChain = successfulResults.map(r => r.agent).join(' → ');
          const processingNote = `\n\n---\n\n*✨ Multi-Step Processing Completed*\n*🔗 Agent Chain:* ${agentChain}\n*📊 Steps:* ${successfulResults.length}`;
          
          // Add language info if this was a translation operation
          if (coordinationResult.finalOutputLanguage) {
            return resultText + processingNote + `\n*🌐 Output Language:* ${coordinationResult.finalOutputLanguage}`;
          }
          
          return resultText + processingNote;
        }
        
        return resultText;
      }
    }
    
    // For parallel execution, combine results meaningfully with markdown formatting
    if (executionType === 'parallel') {
      const successfulResults = results.filter(r => r.success);
      if (successfulResults.length > 0) {
        // Show all successful results with clear markdown separators
        const formattedResults = successfulResults.map((result, index) => {
          const header = `### ${result.agent.charAt(0).toUpperCase() + result.agent.slice(1)} Result\n\n`;
          // Ensure result is a string (should already be markdown-formatted)
          let resultText = '';
          if (typeof result.result === 'string') {
            resultText = result.result;
          } else if (result.result && typeof result.result === 'object') {
            resultText = result.result.text || result.result.message || 
                        result.result.content || JSON.stringify(result.result);
          } else {
            resultText = String(result.result || 'No result');
          }
          return header + resultText;
        }).join('\n\n---\n\n');
        
        const processingNote = `\n\n---\n\n*✨ Smart Multi-Step Processing:* Completed ${successfulResults.length} parallel operations`;
        return formattedResults + processingNote;
      }
    }
    
    // Fallback: return the first successful result (should be markdown-formatted)
    const firstSuccess = results.find(r => r.success);
    if (firstSuccess) {
      if (typeof firstSuccess.result === 'string') {
        return firstSuccess.result;
      } else if (firstSuccess.result && typeof firstSuccess.result === 'object') {
        return firstSuccess.result.text || firstSuccess.result.message || 
               firstSuccess.result.content || JSON.stringify(firstSuccess.result);
      } else {
        return String(firstSuccess.result || 'No result available');
      }
    }
    return 'Multi-step processing completed but no results available.';
  }

  // Simplified method for chat interfaces - returns just the displayable result
  async processUserMessage(userMessage, pageContext = null) {
    try {
      // Use smart triage for intelligent multi-step coordination
      const coordinationResult = await this.smartTriage(userMessage, pageContext);
      return this.getDisplayableResult(coordinationResult);
    } catch (error) {
      console.error('Error processing user message:', error);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  }

  // Smart triage method that handles complex multi-step requests
  async smartTriage(userMessage, pageContext = null) {
    try {
      console.log('🧠 Smart Triage initiated for:', userMessage);
      console.log('🎯 Context available:', !!pageContext);

      // Validate input
      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        throw new Error('Invalid user message provided to smart triage system');
      }

      // Ensure agents are properly initialized
      if (!this.initialized) {
        console.log('⚠️ AI Agents not initialized, attempting initialization...');
        const initResult = await this.initialize();
        if (!initResult) {
          console.error('❌ Failed to initialize AI Agents for smart triage');
          throw new Error('AI system initialization failed');
        }
      }

      // Enhanced intent detection with multi-step analysis
      console.log('🔍 Enhanced Intent Analysis via Smart Triage');
      let intentResult;
      
      try {
        console.log('🤖 Attempting AI-powered smart intent detection...');
        intentResult = await this.detectSmartIntent(userMessage, pageContext);
        console.log('✅ AI-powered smart intent detected successfully:', {
          primary: intentResult.primary,
          secondary: intentResult.secondary,
          executionPlan: intentResult.executionPlan,
          confidence: intentResult.confidence,
          isMultiStep: intentResult.isMultiStep,
          aiPowered: intentResult.aiPowered
        });
      } catch (intentError) {
        console.error('❌ AI-powered smart intent detection failed:', intentError);
        console.log('🔄 Trying pattern-based multi-step fallback...');
        
        // Try pattern-based multi-step detection
        const multiStepFallback = this.prompter.detectMultiStepIntentFallback(userMessage);
        
        if (multiStepFallback && multiStepFallback.isMultiStep) {
          console.log('✅ Pattern-based multi-step detection successful:', {
            primary: multiStepFallback.primary,
            secondary: multiStepFallback.secondary,
            isMultiStep: multiStepFallback.isMultiStep,
            executionType: multiStepFallback.executionType,
            confidence: multiStepFallback.confidence
          });
          intentResult = multiStepFallback;
        } else {
          // Fallback to regular coordination
          console.log('ℹ️ No multi-step pattern found, falling back to regular coordination...');
          return await this.coordinateTask(userMessage, pageContext);
        }
      }

      // Execute smart coordination based on the execution plan
      if (intentResult.isMultiStep && intentResult.executionPlan) {
        console.log('🚀 Multi-step execution detected!');
        console.log(`📋 Execution Plan: ${intentResult.executionPlan.length} steps (${intentResult.executionType})`);
        console.log(`� Agent Chain: ${intentResult.executionPlan.map(step => step.agent).join(' → ')}`);
        console.log(`🌐 Final Output Language: ${intentResult.finalOutputLanguage || 'original'}`);
        return await this.executeMultiStepPlan(intentResult, userMessage, pageContext);
      } else {
        console.log('🎯 Single-step request detected, using regular coordination');
        return await this.coordinateTask(userMessage, pageContext);
      }

    } catch (error) {
      console.error('💥 Smart Triage failed:', error);
      console.log('🔄 Falling back to regular coordination...');
      
      // Add error context for debugging
      if (error.message.includes('Smart triage AI prompt failed')) {
        console.warn('⚠️ AI model unavailable for smart triage, using pattern-based coordination');
      } else if (error.message.includes('Smart triage response parsing failed')) {
        console.warn('⚠️ AI model gave invalid response for smart triage, using pattern-based coordination');
      } else {
        console.warn('⚠️ Unknown smart triage error, using pattern-based coordination');
      }
      
      // Fallback to regular coordination on any error
      try {
        return await this.coordinateTask(userMessage, pageContext);
      } catch (fallbackError) {
        console.error('💥 Even fallback coordination failed:', fallbackError);
        // Ultimate fallback - create a basic error response
        return {
          intentAnalysis: {
            primary: 'research',
            confidence: 0.5,
            secondary: [],
            reasoning: 'Fallback mode due to system errors',
            aiPowered: false
          },
          results: [{
            type: 'primary',
            result: `I encountered some technical difficulties processing your request. Please try:
            
1. **Refresh the page** and try again
2. **Simplify your request** (e.g., just "summarize this page")  
3. **Check your browser** - Chrome 138+ is required for AI features

Your request: "${userMessage}"

*The system is running in fallback mode.*`,
            success: true
          }],
          success: true,
          timestamp: new Date().toISOString(),
          processingStats: {
            totalAgents: 1,
            successfulAgents: 1,
            failedAgents: 0,
            isMultiStep: false
          }
        };
      }
    }
  }

  // Execute multi-step coordination plan
  async executeMultiStepPlan(intentResult, userMessage, pageContext = null) {
    try {
      console.log('🚀 Multi-Step Execution Starting...');
      console.log(`📊 Plan Overview: ${intentResult.executionType.toUpperCase()} execution with ${intentResult.executionPlan.length} steps`);
      console.log('📋 Execution plan:', intentResult.executionPlan);

      const results = [];
      let intermediateResults = new Map(); // Store intermediate results for sequential processing

      if (intentResult.executionType === 'sequential') {
        console.log('➡️ Sequential execution mode - steps will run one after another');
        console.log(`🔗 Chain: ${intentResult.executionPlan.map(s => s.agent).join(' → ')}`);
        
        // Execute steps in sequence, passing output from one to the next
        for (let i = 0; i < intentResult.executionPlan.length; i++) {
          const step = intentResult.executionPlan[i];
          console.log(`\n🔄 [STEP ${step.step}/${intentResult.executionPlan.length}] Executing: ${step.agent}.${step.action}`);
          console.log(`   Input: ${step.input}`);
          console.log(`   Output destination: ${step.output}`);
          
          try {
            let stepInput;
            let stepResult;
            
            // Determine input for this step
            if (step.input === 'current_page') {
              stepInput = pageContext;
              console.log(`   📄 Using current page as input`);
            } else if (step.input === 'user_message') {
              stepInput = userMessage;
              console.log(`   💬 Using user message as input`);
            } else if (intermediateResults.has(step.input)) {
              stepInput = intermediateResults.get(step.input);
              console.log(`   🔗 Using output from previous step: ${step.input}`);
              console.log(`   📝 Input preview: ${typeof stepInput === 'string' ? stepInput.substring(0, 80) + '...' : typeof stepInput}`);
            } else {
              stepInput = userMessage; // fallback
              console.log(`   ⚠️ Using user message as fallback input`);
            }
            
            // Execute the step based on agent and action
            console.log(`   ⚙️ Executing ${step.agent}.${step.action}...`);
            stepResult = await this.executeAgentStep(step.agent, step.action, stepInput, step.params, pageContext);
            
            // Store result for next steps
            if (step.output) {
              intermediateResults.set(step.output, stepResult);
              console.log(`   💾 Result stored as: ${step.output}`);
            }
            
            results.push({
              step: step.step,
              agent: step.agent,
              action: step.action,
              result: stepResult,
              success: true,
              type: i === intentResult.executionPlan.length - 1 ? 'primary' : 'intermediate'
            });
            
            console.log(`   ✅ [STEP ${step.step}] Completed successfully!`);
            
          } catch (stepError) {
            console.error(`   ❌ [STEP ${step.step}] Failed:`, stepError);
            results.push({
              step: step.step,
              agent: step.agent,
              action: step.action,
              result: `Error in step ${step.step}: ${stepError.message}`,
              success: false,
              error: stepError.message,
              type: 'failed'
            });
            
            // For sequential execution, if a step fails, we can't continue
            console.warn('⚠️ Sequential execution stopped due to step failure');
            break;
          }
        }
        
      } else if (intentResult.executionType === 'parallel') {
        console.log('🔀 Parallel execution mode - steps will run simultaneously');
        
        // Execute all steps in parallel
        const stepPromises = intentResult.executionPlan.map(async (step) => {
          console.log(`🔄 Starting parallel step ${step.step}: ${step.agent} - ${step.action}`);
          
          try {
            let stepInput;
            
            // Determine input for this step
            if (step.input === 'current_page') {
              stepInput = pageContext;
            } else if (step.input === 'user_message') {
              stepInput = userMessage;
            } else {
              stepInput = userMessage; // fallback for parallel execution
            }
            
            const stepResult = await this.executeAgentStep(step.agent, step.action, stepInput, step.params, pageContext);
            
            console.log(`✅ Parallel step ${step.step} completed`);
            
            return {
              step: step.step,
              agent: step.agent,
              action: step.action,
              result: stepResult,
              success: true,
              type: step.step === 1 ? 'primary' : 'secondary' // First step is primary in parallel
            };
            
          } catch (stepError) {
            console.error(`❌ Parallel step ${step.step} failed:`, stepError);
            return {
              step: step.step,
              agent: step.agent,
              action: step.action,
              result: `Error in parallel step ${step.step}: ${stepError.message}`,
              success: false,
              error: stepError.message,
              type: 'failed'
            };
          }
        });
        
        // Wait for all parallel steps to complete
        const parallelResults = await Promise.all(stepPromises);
        results.push(...parallelResults);
      }
      
      // Validate we have at least one successful result
      const successfulResults = results.filter(r => r.success);
      if (successfulResults.length === 0) {
        throw new Error('All multi-step execution failed');
      }
      
      console.log('\n🎉 Multi-step plan execution completed!');
      console.log(`📊 Final Results: ${successfulResults.length} successful, ${results.filter(r => !r.success).length} failed`);
      console.log(`🎯 Final output from: ${successfulResults[successfulResults.length - 1].agent}`);
      
      return {
        intentAnalysis: intentResult,
        results: results,
        success: true,
        executionType: intentResult.executionType,
        finalOutputLanguage: intentResult.finalOutputLanguage,
        timestamp: new Date().toISOString(),
        processingStats: {
          totalSteps: results.length,
          successfulSteps: successfulResults.length,
          failedSteps: results.filter(r => !r.success).length,
          isMultiStep: true
        }
      };
      
    } catch (error) {
      console.error('💥 Multi-step plan execution failed:', error);
      throw new Error(`Multi-step execution failed: ${error.message}`);
    }
  }

  // Execute a specific agent step with given parameters
  async executeAgentStep(agentName, action, input, params = {}, pageContext = null) {
    console.log(`🎯 Executing ${agentName} step: ${action}`);
    console.log('📝 Step parameters:', params);
    
    try {
      switch (agentName) {
        case 'summarizer':
          if (action === 'summarize_page') {
            // Create intent analysis object for summarizer
            const summarizeIntent = {
              summarizationType: params.type || 'key-points',
              summarizationLength: params.length || 'medium'
            };
            const pageResult = await this.summarizeCurrentPage(summarizeIntent);
            
            // For multi-step operations, return just the summary text for clean chaining
            // The final result formatting will be done by the last step
            console.log('📄 Summary generated, returning clean text for chaining');
            return pageResult.summary; // Return just the summary text, not formatted
          } else if (action === 'summarize_text') {
            const summarizeIntent = {
              summarizationType: params.type || 'key-points', 
              summarizationLength: params.length || 'medium'
            };
            // When summarizing text for chaining, return the raw summary (markdown from API)
            const result = await this.summarizeText(input, '', summarizeIntent);
            
            // Return the summary text - it's already in markdown format from the API
            if (typeof result === 'string') {
              return result;
            } else if (result && typeof result === 'object') {
              // Handle object results (shouldn't happen but defensive coding)
              return result.summary || result.text || result.result || JSON.stringify(result);
            } else {
              return String(result || 'Summarization completed but no text returned');
            }
          }
          break;
          
        case 'translator':
          if (action === 'translate_page') {
            const translateIntent = {
              targetLanguage: params.target_language,
              sourceLanguage: params.source_language || 'auto'
            };
            const result = await this.translateCurrentPage(params.target_language, translateIntent);
            
            // Format the result consistently
            if (result.translation.skipped) {
              return `**Page Translation**\n\n${result.translation.message}\n\n*Page: "${result.title}"*`;
            }
            
            return `**Translation of "${result.title}"**\n\n${result.translation.translatedText}\n\n*Translated from ${result.sourceLanguage} to ${result.targetLanguage}*`;
            
          } else if (action === 'translate_text') {
            // For translate_text, input should be text (from previous step)
            // Since we now return clean text from summarizer, we can use it directly
            const textToTranslate = typeof input === 'string' ? input : String(input);
            
            console.log('📝 Input to translate_text (length):', textToTranslate.length);
            console.log('📝 Text preview:', textToTranslate.substring(0, 200) + '...');
            
            // Validate we have text to translate
            if (!textToTranslate || textToTranslate.trim().length === 0) {
              throw new Error('No text content found to translate');
            }
            
            const result = await this.translateText(
              textToTranslate, 
              params.target_language, 
              params.source_language || 'auto',
              { targetLanguage: params.target_language, sourceLanguage: params.source_language || 'auto' }
            );
            
            if (result.skipped) {
              return `**Translation Result**\n\n${result.message || 'Translation skipped'}`;
            }
            
            // Extract the translated text
            const translatedText = typeof result.translatedText === 'string' ? result.translatedText :
                                  (result && typeof result === 'object' ? 
                                   (result.text || result.translation || JSON.stringify(result)) :
                                   String(result || 'Translation completed but no text returned'));
            
            console.log('✅ Translation completed (length):', translatedText.length);
            console.log('✅ Translated text preview:', translatedText.substring(0, 200) + '...');
            
            // Return the translated text with formatting for display
            return `**Translation (${params.target_language})**\n\n${translatedText}`;
          }
          break;
          
        case 'writer':
          if (action === 'write_content') {
            const contextInfo = pageContext ? `Context: ${pageContext.title} - ${pageContext.url}` : '';
            return await this.writeContent(input, contextInfo, params);
          }
          break;
          
        case 'prompter':
          if (action === 'research_query') {
            return await this.handleResearchQuery(input, pageContext);
          } else if (action === 'process_prompt') {
            return await this.processPrompt(input, pageContext);
          }
          break;
          
        default:
          throw new Error(`Unknown agent: ${agentName}`);
      }
      
      throw new Error(`Unknown action ${action} for agent ${agentName}`);
      
    } catch (error) {
      console.error(`❌ Agent step execution failed: ${agentName}.${action}`, error);
      throw error;
    }
  }

  // Test the multi-agent coordination system including smart triage
  async testMultiAgentSystem() {
    console.log('🧪 Testing Enhanced Multi-Agent Coordination System...');
    
    const tests = [
      {
        name: 'Single-step Summarization',
        message: 'Can you summarize this page for me?',
        expectedIntent: 'summarize',
        expectedMultiStep: false
      },
      {
        name: 'Single-step Translation',
        message: 'Translate this to Spanish',
        expectedIntent: 'translate',
        expectedMultiStep: false
      },
      {
        name: 'Multi-step: Brief Overview in German',
        message: 'Give me a brief overview in German',
        expectedIntent: 'summarize',
        expectedMultiStep: true,
        expectedSteps: ['summarizer', 'translator']
      },
      {
        name: 'Multi-step: Spanish Summary',
        message: 'Provide a Spanish summary of this page',
        expectedIntent: 'summarize',
        expectedMultiStep: true,
        expectedSteps: ['summarizer', 'translator']
      },
      {
        name: 'Multi-step: Research and Write',
        message: 'Research machine learning and write a brief explanation',
        expectedIntent: 'research',
        expectedMultiStep: true,
        expectedSteps: ['prompter', 'writer']
      },
      {
        name: 'Writing Intent',
        message: 'Help me write an email',
        expectedIntent: 'write',
        expectedMultiStep: false
      }
    ];

    const results = [];
    
    for (const test of tests) {
      console.log(`\n🔍 Testing: ${test.name}`);
      
      try {
        const startTime = Date.now();
        // Use smart triage for testing
        const result = await this.smartTriage(test.message);
        const duration = Date.now() - startTime;
        
        const intentMatch = result.intentAnalysis.primary === test.expectedIntent;
        const multiStepMatch = !test.hasOwnProperty('expectedMultiStep') || 
                              (result.intentAnalysis.isMultiStep === test.expectedMultiStep);
        
        let stepsMatch = true;
        if (test.expectedSteps && result.processingStats && result.processingStats.isMultiStep) {
          const actualSteps = result.results.filter(r => r.success).map(r => r.agent);
          stepsMatch = test.expectedSteps.every(step => actualSteps.includes(step));
        }
        
        const success = intentMatch && multiStepMatch && stepsMatch;
        
        results.push({
          test: test.name,
          message: test.message,
          expectedIntent: test.expectedIntent,
          detectedIntent: result.intentAnalysis.primary,
          confidence: result.intentAnalysis.confidence,
          aiPowered: result.intentAnalysis.aiPowered,
          isMultiStep: result.intentAnalysis.isMultiStep,
          expectedMultiStep: test.expectedMultiStep,
          executionType: result.executionType,
          agentsUsed: result.results.length,
          successfulAgents: result.results.filter(r => r.success).length,
          actualSteps: result.processingStats && result.processingStats.isMultiStep ? 
                      result.results.filter(r => r.success).map(r => r.agent) : [],
          expectedSteps: test.expectedSteps || [],
          duration: duration,
          success: success,
          intentMatch: intentMatch,
          multiStepMatch: multiStepMatch,
          stepsMatch: stepsMatch
        });
        
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${result.intentAnalysis.primary} ${result.intentAnalysis.isMultiStep ? '(multi-step)' : '(single-step)'} (${(result.intentAnalysis.confidence * 100).toFixed(0)}% confidence, ${duration}ms)`);
        
        if (!success) {
          if (!intentMatch) console.log(`  ⚠️ Intent mismatch: expected ${test.expectedIntent}, got ${result.intentAnalysis.primary}`);
          if (!multiStepMatch) console.log(`  ⚠️ Multi-step mismatch: expected ${test.expectedMultiStep}, got ${result.intentAnalysis.isMultiStep}`);
          if (!stepsMatch) console.log(`  ⚠️ Steps mismatch: expected [${test.expectedSteps?.join(', ')}], got [${result.results.filter(r => r.success).map(r => r.agent).join(', ')}]`);
        }
        
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
        console.log('🔄 Fallback intent result:', {
          primary: intentResult.primary,
          confidence: intentResult.confidence,
          aiPowered: intentResult.aiPowered,
          secondary: intentResult.secondary
        });
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
          
          // Check translator availability first
          try {
            const translatorCaps = await this.translator.getCapabilities();
            console.log('📊 Translator capabilities:', translatorCaps);
            
            if (!translatorCaps.translator.supported) {
              throw new Error('Translator API is not supported in this browser. Please ensure you have Chrome 138+ with AI features enabled.');
            }
            
            if (!translatorCaps.translator.available) {
              throw new Error('Translator API is not available on this device. Please check system requirements: 16GB+ RAM, 22GB+ storage space.');
            }
            
            if (translatorCaps.translator.availability === 'after-download' && (!navigator.userActivation || !navigator.userActivation.isActive)) {
              throw new Error('User interaction required for AI model download. Please click a button or interact with the page first.');
            }
            
          } catch (capError) {
            console.error('❌ Translator capability check failed:', capError);
            throw new Error(`Translator not ready: ${capError.message}`);
          }
          
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
            console.log('📊 Using intent analysis for page translation:', {
              targetLang: intentAnalysis?.targetLanguage,
              sourceLang: intentAnalysis?.sourceLanguage
            });
            try {
              const translationResult = await this.translateCurrentPage(translationOptions.targetLang, intentAnalysis);
              
              if (translationResult.translation.skipped) {
                return `**Page Translation**\n\n${translationResult.translation.message}\n\n*Page: "${translationResult.title}"*\n*Source: ${translationResult.url}*`;
              }
              
              return `**Translation of "${translationResult.title}"**\n\n${translationResult.translation.translatedText}\n\n*Translated from ${translationResult.sourceLanguage} to ${translationResult.targetLanguage}*\n*Source: ${translationResult.url}*${translationResult.truncated ? '\n*Note: Content was truncated for translation*' : ''}`;
            } catch (pageTransError) {
              console.error('❌ Page translation failed:', pageTransError);
              throw new Error(`Page translation failed: ${pageTransError.message}`);
            }
          } else {
            console.log('📃 Translating provided text');
            // For text translation, extract text from the prompt
            const textMatch = craftedPrompt.match(/"([^"]+)"|'([^']+)'|translate\s+(.+?)(?:\s+to\s+\w+)?$/i);
            const textToTranslate = textMatch ? (textMatch[1] || textMatch[2] || textMatch[3]) : craftedPrompt;
            
            if (!textToTranslate || textToTranslate.trim().length === 0) {
              throw new Error('No text provided for translation. Please specify what you want to translate.');
            }
            
            // Use intent analysis parameters or fallback to extraction
            const finalTargetLang = translationOptions.targetLang || 
                                   (intentAnalysis?.targetLanguage) || 
                                   this.extractTargetLanguage(craftedPrompt);
            const finalSourceLang = translationOptions.sourceLang || 
                                   (intentAnalysis?.sourceLanguage) || 
                                   'auto';
            
            console.log(`🎯 Translation parameters: ${finalSourceLang} → ${finalTargetLang}`);
            
            try {
              const translationResult = await this.translateText(textToTranslate, finalTargetLang, finalSourceLang, intentAnalysis);
              
              if (translationResult.skipped) {
                return `**Translation Result**\n\n${translationResult.message}`;
              }
              
              return `**Translation**\n\n${translationResult.translatedText}\n\n*Translated from ${translationResult.sourceLanguage} to ${translationResult.targetLanguage}*\n*Word count: ${translationResult.wordCount}*`;
            } catch (textTransError) {
              console.error('❌ Text translation failed:', textTransError);
              throw new Error(`Text translation failed: ${textTransError.message}`);
            }
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
      let errorMessage = agentError.message; // Keep original error message by default
      
      // Only modify error messages for specific cases, but preserve detailed error info
      if (agentError.message.includes('Chrome 138+') || agentError.message.includes('chrome://flags')) {
        // Already has detailed browser requirement info, keep it as is
        errorMessage = agentError.message;
      } else if (agentError.message.includes('not available') || agentError.message.includes('not supported')) {
        // Generic "not available" - add browser requirement info
        errorMessage = `${intent} functionality: ${agentError.message}\n\nPlease check:\n1. Chrome version 138+ (Canary/Dev)\n2. chrome://flags/#translation-api enabled\n3. Chrome restarted after enabling flag`;
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