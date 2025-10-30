// AI Agents Main Entry Point
// Loads all modules in the correct order and maintains backward compatibility

(function() {
  'use strict';
  
  // Check if we're in a module environment or browser environment
  const isNode = typeof module !== 'undefined' && module.exports;
  const isBrowser = typeof window !== 'undefined';
  
  if (!isBrowser && !isNode) {
    console.error('AI Agents: Unsupported environment');
    return;
  }

  // In browser environment, load all dependencies
  if (isBrowser) {
    // Ensure all dependencies are loaded before initializing
    function checkDependencies() {
      const requiredClasses = [
        'AIUtils',
        'ChromeIntegration', 
        'SummarizerAgent',
        'TranslatorAgent',
        'PrompterAgent',
        'WriterAgent'
      ];
      
      for (const className of requiredClasses) {
        if (typeof window[className] === 'undefined') {
          console.warn(`AI Agents: ${className} not loaded yet`);
          return false;
        }
      }
      
      return true;
    }

    // Initialize when dependencies are ready
    function initializeAIAgents() {
      if (!checkDependencies()) {
        // Retry after a short delay
        setTimeout(initializeAIAgents, 100);
        return;
      }

      // All dependencies loaded, initialize the main AIAgents class
      console.log('🚀 AI Agents: All modules loaded, initializing multi-agent system...');
      
      // Make sure the core AIAgents class is available
      if (typeof window.AIAgents === 'undefined') {
        console.error('❌ AI Agents: Core AIAgents class not found');
        return;
      }

      // Store the real AIAgents class
      const RealAIAgents = window.AIAgents;

      // Check if there's a compatibility layer instance
      const existingInstance = window.aiAgents;
      const hasCompatibilityLayer = existingInstance && existingInstance.constructor.name === 'AIAgentsCompatibility';

      if (hasCompatibilityLayer) {
        console.log('🔄 AI Agents: Replacing compatibility layer with real multi-agent implementation');
        
        // Get the preferred language from compatibility layer
        const preferredLanguage = existingInstance.preferredLanguage || 'en';
        
        // Create new real instance
        window.aiAgents = new RealAIAgents();
        
        // Apply saved preferences
        if (preferredLanguage !== 'en') {
          window.aiAgents.setPreferredLanguage(preferredLanguage);
          console.log(`✅ Applied saved language preference: ${preferredLanguage}`);
        }
        
        console.log('✅ AI Agents: Compatibility layer replaced with multi-agent system');
      } else if (typeof window.aiAgents === 'undefined') {
        window.aiAgents = new RealAIAgents();
        console.log('✅ AI Agents: Global multi-agent instance created');
      }

      // Ensure the global AIAgents class is the real one
      window.AIAgents = RealAIAgents;

      // Add backward compatibility functions to window
      setupBackwardCompatibility();
      
      // Log the multi-agent architecture
      console.log('🎯 Multi-Agent System Components:');
      console.log('  • Prompter Agent: Intent detection and research');
      console.log('  • Summarizer Agent: Content summarization');
      console.log('  • Translator Agent: Language translation');
      console.log('  • Writer Agent: Content creation');
      console.log('  • Coordination System: Task routing and management');
      
      // Dispatch event to notify that modular system is ready
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const event = new CustomEvent('aiAgentsReady', {
          detail: { 
            hasCompatibilityLayer: hasCompatibilityLayer,
            instance: window.aiAgents,
            multiAgentSystem: true,
            agents: ['prompter', 'summarizer', 'translator', 'writer'],
            coordinator: true
          }
        });
        window.dispatchEvent(event);
        console.log('📡 AI Agents: aiAgentsReady event dispatched (multi-agent system active)');
      }
      
      // Add debug and utility functions
      setupGlobalDebugFunctions();

      console.log('AI Agents: Modular system initialized successfully');
    }

    // Setup backward compatibility functions
    function setupBackwardCompatibility() {
      // Standalone function for page content extraction (backward compatibility)
      if (typeof window.extractPageContentFunction === 'undefined') {
        window.extractPageContentFunction = function() {
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
        };
      }
    }

    // Setup global debug functions
    function setupGlobalDebugFunctions() {
      // Global debug functions
      window.debugAI = async function() {
        console.log('=== Global AI Debug ===');
        if (window.aiAgents) {
          return await window.aiAgents.debugCapabilities();
        } else {
          console.log('aiAgents not initialized. Creating temporary instance...');
          const tempAgents = new window.AIAgents();
          await tempAgents.initialize();
          return await tempAgents.debugCapabilities();
        }
      };

      // Quick environment check
      window.checkAIEnvironment = async function() {
        console.log('=== AI Environment Check ===');
        const results = await window.ChromeIntegration.checkEnvironment();
        console.log('Results:', results);
        
        if (results.recommendations.length > 0) {
          console.log('Recommendations:');
          results.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
          });
        }
        
        return results;
      };

      // Test API creation directly
      window.testAICreation = async function() {
        console.log('=== Testing AI API Creation ===');
        
        try {
          console.log('Testing Summarizer creation...');
          const summarizer = await window.Summarizer.create({
            type: 'key-points',
            format: 'markdown',
            length: 'short',
            outputLanguage: 'en'
          });
          console.log('✓ Summarizer created successfully');
          
          // Test summarization
          const testSummary = await summarizer.summarize('This is a test text for summarization. It contains multiple sentences to test the API functionality.');
          console.log('✓ Summarization test:', testSummary);
          
          summarizer.destroy();
        } catch (error) {
          console.error('✗ Summarizer creation failed:', error);
        }

        try {
          console.log('Testing Translator creation...');
          const translator = await window.Translator.create({
            sourceLanguage: 'en',
            targetLanguage: 'es'
          });
          console.log('✓ Translator created successfully');
          
          // Test translation
          const testTranslation = await translator.translate('Hello, this is a test message for translation.');
          console.log('✓ Translation test (EN->ES):', testTranslation);
          
          translator.destroy();
        } catch (error) {
          console.error('✗ Translator creation failed:', error);
        }

        try {
          console.log('Testing LanguageDetector creation...');
          const detector = await window.LanguageDetector.create();
          console.log('✓ LanguageDetector created successfully');
          
          // Test language detection
          const testDetection = await detector.detect('Hello, this is an English text for testing language detection.');
          console.log('✓ Language detection test:', testDetection);
          
          detector.destroy();
        } catch (error) {
          console.error('✗ LanguageDetector creation failed:', error);
        }

        try {
          console.log('Testing LanguageModel creation...');
          const model = await window.LanguageModel.create();
          console.log('✓ LanguageModel created successfully');
          
          // Test prompting
          const testResponse = await model.prompt('Say hello!');
          console.log('✓ Prompting test:', testResponse);
          
          model.destroy();
        } catch (error) {
          console.error('✗ LanguageModel creation failed:', error);
        }
      };

      // Test all agents
      window.testAllAIAgents = async function() {
        console.log('=== Testing All AI Agents ===');
        if (window.aiAgents) {
          return await window.aiAgents.testAllAgents();
        } else {
          console.log('aiAgents not initialized. Creating temporary instance...');
          const tempAgents = new window.AIAgents();
          await tempAgents.initialize();
          return await tempAgents.testAllAgents();
        }
      };
    }

    // Start initialization
    initializeAIAgents();
  }

  // Node.js environment (for testing or server-side usage)
  if (isNode) {
    // Export all modules
    module.exports = {
      AIUtils: require('./utils'),
      ChromeIntegration: require('./chrome-integration'),
      SummarizerAgent: require('./summarizer'),
      TranslatorAgent: require('./translator'),
      PrompterAgent: require('./prompter'),
      WriterAgent: require('./writer'),
      AIAgents: require('./core')
    };
  }
})();