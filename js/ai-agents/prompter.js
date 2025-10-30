// Prompter Agent Module
// Handles Chrome Built-in AI Language Model API interactions and intent detection

class PrompterAgent {
  constructor() {
    this.prompter = null;
    this.preferredLanguage = 'en';
  }

  // Set preferred language
  setPreferredLanguage(language) {
    const supportedLanguages = ['en', 'ja', 'es'];
    if (!supportedLanguages.includes(language)) {
      console.warn(`Language '${language}' not supported for Language Model. Supported languages: ${supportedLanguages.join(', ')}. Defaulting to 'en'.`);
      this.preferredLanguage = 'en';
      return false;
    }
    
    console.log(`Setting preferred Language Model language to: ${language}`);
    this.preferredLanguage = language;
    
    // If we have active agent, we may need to recreate it with the new language
    if (this.prompter) {
      console.log('Note: Existing Language Model will use the new language on next creation');
    }
    
    return true;
  }

  // Create prompter/language model instance with proper availability checking
  async createPrompter(options = {}) {
    try {
      console.log('Creating Language Model session...');
      
      // First, check if LanguageModel API is available in window
      if (!window.LanguageModel) {
        throw new Error('LanguageModel API not available. Please ensure you are using Chrome 138+ with AI features enabled.');
      }

      // Get model parameters first to use in both availability check and create
      let modelParams;
      try {
        modelParams = await window.LanguageModel.params();
        console.log('Language Model params:', modelParams);
      } catch (error) {
        console.warn('Could not get Language Model params, using defaults:', error);
        modelParams = {defaultTopK: 3, maxTopK: 128, defaultTemperature: 1, maxTemperature: 2};
      }

      // Set up options with model defaults
      const defaultOptions = {
        temperature: modelParams?.defaultTemperature || 0.8,
        topK: modelParams?.defaultTopK || 3,
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Gemini Nano model download: ${(e.loaded * 100).toFixed(1)}%`);
            // Send progress update to UI if AIUtils is available
            if (typeof AIUtils !== 'undefined' && AIUtils.notifyProgress) {
              AIUtils.notifyProgress('prompter', e.loaded * 100);
            }
          });
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Check availability with the SAME options that will be used in create()
      // This is critical according to Chrome documentation
      console.log('Checking Language Model availability with options:', finalOptions);
      const availability = await window.LanguageModel.availability(finalOptions);
      console.log('Language Model availability:', availability);

      if (availability === 'no') {
        throw new Error('Language Model API is not available on this device. Please check system requirements: Chrome 138+, 16GB+ RAM, 22GB+ free storage.');
      }

      // Check for user activation requirement (required for model downloads)
      if (availability === 'after-download' && (!navigator.userActivation || !navigator.userActivation.isActive)) {
        throw new Error('User interaction required for model download. Please click a button or interact with the page first.');
      }

      if (availability === 'after-download') {
        console.log('Gemini Nano model needs to be downloaded - this may take time');
      } else if (availability === 'readily') {
        console.log('Gemini Nano model is ready for immediate use');
      }

      console.log('Creating Language Model session with final options:', finalOptions);
      
      // Create language model session
      this.prompter = await window.LanguageModel.create(finalOptions);
      
      console.log('✅ Language Model session created successfully');
      return this.prompter;

    } catch (error) {
      console.error('❌ Error creating prompter:', error);
      
      // Provide helpful error messages based on error type
      if (error.message.includes('NotSupportedError') || error.message.includes('not supported')) {
        const helpfulMessage = 'Language Model API not supported. Please ensure:\n' +
          '1. Using Chrome 138 or later\n' +
          '2. AI features are enabled in chrome://flags/\n' +
          '3. Device meets requirements (16GB+ RAM, 22GB+ storage)';
        throw new Error(helpfulMessage);
      } else if (error.message.includes('SecurityError') || error.message.includes('permission')) {
        throw new Error('Permission denied. User interaction required - please click a button first.');
      } else if (error.message.includes('QuotaExceededError')) {
        throw new Error('Insufficient storage space. At least 22GB free space required for model download.');
      }
      
      throw new Error(`Failed to create Language Model session: ${error.message}`);
    }
  }

  // Intelligent intent detection using Gemini Nano
  async detectIntentWithAI(userMessage, pageContext = null) {
    try {
      console.log('🧠 Starting AI-powered intent detection for:', userMessage);
      
      // Validate input
      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        throw new Error('No valid message provided for intent detection');
      }

      // Initialize prompter if needed
      if (!this.prompter) {
        console.log('🔧 Prompter not initialized, creating...');
        try {
          await this.createPrompter();
          console.log('✅ Prompter created successfully');
        } catch (createError) {
          console.error('❌ Failed to create prompter:', createError);
          throw new Error(`Prompter initialization failed: ${createError.message}`);
        }
      }

      console.log('🤖 Using AI-powered intent detection with Gemini Nano');

      // Create a comprehensive system prompt for intent classification
      const systemPrompt = `You are an intelligent intent classifier for a browser extension that helps users with various tasks. Your job is to analyze user messages and classify their intent into one of these categories:

INTENT CATEGORIES:
1. "summarize" - User wants to summarize content (page, article, text, document)
2. "translate" - User wants to translate text or page content to another language
3. "write" - User wants help writing, composing, drafting, or creating content
4. "research" - User wants to research, learn about, or get information on a topic

CLASSIFICATION RULES:
- If the user mentions summarize, summary, tldr, overview, brief, main points, or wants to condense content → "summarize"
- If the user mentions translate, translation, convert language, or specific language names → "translate"  
- If the user mentions write, compose, draft, create, generate, or help with writing → "write"
- If the user mentions research, find, search, learn, explain, tell me about, what is → "research"
- A message can have multiple intents - identify the primary one and any secondary intents
- Consider context clues and implied meanings

SUMMARIZATION TYPE DETECTION:
When the intent is "summarize", also determine the specific summarization type:
- "key-points" - User wants bullet points, main points, key takeaways, important points, highlights, structured summary
- "tldr" - User wants a quick summary, brief overview, short summary, tldr, condensed version, executive summary
- "teaser" - User wants an intriguing preview, teaser, hook, something to draw interest, compelling preview
- "headline" - User wants a title, headline, single sentence summary, main point in headline format, one-liner

SUMMARIZATION LENGTH DETECTION:
When the intent is "summarize", also determine the desired length:
- "short" - User wants brief, short, quick, concise, compact summary (few sentences)
- "medium" - User wants balanced, standard, regular summary (default if not specified)
- "long" - User wants detailed, comprehensive, thorough, in-depth, extensive summary (multiple paragraphs)

EXAMPLES OF SUMMARIZATION DETECTION:
- "Give me the key points from this article" → type: "key-points", length: "medium"
- "Quick tldr of this page" → type: "tldr", length: "short"
- "Summarize this in detail" → type: "key-points", length: "long"
- "Brief summary please" → type: "tldr", length: "short"
- "What are the main points?" → type: "key-points", length: "medium"
- "Give me a headline for this" → type: "headline", length: "short"
- "Create an intriguing teaser" → type: "teaser", length: "medium"
- "Comprehensive summary needed" → type: "key-points", length: "long"

TRANSLATION PARAMETERS DETECTION:
When the intent is "translate", also determine:
- Target language: Extract the language the user wants to translate TO (e.g., "translate to Spanish" → target_language: "es")
- Source language: Extract the language they want to translate FROM (e.g., "translate from French" → source_language: "fr"), use "auto" if not specified
- Language codes: Use ISO 639-1 codes (en=English, es=Spanish, fr=French, de=German, it=Italian, pt=Portuguese, ru=Russian, ja=Japanese, ko=Korean, zh=Chinese, ar=Arabic, hi=Hindi, tr=Turkish, pl=Polish, nl=Dutch, sv=Swedish, da=Danish, no=Norwegian, fi=Finnish)

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "primary": "intent_name",
  "confidence": 0.0-1.0,
  "secondary": ["intent_name1", "intent_name2"] or null,
  "reasoning": "brief explanation of why this intent was chosen",
  "crafted_prompt": "an enhanced version of the user message optimized for the target agent",
  "summarization_type": "key-points|tldr|teaser|headline" (only when primary intent is "summarize"),
  "summarization_length": "short|medium|long" (only when primary intent is "summarize"),
  "target_language": "language_code" (only when primary intent is "translate"),
  "source_language": "language_code or auto" (only when primary intent is "translate")
}`;

      // Add page context if available
      let contextInfo = '';
      if (pageContext) {
        contextInfo = `\n\nCURRENT PAGE CONTEXT:
Title: ${pageContext.title || 'Unknown'}
URL: ${pageContext.url || 'Unknown'}
Content Preview: ${pageContext.contentPreview || 'Not available'}`;
      }

      const fullPrompt = `${systemPrompt}${contextInfo}

USER MESSAGE: "${userMessage}"

Analyze this message and respond with the JSON classification:`;

      // Get AI classification with timeout
      console.log('📤 Sending prompt to Gemini Nano...');
      let response;
      
      try {
        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI intent detection timeout after 30 seconds')), 30000)
        );
        
        const promptPromise = this.prompter.prompt(fullPrompt);
        response = await Promise.race([promptPromise, timeoutPromise]);
        
        console.log('📥 Raw AI response received:', response);
        
      } catch (promptError) {
        console.error('❌ Error getting response from AI:', promptError);
        throw new Error(`AI prompt failed: ${promptError.message}`);
      }

      // Parse AI response
      let result;
      try {
        // Try to extract JSON from the response (it might have extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = JSON.parse(response);
        }
        
        // Validate the parsed result
        if (!result.primary || typeof result.primary !== 'string') {
          throw new Error('AI response missing valid primary intent');
        }
        
        const validIntents = ['summarize', 'translate', 'write', 'research'];
        if (!validIntents.includes(result.primary)) {
          throw new Error(`AI response contains invalid primary intent: ${result.primary}`);
        }
        
        console.log('✅ AI Intent Detection successful:', {
          primary: result.primary,
          confidence: result.confidence || 0.8,
          secondary: result.secondary || [],
          aiPowered: true
        });
        
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response that failed parsing:', response);
        throw new Error(`AI response parsing failed: ${parseError.message}`);
      }

      // Return structured result
      return {
        primary: result.primary,
        confidence: Math.max(0, Math.min(1, result.confidence || 0.8)), // Ensure 0-1 range
        secondary: Array.isArray(result.secondary) ? result.secondary : [],
        reasoning: result.reasoning || `AI classified as ${result.primary}`,
        craftedPrompt: result.crafted_prompt || userMessage,
        originalMessage: userMessage,
        aiPowered: true,
        // Summarization-specific properties
        summarizationType: result.summarization_type || null,
        summarizationLength: result.summarization_length || null,
        // Translation-specific properties
        targetLanguage: result.target_language || null,
        sourceLanguage: result.source_language || null,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 AI intent detection failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500) // Limit stack trace length
      });
      
      // Provide specific error categorization
      let errorCategory = 'unknown';
      if (error.message.includes('Language Model API') || error.message.includes('prompter')) {
        errorCategory = 'api_unavailable';
        console.error('🚫 This appears to be a Language Model API availability issue');
      } else if (error.message.includes('JSON') || error.message.includes('parsing')) {
        errorCategory = 'response_parsing';
        console.error('🔧 This appears to be a response parsing issue - the AI may have given a non-JSON response');
      } else if (error.message.includes('timeout')) {
        errorCategory = 'timeout';
        console.error('⏱️ AI request timed out');
      } else {
        errorCategory = 'unexpected';
        console.error('❓ This appears to be an unexpected error during AI processing');
      }
      
      // Always fallback to pattern-based detection
      console.log('🔄 Falling back to pattern-based intent detection...');
      try {
        const fallbackResult = this.detectIntentFallback(userMessage);
        console.log('✅ Fallback intent detection completed:', fallbackResult);
        
        // Add error info to fallback result
        fallbackResult.aiError = {
          category: errorCategory,
          message: error.message,
          timestamp: new Date().toISOString()
        };
        
        return fallbackResult;
      } catch (fallbackError) {
        console.error('💥 Even fallback intent detection failed:', fallbackError);
        
        // Return default research intent as last resort
        return {
          primary: 'research',
          confidence: 0.1,
          secondary: [],
          reasoning: 'Default fallback due to system errors',
          craftedPrompt: userMessage,
          originalMessage: userMessage,
          aiPowered: false,
          fallbackUsed: true,
          error: {
            ai: error.message,
            fallback: fallbackError.message,
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  }

  // Fallback intent detection using patterns
  detectIntentFallback(message) {
    const intents = {
      summarize: {
        keywords: ['summarize', 'summary', 'tldr', 'brief', 'overview', 'sum up', 'digest', 'condense'],
        patterns: [
          /summarize (this|the|current)? ?(page|article|content|text)/i,
          /give me a (summary|overview|brief)/i,
          /what (is|are) the (main|key) points/i,
          /tldr/i,
          /can you summarize/i
        ]
      },
      translate: {
        keywords: ['translate', 'translation', 'convert', 'language'],
        patterns: [
          /translate (this|the|current)? ?(page|text|content)? ?(to|into|in) ?\w+/i,
          /(spanish|french|german|chinese|japanese|italian|portuguese)\s+(translation|version)/i,
          /what does this mean in \w+/i,
          /convert to \w+ language/i
        ]
      },
      write: {
        keywords: ['write', 'compose', 'draft', 'create', 'help me write', 'generate'],
        patterns: [
          /help me write (a|an)? ?\w+/i,
          /compose (a|an)? ?\w+/i,
          /draft (a|an)? ?\w+/i,
          /create (a|an)? ?\w+/i,
          /generate (a|an)? ?\w+/i
        ]
      },
      research: {
        keywords: ['research', 'find', 'search', 'learn', 'tell me about', 'explain', 'what is'],
        patterns: [
          /tell me about \w+/i,
          /what is \w+/i,
          /explain \w+/i,
          /research \w+/i,
          /find (information|info) about/i,
          /learn (more )?about/i
        ]
      }
    };
    
    const lowerMessage = message.toLowerCase();
    const scores = {};
    
    // Score each intent
    for (const [intent, config] of Object.entries(intents)) {
      let score = 0;
      
      // Check keywords
      for (const keyword of config.keywords) {
        if (lowerMessage.includes(keyword)) {
          score += 1;
        }
      }
      
      // Check patterns
      for (const pattern of config.patterns) {
        if (pattern.test(message)) {
          score += 2;
        }
      }
      
      scores[intent] = score;
    }
    
    // Sort intents by score and identify primary and secondary intents
    const sortedIntents = Object.entries(scores)
      .filter(([intent, score]) => score > 0)
      .sort(([,a], [,b]) => b - a);
    
    let topIntent = 'research'; // default
    let maxScore = 0;
    const secondary = [];
    
    if (sortedIntents.length > 0) {
      topIntent = sortedIntents[0][0];
      maxScore = sortedIntents[0][1];
      
      // Add secondary intents
      for (let i = 1; i < sortedIntents.length; i++) {
        const [intent, score] = sortedIntents[i];
        if (score >= 1) {
          secondary.push(intent);
        }
      }
    }
    
    // Detect summarization-specific parameters
    let summarizationType = null;
    let summarizationLength = null;
    
    if (topIntent === 'summarize' || secondary.includes('summarize')) {
      // Detect summarization type with more comprehensive patterns
      if (lowerMessage.includes('tldr') || lowerMessage.includes('brief') || 
          lowerMessage.includes('quick') || lowerMessage.includes('condensed') ||
          lowerMessage.includes('executive summary') || lowerMessage.includes('overview')) {
        summarizationType = 'tldr';
      } else if (lowerMessage.includes('key points') || lowerMessage.includes('main points') || 
                 lowerMessage.includes('bullet') || lowerMessage.includes('list') ||
                 lowerMessage.includes('highlights') || lowerMessage.includes('takeaways') ||
                 lowerMessage.includes('important points') || lowerMessage.includes('structured')) {
        summarizationType = 'key-points';
      } else if (lowerMessage.includes('teaser') || lowerMessage.includes('preview') || 
                 lowerMessage.includes('hook') || lowerMessage.includes('intriguing') ||
                 lowerMessage.includes('compelling') || lowerMessage.includes('draw interest')) {
        summarizationType = 'teaser';
      } else if (lowerMessage.includes('headline') || lowerMessage.includes('title') || 
                 lowerMessage.includes('one sentence') || lowerMessage.includes('one-liner') ||
                 lowerMessage.includes('main point') || lowerMessage.includes('in a sentence')) {
        summarizationType = 'headline';
      } else {
        summarizationType = 'key-points'; // Default
      }
      
      // Detect length with more comprehensive patterns
      if (lowerMessage.includes('short') || lowerMessage.includes('brief') || 
          lowerMessage.includes('quick') || lowerMessage.includes('concise') ||
          lowerMessage.includes('compact') || lowerMessage.includes('few sentences')) {
        summarizationLength = 'short';
      } else if (lowerMessage.includes('long') || lowerMessage.includes('detailed') || 
                 lowerMessage.includes('comprehensive') || lowerMessage.includes('thorough') ||
                 lowerMessage.includes('in-depth') || lowerMessage.includes('extensive') ||
                 lowerMessage.includes('multiple paragraphs') || lowerMessage.includes('full summary')) {
        summarizationLength = 'long';
      } else if (lowerMessage.includes('medium') || lowerMessage.includes('standard') ||
                 lowerMessage.includes('regular') || lowerMessage.includes('balanced')) {
        summarizationLength = 'medium';
      } else {
        // Smart defaults based on type
        if (summarizationType === 'tldr' || summarizationType === 'headline') {
          summarizationLength = 'short';
        } else if (summarizationType === 'teaser') {
          summarizationLength = 'medium';
        } else {
          summarizationLength = 'medium'; // Default for key-points
        }
      }
    }
    
    // Detect translation-specific parameters
    let targetLanguage = null;
    let sourceLanguage = 'auto';
    
    if (topIntent === 'translate' || secondary.includes('translate')) {
      targetLanguage = AIUtils.extractTargetLanguage(message, this.preferredLanguage);
    }
    
    return { 
      primary: topIntent, 
      confidence: Math.min(maxScore / 3, 1.0),
      secondary: secondary,
      reasoning: `Pattern-based classification (fallback) - found ${sortedIntents.length} intents`,
      craftedPrompt: message,
      originalMessage: message,
      aiPowered: false,
      summarizationType: summarizationType,
      summarizationLength: summarizationLength,
      targetLanguage: targetLanguage,
      sourceLanguage: sourceLanguage
    };
  }

  // Handle research queries using the prompter
  async handleResearchQuery(query, pageContext = null) {
    try {
      console.log('Starting research query:', query);
      
      if (!this.prompter) {
        console.log('Prompter not initialized for research query, creating...');
        await this.createPrompter();
      }

      let contextualPrompt = query;
      
      // Add page context if available and relevant
      if (pageContext && (query.toLowerCase().includes('this page') || query.toLowerCase().includes('current page'))) {
        contextualPrompt = `Based on the current page "${pageContext.title}" (${pageContext.url}), ${query}
        
        ${pageContext.contentPreview ? `Page content: ${pageContext.contentPreview}` : ''}`;
      }

      // Create a research-focused system prompt
      const researchPrompt = `You are a helpful research assistant. Provide accurate, informative, and well-structured responses to user queries. If you don't know something, say so rather than guessing.

User query: ${contextualPrompt}

Please provide a comprehensive response:`;

      console.log('Sending research query to Gemini Nano...');
      const response = await this.prompter.prompt(researchPrompt);
      console.log('✅ Research query completed successfully');
      return response;

    } catch (error) {
      console.error('❌ Error handling research query:', error);
      throw new Error(`Research query failed: ${error.message}`);
    }
  }

  // Process a user message with intelligent prompt handling
  async processPrompt(prompt, systemContext = null) {
    try {
      if (!this.prompter) {
        await this.createPrompter();
      }

      if (!prompt || prompt.trim().length === 0) {
        throw new Error('No prompt provided');
      }

      let fullPrompt = prompt;
      
      // Add system context if provided
      if (systemContext) {
        fullPrompt = `${systemContext}\n\nUser: ${prompt}\n\nAssistant:`;
      }

      console.log('Processing prompt with Language Model...');
      const response = await this.prompter.prompt(fullPrompt);
      
      console.log('Prompt processed successfully');
      return response;

    } catch (error) {
      console.error('Error processing prompt:', error);
      throw new Error(`Prompt processing failed: ${error.message}`);
    }
  }

  // Destroy prompter instance
  async destroy() {
    if (this.prompter) {
      try {
        this.prompter.destroy();
        this.prompter = null;
        console.log('Prompter destroyed');
      } catch (error) {
        console.error('Error destroying prompter:', error);
      }
    }
  }

  // Get prompter capabilities with proper checking
  async getCapabilities() {
    try {
      if (!window.LanguageModel) {
        return {
          supported: false,
          availability: 'no',
          available: false,
          ready: false,
          passed: false,
          instanceReady: !!this.prompter,
          error: 'LanguageModel API not found in window object',
          lastChecked: new Date().toISOString()
        };
      }

      // Get model parameters for proper availability check
      let modelParams;
      try {
        modelParams = await window.LanguageModel.params();
      } catch (error) {
        modelParams = {defaultTopK: 3, defaultTemperature: 1};
      }

      const options = {
        temperature: modelParams.defaultTemperature || 1,
        topK: modelParams.defaultTopK || 3
      };

      // Check availability with proper options
      const availability = await window.LanguageModel.availability(options);
      
      const capabilities = {
        supported: true,
        availability: availability,
        available: availability !== 'no',
        ready: availability === 'readily',
        passed: availability === 'readily' || availability === 'after-download',
        instanceReady: !!this.prompter,
        error: availability === 'no' ? 'LanguageModel not available on this device' : null,
        modelParams: modelParams,
        lastChecked: new Date().toISOString()
      };

      console.log('LanguageModel capabilities:', capabilities);
      return capabilities;

    } catch (error) {
      console.error('Error checking LanguageModel capabilities:', error);
      return {
        supported: false,
        availability: 'no',
        available: false,
        ready: false,
        passed: false,
        instanceReady: !!this.prompter,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  // Quick test method for prompter functionality
  async testPrompter() {
    try {
      console.log('🧪 Testing Prompter Agent...');
      
      const capabilities = await this.getCapabilities();
      console.log('✓ Capabilities Check:', capabilities);
      
      if (!capabilities.supported) {
        throw new Error('Language Model API not supported in this browser. Please use Chrome 138+ with AI features enabled.');
      }

      if (!capabilities.available) {
        throw new Error('Language Model API not available on this device. Check system requirements: 16GB+ RAM, 22GB+ storage.');
      }

      // If model needs download, warn user
      if (capabilities.availability === 'after-download') {
        console.log('⚠️ Model download required - this may take time');
        
        // Check user activation
        if (!navigator.userActivation || !navigator.userActivation.isActive) {
          throw new Error('User interaction required for model download. Please click a button first.');
        }
      }

      // Test simple prompt processing
      const testPrompt = 'Say hello and introduce yourself briefly.';
      console.log('Testing prompt processing...');
      const response = await this.processPrompt(testPrompt);
      
      console.log('✓ Prompt Processing Test Results:');
      console.log(`  Prompt: "${testPrompt}"`);
      console.log(`  Response: "${response}"`);
      
      // Test intent detection
      console.log('Testing intent detection...');
      const intentTest = await this.detectIntentWithAI('Can you summarize this page for me?');
      console.log('✓ Intent Detection Test:');
      console.log(`  Detected intent: ${intentTest.primary} (confidence: ${intentTest.confidence})`);
      console.log(`  AI-powered: ${intentTest.aiPowered}`);
      
      return {
        success: true,
        capabilities: capabilities,
        promptResponse: response,
        intentDetection: intentTest,
        message: 'All tests passed successfully!'
      };

    } catch (error) {
      console.error('❌ Prompter test failed:', error);
      
      // Provide more helpful error messages
      let helpfulMessage = error.message;
      if (error.message.includes('not supported')) {
        helpfulMessage += '\n\nPlease check:\n1. Chrome version 138+\n2. AI flags enabled in chrome://flags/\n3. Visit chrome://on-device-internals/ for model status';
      } else if (error.message.includes('not available')) {
        helpfulMessage += '\n\nSystem requirements:\n1. 16GB+ RAM\n2. 22GB+ free storage\n3. Compatible GPU (4GB+ VRAM) or CPU (4+ cores)';
      } else if (error.message.includes('User interaction')) {
        helpfulMessage += '\n\nClick this test button or interact with the page to enable model download.';
      }
      
      return {
        success: false,
        error: error.message,
        helpfulMessage: helpfulMessage,
        capabilities: capabilities || null
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrompterAgent;
} else if (typeof window !== 'undefined') {
  window.PrompterAgent = PrompterAgent;
}